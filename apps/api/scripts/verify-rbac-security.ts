import { prisma } from '../src/config/prisma.js';
import { Role } from '@prisma/client';
import { AuthService } from '../src/services/auth.service.js';
import { AdminService } from '../src/services/admin.service.js';
import { CompanyService } from '../src/services/company.service.js';
import { CandidateService } from '../src/services/candidate.service.js';
import { verifyOrganizationOwnership } from '../src/middleware/rbac.middleware.js';
import { comparePassword } from '../src/utils/password.util.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  JobMatch RBAC & Security Test Suite Verification    ');
  console.log('======================================================\n');

  const testSuffix = Date.now().toString().slice(-6);

  // 1. Test: Public Registration Role Guard
  console.log('[Test Suite 1: Registration Role Enforcement]');
  try {
    await AuthService.register(
      `hacker_${testSuffix}@test.com`,
      'Password123!',
      Role.PLATFORM_ADMIN
    );
    assert(false, 'Public registration MUST reject PLATFORM_ADMIN');
  } catch (err: any) {
    assert(
      err.message.includes('cannot be registered publicly') || err.message.includes('Privileged'),
      'Public registration rejects PLATFORM_ADMIN with 403 Forbidden',
      err.message
    );
  }

  try {
    await AuthService.register(
      `recruiter_public_${testSuffix}@test.com`,
      'Password123!',
      Role.RECRUITER
    );
    assert(false, 'Public registration MUST reject RECRUITER');
  } catch (err: any) {
    assert(
      err.message.includes('cannot be registered publicly') || err.message.includes('Privileged'),
      'Public registration rejects internal RECRUITER role',
      err.message
    );
  }

  // 2. Test: Candidate Registration and Isolation
  console.log('\n[Test Suite 2: Candidate Role & Data Isolation]');
  const candidateEmail = `candidate_${testSuffix}@test.com`;
  const candidateAuth = await AuthService.register(
    candidateEmail,
    'Password123!',
    Role.CANDIDATE
  );
  assert(candidateAuth.user.role === Role.CANDIDATE, 'Candidate registered successfully with CANDIDATE role');
  assert(!('passwordHash' in (candidateAuth.user as any)), 'Password hash is NOT exposed in UserDto response');

  // 3. Test: Company Creation and Multi-Tenancy
  console.log('\n[Test Suite 3: Multi-Tenant Company Creation]');
  const ownerEmail = `owner_${testSuffix}@test.com`;
  const companyAuth = await AuthService.register(
    ownerEmail,
    'Password123!',
    Role.COMPANY_OWNER,
    `Acme Corp ${testSuffix}`
  );
  assert(companyAuth.user.role === Role.COMPANY_OWNER, 'Company Owner registered successfully');
  assert(Boolean(companyAuth.user.organizationId), 'Company Owner is assigned an organizationId');

  const orgIdA = companyAuth.user.organizationId!;

  // Create second company for cross-tenant isolation testing
  const ownerEmailB = `owner_b_${testSuffix}@test.com`;
  const companyAuthB = await AuthService.register(
    ownerEmailB,
    'Password123!',
    Role.COMPANY_OWNER,
    `Beta Corp ${testSuffix}`
  );
  const orgIdB = companyAuthB.user.organizationId!;
  assert(orgIdA !== orgIdB, 'Organizations have isolated distinct IDs');

  // 4. Test: Recruiter Job Posting & Cross-Tenant Data Isolation
  console.log('\n[Test Suite 4: Cross-Tenant Data Isolation]');
  const jobA = await CompanyService.createJob(orgIdA, companyAuth.user.id, {
    title: 'Senior Frontend Engineer',
    description: 'Build modern AI web applications',
    requirements: ['React', 'TypeScript'],
    salaryMin: 120000,
    salaryMax: 160000,
    location: 'Remote',
  });
  assert(jobA.organizationId === orgIdA, 'Job A belongs strictly to Organization A');

  // Attempt to access or modify Job A from Company B
  try {
    await CompanyService.updateJob(orgIdB, jobA.id, { title: 'Hacked Title' });
    assert(false, 'Cross-tenant mutation MUST be rejected');
  } catch (err: any) {
    assert(
      err.message.includes('not found in this company'),
      'Cross-tenant update blocked: Company B cannot modify Company A job'
    );
  }

  const isOwnerA = verifyOrganizationOwnership(orgIdA, jobA.organizationId);
  const isOwnerB = verifyOrganizationOwnership(orgIdB, jobA.organizationId);
  assert(isOwnerA === true, 'Organization A verified as owner of Job A');
  assert(isOwnerB === false, 'Organization B strictly denied ownership of Job A');

  // 5. Test: Candidate Job Application and Candidate Isolation
  console.log('\n[Test Suite 5: Candidate Applications & Privacy]');
  const application = await CandidateService.applyJob(
    candidateAuth.user.id,
    jobA.id,
    'I am excited to apply for this engineering role'
  );
  assert(application.candidateId === candidateAuth.user.id, 'Application created for candidate');
  assert(application.status === 'APPLIED', 'Initial application stage is APPLIED');

  // Candidate B cannot see Candidate A's applications
  const candidateBAuth = await AuthService.register(
    `candidate_b_${testSuffix}@test.com`,
    'Password123!',
    Role.CANDIDATE
  );
  const candBApps = await CandidateService.getMyApplications(candidateBAuth.user.id);
  assert(candBApps.length === 0, 'Candidate B cannot see Candidate A applications');

  // 6. Test: Recruiter Pipeline & Interview Scheduling
  console.log('\n[Test Suite 6: Recruiter Pipeline & Interview Scheduling]');
  const updatedApp = await CompanyService.updateApplicationStage(
    orgIdA,
    application.id,
    'SHORTLISTED',
    'Candidate has strong portfolio'
  );
  assert(updatedApp.status === 'SHORTLISTED', 'Recruiter moved candidate to SHORTLISTED');

  const interview = await CompanyService.scheduleInterview(orgIdA, {
    applicationId: application.id,
    interviewerId: companyAuth.user.id,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 45,
  });
  assert(interview.status === 'SCHEDULED', 'Interview scheduled successfully');

  // 7. Test: Hiring Manager Evaluation & Hiring Decision
  console.log('\n[Test Suite 7: Hiring Manager Review & Decisions]');
  const evalResult = await CompanyService.submitInterviewEvaluation(
    orgIdA,
    application.id,
    companyAuth.user.id,
    'Exceptional system architecture and communication skills',
    5,
    'STRONG_HIRE'
  );
  assert(evalResult.rating === 5, 'Interview evaluation rating recorded');
  assert(evalResult.stageNotes?.includes('STRONG_HIRE'), 'Evaluation notes recorded');

  const offerResult = await CompanyService.submitHiringDecision(
    orgIdA,
    application.id,
    'OFFERED',
    companyAuth.user.id
  );
  assert(offerResult.status === 'OFFERED', 'Hiring manager executed OFFERED decision');

  // 8. Test: Company Ads Manager Campaign Management
  console.log('\n[Test Suite 8: Company Advertising Campaign Management]');
  const campaign = await CompanyService.createCampaign(orgIdA, companyAuth.user.id, {
    name: 'Q4 Frontend Spotlight',
    budget: 1500,
    dailyBudget: 100,
    jobId: jobA.id,
  });
  assert(campaign.budget === 1500, 'Campaign created with specified budget');
  assert(campaign.organizationId === orgIdA, 'Campaign belongs strictly to Organization A');

  // Cross-tenant ad access prevention
  try {
    await CompanyService.updateCampaignStatus(orgIdB, campaign.id, 'PAUSED');
    assert(false, 'Cross-tenant campaign update MUST fail');
  } catch (err: any) {
    assert(
      err.message.includes('not found in your organization'),
      'Cross-tenant campaign access blocked: Company B cannot touch Company A campaign'
    );
  }

  // 9. Test: Platform Administrator & Admin Manager Provisioning
  console.log('\n[Test Suite 9: Administrator Security & Granular Permissions]');
  const adminManager = await AdminService.createAdminManager({
    email: `admin_mgr_${testSuffix}@test.com`,
    passwordPlain: 'SecretAdmin2026!',
    permissions: ['MANAGE_JOBS', 'VIEW_REPORTS'],
  });
  assert(adminManager.role === Role.ADMIN_MANAGER, 'Admin Manager account provisioned');
  assert(adminManager.adminPermissions.includes('MANAGE_JOBS'), 'Admin Manager assigned MANAGE_JOBS permission');
  assert(!adminManager.adminPermissions.includes('MANAGE_COMPANIES'), 'Admin Manager does NOT have ungranted MANAGE_COMPANIES');

  // Test admin manager login
  const adminLoginResult = await AuthService.adminLogin(
    `admin_mgr_${testSuffix}@test.com`,
    'SecretAdmin2026!'
  );
  assert(adminLoginResult.user.role === Role.ADMIN_MANAGER, 'Admin Manager logged in via adminLogin');

  // Candidate attempting admin login must be rejected
  try {
    await AuthService.adminLogin(candidateEmail, 'Password123!');
    assert(false, 'Candidate MUST NOT authenticate through admin login');
  } catch (err: any) {
    assert(
      err.message.includes('Invalid email or password'),
      'Candidate login attempt to admin portal blocked with generic 401'
    );
  }

  // 10. Test: Security Audit Logs Verification
  console.log('\n[Test Suite 10: Immutable Security Audit Logging]');
  const logsResult = await AdminService.getOverviewStats();
  assert(logsResult.recentAuditLogs.length > 0, 'Audit logs recorded for authentication, jobs, and admin actions');
  const hasRegLog = logsResult.recentAuditLogs.some((l) => l.action.includes('USER_REGISTERED') || l.action.includes('ADMIN'));
  assert(hasRegLog, 'Security events accurately tracked in audit log table');

  // Summary
  console.log('\n======================================================');
  console.log(`  Tests Completed: ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
