import { prisma } from '../src/config/prisma.js';
import { Role } from '@prisma/client';
import { hashPassword } from '../src/utils/password.util.js';

const DEFAULT_PASSWORD = 'Password123!';

async function seed() {
  console.log('\n=============================================================');
  console.log('   MatchMyJobs - Comprehensive Multi-Role Demo Seeder        ');
  console.log('=============================================================\n');

  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

  // 1. Clean existing test accounts if present to ensure clean idempotent seed
  const testEmails = [
    'admin@matchmyjobs.com',
    'admin.manager@matchmyjobs.com',
    'owner@technova.io',
    'recruiter@technova.io',
    'hiring.manager@technova.io',
    'ads.manager@technova.io',
    'candidate@jobseeker.com',
  ];

  for (const email of testEmails) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Cleaning existing test user: ${email}`);
      await prisma.user.delete({ where: { email } });
    }
  }

  // 2. Create Platform Administrator (Full Super Admin)
  const platformAdmin = await prisma.user.create({
    data: {
      email: 'admin@matchmyjobs.com',
      passwordHash: hashedPassword,
      role: Role.PLATFORM_ADMIN,
      status: 'ACTIVE',
      isEmailVerified: true,
      adminPermissions: ['MANAGE_COMPANIES', 'MANAGE_CANDIDATES', 'VIEW_REPORTS', 'MANAGE_JOBS', 'SYSTEM_CONFIG'],
    },
  });
  console.log('✓ Provisioned PLATFORM_ADMIN: admin@matchmyjobs.com');

  // 3. Create Admin Manager (Delegated Admin with specific permissions)
  const adminManager = await prisma.user.create({
    data: {
      email: 'admin.manager@matchmyjobs.com',
      passwordHash: hashedPassword,
      role: Role.ADMIN_MANAGER,
      status: 'ACTIVE',
      isEmailVerified: true,
      adminPermissions: ['MANAGE_COMPANIES', 'MANAGE_CANDIDATES', 'VIEW_REPORTS'],
    },
  });
  console.log('✓ Provisioned ADMIN_MANAGER: admin.manager@matchmyjobs.com');

  // 4. Create Company Organization
  const company = await prisma.company.upsert({
    where: { slug: 'technova-innovations' },
    update: {},
    create: {
      name: 'TechNova Innovations',
      slug: 'technova-innovations',
      website: 'https://technova.io',
      industry: 'Software & Cloud Solutions',
      size: '51-200',
      description: 'Pioneering intelligent cloud software, developer tooling, and AI infrastructure.',
      location: 'San Francisco, CA',
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created Organization: TechNova Innovations (ID: ' + company.id + ')');

  // 5. Create Company Owner
  const companyOwner = await prisma.user.create({
    data: {
      email: 'owner@technova.io',
      passwordHash: hashedPassword,
      role: Role.COMPANY_OWNER,
      status: 'ACTIVE',
      isEmailVerified: true,
      organizationId: company.id,
      companyProfile: {
        create: {
          name: 'TechNova Innovations',
          website: 'https://technova.io',
          industry: 'Software & Cloud Solutions',
          size: '51-200',
          description: 'Pioneering intelligent cloud software, developer tooling, and AI infrastructure.',
          location: 'San Francisco, CA',
        },
      },
    },
  });
  // Update company ownerId
  await prisma.company.update({
    where: { id: company.id },
    data: { ownerId: companyOwner.id },
  });
  console.log('✓ Provisioned COMPANY_OWNER: owner@technova.io');

  // 6. Create Recruiter
  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@technova.io',
      passwordHash: hashedPassword,
      role: Role.RECRUITER,
      status: 'ACTIVE',
      isEmailVerified: true,
      organizationId: company.id,
    },
  });
  console.log('✓ Provisioned RECRUITER: recruiter@technova.io');

  // 7. Create Hiring Manager
  const hiringManager = await prisma.user.create({
    data: {
      email: 'hiring.manager@technova.io',
      passwordHash: hashedPassword,
      role: Role.HIRING_MANAGER,
      status: 'ACTIVE',
      isEmailVerified: true,
      organizationId: company.id,
    },
  });
  console.log('✓ Provisioned HIRING_MANAGER: hiring.manager@technova.io');

  // 8. Create Company Ads Manager
  const adsManager = await prisma.user.create({
    data: {
      email: 'ads.manager@technova.io',
      passwordHash: hashedPassword,
      role: Role.ADS_MANAGER,
      status: 'ACTIVE',
      isEmailVerified: true,
      organizationId: company.id,
    },
  });
  console.log('✓ Provisioned ADS_MANAGER: ads.manager@technova.io');

  // 9. Create Candidate
  const candidate = await prisma.user.create({
    data: {
      email: 'candidate@jobseeker.com',
      passwordHash: hashedPassword,
      role: Role.CANDIDATE,
      status: 'ACTIVE',
      isEmailVerified: true,
      candidateProfile: {
        create: {
          fullName: 'Sarah Jenkins',
          headline: 'Senior Full Stack Engineer & Cloud Architect',
          bio: 'Passionate software engineer with 6+ years of experience designing resilient distributed systems and full-stack web applications using React, TypeScript, Node.js, and PostgreSQL.',
          phone: '+1 (555) 345-6789',
          skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'TailwindCSS', 'Python'],
          location: 'San Francisco, CA (Remote)',
          expectedSalaryMin: 145000,
          expectedSalaryMax: 185000,
          salaryCurrency: 'USD',
          jobTypePreference: 'FULL_TIME',
        },
      },
    },
  });
  console.log('✓ Provisioned CANDIDATE: candidate@jobseeker.com');

  // 10. Create Sample Jobs for TechNova
  const job1 = await prisma.job.create({
    data: {
      organizationId: company.id,
      createdById: recruiter.id,
      assignedHiringManagerId: hiringManager.id,
      title: 'Senior Full Stack Engineer',
      description: '<p>TechNova is seeking a <strong>Senior Full Stack Engineer</strong> to lead the architecture of our cloud web platforms.</p><h3>Key Responsibilities</h3><ul><li>Build high-scale React & TypeScript user interfaces.</li><li>Design resilient REST and GraphQL APIs with Node.js and PostgreSQL.</li><li>Collaborate with product and design teams.</li></ul>',
      requirements: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      department: 'Engineering',
      location: 'San Francisco, CA',
      workplaceType: 'remote',
      jobType: 'FULL_TIME',
      salaryMin: 140000,
      salaryMax: 180000,
      currency: 'USD',
      status: 'PUBLISHED',
      isPromoted: true,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      organizationId: company.id,
      createdById: recruiter.id,
      assignedHiringManagerId: hiringManager.id,
      title: 'Frontend React Developer',
      description: '<p>Looking for an experienced Frontend specialist skilled in modern component systems, TailwindCSS, and performance optimization.</p>',
      requirements: ['React', 'TypeScript', 'TailwindCSS', 'Next.js'],
      department: 'Product Development',
      location: 'Austin, TX',
      workplaceType: 'hybrid',
      jobType: 'FULL_TIME',
      salaryMin: 120000,
      salaryMax: 150000,
      currency: 'USD',
      status: 'PUBLISHED',
      isPromoted: false,
    },
  });
  console.log('✓ Created Sample Jobs: "Senior Full Stack Engineer" & "Frontend React Developer"');

  // 11. Create Application for Candidate to Job 1
  const application = await prisma.application.create({
    data: {
      jobId: job1.id,
      candidateId: candidate.id,
      status: 'SHORTLISTED',
      coverLetter: 'I am excited to apply for the Senior Full Stack Engineer role at TechNova. My experience directly matches your tech stack.',
      stageNotes: 'Strong resume and relevant cloud infrastructure portfolio.',
      rating: 5,
    },
  });
  console.log('✓ Created Application: Sarah Jenkins -> Senior Full Stack Engineer (SHORTLISTED)');

  // 12. Create Interview for Application
  const interviewDate = new Date();
  interviewDate.setDate(interviewDate.getDate() + 2); // 2 days from now
  interviewDate.setHours(14, 0, 0, 0);

  await prisma.interview.create({
    data: {
      applicationId: application.id,
      candidateId: candidate.id,
      interviewerId: hiringManager.id,
      scheduledAt: interviewDate,
      durationMinutes: 45,
      meetingUrl: 'https://meet.google.com/abc-demo-job',
      status: 'SCHEDULED',
      feedback: 'Candidate demonstrated exceptional proficiency in system design and React performance.',
      rating: 5,
      recommendation: 'STRONG_HIRE',
    },
  });
  console.log('✓ Created Interview: Scheduled with Hiring Manager on ' + interviewDate.toLocaleDateString());

  // 13. Create Advertising Campaign for Ads Manager
  await prisma.advertisingCampaign.create({
    data: {
      organizationId: company.id,
      createdById: adsManager.id,
      jobId: job1.id,
      name: 'Q4 Senior Engineering Talent Drive',
      budget: 5000,
      dailyBudget: 250,
      spent: 1250,
      status: 'ACTIVE',
      impressions: 14250,
      clicks: 890,
      conversions: 42,
    },
  });
  console.log('✓ Created Ad Campaign: "Q4 Senior Engineering Talent Drive" for Ads Manager');

  // 14. Create AI Match Record
  await prisma.jobMatch.create({
    data: {
      jobId: job1.id,
      candidateId: candidate.id,
      score: 94.5,
      reason: 'Exceptional skill overlap in React, TypeScript, Node.js, and PostgreSQL with matching salary expectation.',
      matchedSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      missingSkills: [],
    },
  });
  console.log('✓ Created AI Match Score: 94.5% Match');

  console.log('\n=============================================================');
  console.log('   ALL DEMO ACCOUNTS AND DATA SEEDED SUCCESSFULLY!           ');
  console.log('=============================================================\n');
}

seed()
  .catch((err) => {
    console.error('Seed Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
