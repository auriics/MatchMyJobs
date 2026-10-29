import { prisma } from '../src/config/prisma.js';
import { Role } from '@prisma/client';
import { hashPassword } from '../src/utils/password.util.js';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const API_PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${API_PORT}`;
const DEFAULT_PASSWORD = 'Password123!';

interface TestResult {
  id: string;
  category: string;
  roleUnderScore: string;
  scenario: string;
  endpoint: string;
  httpMethod: string;
  expectedStatus: number;
  actualStatus: number;
  executionTimeMs: number;
  details: any;
  passed: boolean;
}

const testResults: TestResult[] = [];

// Helper HTTP request function
function makeRequest(
  urlPath: string,
  method: string,
  token?: string,
  bodyData?: any
): Promise<{ status: number; data: any; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const postData = bodyData ? JSON.stringify(bodyData) : '';
    const parsedUrl = new URL(urlPath, BASE_URL);

    const options: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        const durationMs = Date.now() - startTime;
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({ status: res.statusCode || 500, data: parsed, durationMs });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function loginUser(email: string, password = DEFAULT_PASSWORD): Promise<string> {
  const res = await makeRequest('/api/auth/login', 'POST', undefined, { email, password });
  if (res.status !== 200 || !res.data?.data?.tokens?.accessToken) {
    throw new Error(`Login failed for ${email}: Status ${res.status} - ${JSON.stringify(res.data)}`);
  }
  return res.data.data.tokens.accessToken;
}

async function run() {
  console.log('\n========================================================================');
  console.log('   MATCHMYJOBS — MULTI-ROLE AI MATCHING & DATABASE VALIDATION SUITE     ');
  console.log('========================================================================\n');

  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

  // ========================================================================
  // PHASE 1: DATABASE PROVISIONING & CANDIDATE / JOB PROFILES UPDATE
  // ========================================================================
  console.log('[Phase 1/4] Updating Database with Rich User Profiles, Skills & JDs...');

  // 1. Get or Create Organization
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'TechNova Solutions',
        slug: 'technova-solutions-' + Date.now(),
        website: 'https://technova.io',
        industry: 'Software & Cloud Solutions',
        size: '51-200',
        location: 'San Francisco, CA',
        description: 'Leading AI and cloud engineering platform.',
        status: 'ACTIVE',
      },
    });
  }

  // 2. Ensure all Roles Exist
  const rolesToEnsure = [
    { email: 'admin_124272@test.com', role: Role.PLATFORM_ADMIN, orgId: null },
    { email: 'owner_124272@test.com', role: Role.COMPANY_OWNER, orgId: company.id },
    { email: 'recruiter_124272@test.com', role: Role.RECRUITER, orgId: company.id },
    { email: 'hiring_manager_124272@test.com', role: Role.HIRING_MANAGER, orgId: company.id },
    { email: 'candidate_124272@test.com', role: Role.CANDIDATE, orgId: null },
  ];

  for (const r of rolesToEnsure) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: {
        passwordHash: hashedPassword,
        role: r.role,
        organizationId: r.orgId,
        status: 'ACTIVE',
      },
      create: {
        email: r.email,
        passwordHash: hashedPassword,
        role: r.role,
        organizationId: r.orgId,
        status: 'ACTIVE',
      },
    });
  }

  // 3. Update Primary Candidate Profile in PostgreSQL
  const candidateUser = await prisma.user.findUnique({ where: { email: 'candidate_124272@test.com' } });
  if (candidateUser) {
    await prisma.candidateProfile.upsert({
      where: { userId: candidateUser.id },
      update: {
        fullName: 'Alex Morgan (Lead Fullstack Dev)',
        headline: 'Senior Full Stack & Frontend Engineer',
        bio: '7+ years architecting web applications, scalable APIs, and reactive interfaces using React, TypeScript, Next.js, and Node.js.',
        skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'TailwindCSS', 'PostgreSQL', 'Docker', 'GraphQL', 'Redux'],
        experience: [
          {
            title: 'Senior Frontend Engineer',
            company: 'TechCorp Inc.',
            years: 4,
            description: 'Led architecture of React/TypeScript single-page applications and Next.js SSR platforms.',
          },
          {
            title: 'Fullstack Developer',
            company: 'DevStudio',
            years: 3,
            description: 'Built REST & GraphQL microservices in Node.js and PostgreSQL.',
          },
        ],
        education: [
          {
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'UC Berkeley',
            year: 2017,
          },
        ],
        location: 'San Francisco, CA',
        expectedSalaryMin: 140000,
        expectedSalaryMax: 170000,
        salaryCurrency: 'USD',
        jobTypePreference: 'FULL_TIME',
      },
      create: {
        userId: candidateUser.id,
        fullName: 'Alex Morgan (Lead Fullstack Dev)',
        headline: 'Senior Full Stack & Frontend Engineer',
        bio: '7+ years architecting web applications, scalable APIs, and reactive interfaces using React, TypeScript, Next.js, and Node.js.',
        skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'TailwindCSS', 'PostgreSQL', 'Docker', 'GraphQL', 'Redux'],
        experience: [
          {
            title: 'Senior Frontend Engineer',
            company: 'TechCorp Inc.',
            years: 4,
            description: 'Led architecture of React/TypeScript single-page applications and Next.js SSR platforms.',
          },
        ],
        education: [
          {
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'UC Berkeley',
            year: 2017,
          },
        ],
        location: 'San Francisco, CA',
        expectedSalaryMin: 140000,
        expectedSalaryMax: 170000,
        salaryCurrency: 'USD',
        jobTypePreference: 'FULL_TIME',
      },
    });
    console.log('✓ Candidate profile updated in PostgreSQL for Alex Morgan (React, TypeScript, Node.js, Next.js)');
  }

  // 4. Create Secondary Specialized Candidate (AI / Python Engineer)
  const aiCandidateUser = await prisma.user.upsert({
    where: { email: 'cand_ai_python@test.com' },
    update: { passwordHash: hashedPassword, role: Role.CANDIDATE, status: 'ACTIVE' },
    create: { email: 'cand_ai_python@test.com', passwordHash: hashedPassword, role: Role.CANDIDATE, status: 'ACTIVE' },
  });

  await prisma.candidateProfile.upsert({
    where: { userId: aiCandidateUser.id },
    update: {
      fullName: 'Dr. Elena Rostova (AI/ML Scientist)',
      headline: 'Senior AI & Machine Learning Engineer',
      bio: 'PhD in Computer Science specializing in Deep Learning, PyTorch, LangChain, and high-performance Python microservices.',
      skills: ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'Docker', 'AWS', 'TensorFlow', 'PostgreSQL'],
      experience: [{ title: 'Staff Machine Learning Engineer', company: 'AI Labs', years: 6 }],
      education: [{ degree: 'Ph.D.', field: 'Artificial Intelligence', institution: 'Stanford University', year: 2018 }],
      location: 'San Francisco, CA',
      expectedSalaryMin: 160000,
      expectedSalaryMax: 195000,
    },
    create: {
      userId: aiCandidateUser.id,
      fullName: 'Dr. Elena Rostova (AI/ML Scientist)',
      headline: 'Senior AI & Machine Learning Engineer',
      bio: 'PhD in Computer Science specializing in Deep Learning, PyTorch, LangChain, and high-performance Python microservices.',
      skills: ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'Docker', 'AWS', 'TensorFlow', 'PostgreSQL'],
      experience: [{ title: 'Staff Machine Learning Engineer', company: 'AI Labs', years: 6 }],
      education: [{ degree: 'Ph.D.', field: 'Artificial Intelligence', institution: 'Stanford University', year: 2018 }],
      location: 'San Francisco, CA',
      expectedSalaryMin: 160000,
      expectedSalaryMax: 195000,
    },
  });
  console.log('✓ Provisioned second candidate: Dr. Elena Rostova (Python, PyTorch, LangChain, FastAPI)');

  // 5. Create Tertiary Candidate (Unrelated Profile: Executive Chef)
  const chefUser = await prisma.user.upsert({
    where: { email: 'cand_chef@test.com' },
    update: { passwordHash: hashedPassword, role: Role.CANDIDATE, status: 'ACTIVE' },
    create: { email: 'cand_chef@test.com', passwordHash: hashedPassword, role: Role.CANDIDATE, status: 'ACTIVE' },
  });

  await prisma.candidateProfile.upsert({
    where: { userId: chefUser.id },
    update: {
      fullName: 'Marco Rossi (Culinary Director)',
      headline: 'Executive Chef & Culinary Operations Manager',
      bio: 'Award-winning culinary director with 12 years managing Michelin-star kitchens, inventory, and HACCP compliance.',
      skills: ['Culinary Arts', 'Menu Engineering', 'HACCP', 'Food Safety', 'Kitchen Management', 'Pastry'],
      location: 'New York, NY',
      expectedSalaryMin: 75000,
      expectedSalaryMax: 95000,
    },
    create: {
      userId: chefUser.id,
      fullName: 'Marco Rossi (Culinary Director)',
      headline: 'Executive Chef & Culinary Operations Manager',
      bio: 'Award-winning culinary director with 12 years managing Michelin-star kitchens, inventory, and HACCP compliance.',
      skills: ['Culinary Arts', 'Menu Engineering', 'HACCP', 'Food Safety', 'Kitchen Management', 'Pastry'],
      location: 'New York, NY',
      expectedSalaryMin: 75000,
      expectedSalaryMax: 95000,
    },
  });
  console.log('✓ Provisioned third candidate: Marco Rossi (Executive Chef - Unrelated profile test)');

  // 6. Provision Published Jobs in Database
  const ownerUser = await prisma.user.findUnique({ where: { email: 'owner_124272@test.com' } });
  if (!ownerUser) throw new Error('Owner user not found');

  // Job 1: Senior Frontend Engineer
  const jobFrontend = await prisma.job.upsert({
    where: { id: 'bf22a603-d511-474b-ad9c-c91e4d56bda1' },
    update: {
      title: 'Senior Frontend Engineer',
      description: 'We are seeking an expert Frontend Engineer to build high-performance web applications using React, TypeScript, Next.js, and modern CSS.',
      requirements: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
      department: 'Engineering',
      location: 'San Francisco, CA',
      jobType: 'FULL_TIME',
      workplaceType: 'remote',
      salaryMin: 140000,
      salaryMax: 165000,
      status: 'PUBLISHED',
      organizationId: company.id,
      createdById: ownerUser.id,
    },
    create: {
      id: 'bf22a603-d511-474b-ad9c-c91e4d56bda1',
      title: 'Senior Frontend Engineer',
      description: 'We are seeking an expert Frontend Engineer to build high-performance web applications using React, TypeScript, Next.js, and modern CSS.',
      requirements: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
      department: 'Engineering',
      location: 'San Francisco, CA',
      jobType: 'FULL_TIME',
      workplaceType: 'remote',
      salaryMin: 140000,
      salaryMax: 165000,
      status: 'PUBLISHED',
      organizationId: company.id,
      createdById: ownerUser.id,
    },
  });

  // Job 2: Senior AI & Python Engineer
  const jobAI = await prisma.job.upsert({
    where: { id: 'cf33b704-e622-585c-be0d-d02f5e67cea2' },
    update: {
      title: 'Senior AI & Python Engineer',
      description: 'Lead generative AI architectures and LLM microservices using Python, PyTorch, LangChain, and FastAPI.',
      requirements: ['Python', 'FastAPI', 'PyTorch', 'LangChain', 'Docker'],
      department: 'AI & Data Science',
      location: 'San Francisco, CA',
      jobType: 'FULL_TIME',
      workplaceType: 'hybrid',
      salaryMin: 155000,
      salaryMax: 185000,
      status: 'PUBLISHED',
      organizationId: company.id,
      createdById: ownerUser.id,
    },
    create: {
      id: 'cf33b704-e622-585c-be0d-d02f5e67cea2',
      title: 'Senior AI & Python Engineer',
      description: 'Lead generative AI architectures and LLM microservices using Python, PyTorch, LangChain, and FastAPI.',
      requirements: ['Python', 'FastAPI', 'PyTorch', 'LangChain', 'Docker'],
      department: 'AI & Data Science',
      location: 'San Francisco, CA',
      jobType: 'FULL_TIME',
      workplaceType: 'hybrid',
      salaryMin: 155000,
      salaryMax: 185000,
      status: 'PUBLISHED',
      organizationId: company.id,
      createdById: ownerUser.id,
    },
  });

  // Job 3: Executive Chef & Hospitality Director
  const jobChef = await prisma.job.upsert({
    where: { id: 'df44c805-f733-696d-cf1e-e13a6f78dfb3' },
    update: {
      title: 'Executive Chef & Kitchen Lead',
      description: 'Oversee corporate culinary operations, recipe formulation, kitchen staffing, and food safety standards.',
      requirements: ['Culinary Arts', 'Menu Engineering', 'HACCP', 'Food Safety'],
      department: 'Hospitality',
      location: 'New York, NY',
      jobType: 'FULL_TIME',
      workplaceType: 'onsite',
      salaryMin: 70000,
      salaryMax: 90000,
      status: 'PUBLISHED',
      organizationId: company.id,
      createdById: ownerUser.id,
    },
    create: {
      id: 'df44c805-f733-696d-cf1e-e13a6f78dfb3',
      title: 'Executive Chef & Kitchen Lead',
      description: 'Oversee corporate culinary operations, recipe formulation, kitchen staffing, and food safety standards.',
      requirements: ['Culinary Arts', 'Menu Engineering', 'HACCP', 'Food Safety'],
      department: 'Hospitality',
      location: 'New York, NY',
      jobType: 'FULL_TIME',
      workplaceType: 'onsite',
      salaryMin: 70000,
      salaryMax: 90000,
      status: 'PUBLISHED',
      organizationId: company.id,
      createdById: ownerUser.id,
    },
  });

  console.log('✓ Successfully configured 3 published jobs in database:\n' +
    `  - ${jobFrontend.title} (ID: ${jobFrontend.id})\n` +
    `  - ${jobAI.title} (ID: ${jobAI.id})\n` +
    `  - ${jobChef.title} (ID: ${jobChef.id})\n`);

  // ========================================================================
  // PHASE 2: AUTHENTICATING ALL ROLES & OBTAINING LIVE TOKENS
  // ========================================================================
  console.log('[Phase 2/4] Authenticating all 5 user roles via /api/auth/login...');

  const tokens = {
    candidate: await loginUser('candidate_124272@test.com'),
    recruiter: await loginUser('recruiter_124272@test.com'),
    hiringManager: await loginUser('hiring_manager_124272@test.com'),
    companyOwner: await loginUser('owner_124272@test.com'),
    platformAdmin: await loginUser('admin_124272@test.com'),
  };

  console.log('✓ Acquired active JWT access tokens for all 5 roles.\n');

  // ========================================================================
  // PHASE 3: ROLE-BASED MATCHING & RBAC AUTHORIZATION TEST SUITE
  // ========================================================================
  console.log('[Phase 3/4] Executing Multi-Role Matching & RBAC Test Cases...');

  // TEST 1: Candidate Role -> POST /api/match/jobs (Own matches)
  {
    const res = await makeRequest('/api/match/jobs', 'POST', tokens.candidate);
    const passed = res.status === 200 && Array.isArray(res.data?.data) && res.data.data.length > 0;
    testResults.push({
      id: 'TC-ROLE-01',
      category: 'Candidate Role Access',
      roleUnderScore: 'CANDIDATE',
      scenario: 'Candidate matches active jobs against their own profile',
      endpoint: 'POST /api/match/jobs',
      httpMethod: 'POST',
      expectedStatus: 200,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: {
        matchesFound: res.data?.data?.length || 0,
        topMatchJob: res.data?.data?.[0]?.job?.title,
        topMatchScore: res.data?.data?.[0]?.score,
        matchedSkills: res.data?.data?.[0]?.matchedSkills,
        missingSkills: res.data?.data?.[0]?.missingSkills,
        reason: res.data?.data?.[0]?.reason,
      },
      passed,
    });
    console.log(`[TC-ROLE-01] CANDIDATE -> POST /api/match/jobs: Status ${res.status} (${res.durationMs}ms) - Top Job: "${res.data?.data?.[0]?.job?.title}" Score: ${res.data?.data?.[0]?.score}%`);
  }

  // TEST 2: Candidate Role -> GET /api/match/jobs (Retrieve persisted matches)
  {
    const res = await makeRequest('/api/match/jobs', 'GET', tokens.candidate);
    const passed = res.status === 200 && Array.isArray(res.data?.data);
    testResults.push({
      id: 'TC-ROLE-02',
      category: 'Candidate Role Access',
      roleUnderScore: 'CANDIDATE',
      scenario: 'Candidate retrieves saved job matches',
      endpoint: 'GET /api/match/jobs',
      httpMethod: 'GET',
      expectedStatus: 200,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: { count: res.data?.data?.length || 0 },
      passed,
    });
    console.log(`[TC-ROLE-02] CANDIDATE -> GET /api/match/jobs: Status ${res.status} (${res.durationMs}ms) - Matches Retrieved: ${res.data?.data?.length}`);
  }

  // TEST 3: Candidate Role -> POST /api/match/candidates (FORBIDDEN RBAC Check)
  {
    const res = await makeRequest('/api/match/candidates', 'POST', tokens.candidate, { jobId: jobFrontend.id });
    const passed = res.status === 403;
    testResults.push({
      id: 'TC-ROLE-03',
      category: 'RBAC Enforcement',
      roleUnderScore: 'CANDIDATE',
      scenario: 'Candidate blocked from querying recruiter candidate-ranking endpoint',
      endpoint: 'POST /api/match/candidates',
      httpMethod: 'POST',
      expectedStatus: 403,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: { error: res.data?.message },
      passed,
    });
    console.log(`[TC-ROLE-03] CANDIDATE -> POST /api/match/candidates (RBAC Guard): Status ${res.status} (Expected 403) - ${res.data?.message}`);
  }

  // TEST 4: Candidate Role -> GET /api/match/candidates/:jobId (FORBIDDEN RBAC Check)
  {
    const res = await makeRequest(`/api/match/candidates/${jobFrontend.id}`, 'GET', tokens.candidate);
    const passed = res.status === 403;
    testResults.push({
      id: 'TC-ROLE-04',
      category: 'RBAC Enforcement',
      roleUnderScore: 'CANDIDATE',
      scenario: 'Candidate blocked from viewing candidates for job',
      endpoint: `GET /api/match/candidates/:jobId`,
      httpMethod: 'GET',
      expectedStatus: 403,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: { error: res.data?.message },
      passed,
    });
    console.log(`[TC-ROLE-04] CANDIDATE -> GET /api/match/candidates/:id (RBAC Guard): Status ${res.status} (Expected 403)`);
  }

  // TEST 5: Recruiter Role -> POST /api/match/candidates (Score candidates for Frontend Job)
  {
    const res = await makeRequest('/api/match/candidates', 'POST', tokens.recruiter, { jobId: jobFrontend.id });
    const passed = res.status === 200 && Array.isArray(res.data?.data) && res.data.data.length > 0;
    testResults.push({
      id: 'TC-ROLE-05',
      category: 'Recruiter Matching',
      roleUnderScore: 'RECRUITER',
      scenario: 'Recruiter scores and ranks all candidates for Senior Frontend role',
      endpoint: 'POST /api/match/candidates',
      httpMethod: 'POST',
      expectedStatus: 200,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: {
        jobTitle: jobFrontend.title,
        rankedCandidates: res.data?.data?.map((c: any) => ({
          name: c.candidate?.fullName,
          score: c.score,
          matchedSkills: c.matchedSkills,
          missingSkills: c.missingSkills,
          reason: c.reason,
        })),
      },
      passed,
    });
    console.log(`[TC-ROLE-05] RECRUITER -> POST /api/match/candidates: Status ${res.status} (${res.durationMs}ms) - Top Candidate: "${res.data?.data?.[0]?.candidate?.fullName}" (${res.data?.data?.[0]?.score}%)`);
  }

  // TEST 6: Recruiter Role -> POST /api/match/candidates (Score candidates for AI Job)
  {
    const res = await makeRequest('/api/match/candidates', 'POST', tokens.recruiter, { jobId: jobAI.id });
    const passed = res.status === 200 && Array.isArray(res.data?.data) && res.data.data.length > 0;
    testResults.push({
      id: 'TC-ROLE-06',
      category: 'Recruiter Matching',
      roleUnderScore: 'RECRUITER',
      scenario: 'Recruiter scores and ranks all candidates for Senior AI & Python role',
      endpoint: 'POST /api/match/candidates',
      httpMethod: 'POST',
      expectedStatus: 200,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: {
        jobTitle: jobAI.title,
        topCandidate: res.data?.data?.[0]?.candidate?.fullName,
        topScore: res.data?.data?.[0]?.score,
        matchedSkills: res.data?.data?.[0]?.matchedSkills,
        missingSkills: res.data?.data?.[0]?.missingSkills,
      },
      passed,
    });
    console.log(`[TC-ROLE-06] RECRUITER -> POST /api/match/candidates (AI Role): Status ${res.status} (${res.durationMs}ms) - Top: "${res.data?.data?.[0]?.candidate?.fullName}" (${res.data?.data?.[0]?.score}%)`);
  }

  // TEST 7: Recruiter Role -> POST /api/match/jobs (FORBIDDEN RBAC Check)
  {
    const res = await makeRequest('/api/match/jobs', 'POST', tokens.recruiter);
    const passed = res.status === 403;
    testResults.push({
      id: 'TC-ROLE-07',
      category: 'RBAC Enforcement',
      roleUnderScore: 'RECRUITER',
      scenario: 'Recruiter blocked from calling candidate-specific job match endpoint',
      endpoint: 'POST /api/match/jobs',
      httpMethod: 'POST',
      expectedStatus: 403,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: { error: res.data?.message },
      passed,
    });
    console.log(`[TC-ROLE-07] RECRUITER -> POST /api/match/jobs (RBAC Guard): Status ${res.status} (Expected 403)`);
  }

  // TEST 8: Hiring Manager Role -> POST /api/match/candidates
  {
    const res = await makeRequest('/api/match/candidates', 'POST', tokens.hiringManager, { jobId: jobFrontend.id });
    const passed = res.status === 200 && Array.isArray(res.data?.data);
    testResults.push({
      id: 'TC-ROLE-08',
      category: 'Hiring Manager Access',
      roleUnderScore: 'HIRING_MANAGER',
      scenario: 'Hiring Manager scores candidate pool for Frontend job',
      endpoint: 'POST /api/match/candidates',
      httpMethod: 'POST',
      expectedStatus: 200,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: { count: res.data?.data?.length },
      passed,
    });
    console.log(`[TC-ROLE-08] HIRING_MANAGER -> POST /api/match/candidates: Status ${res.status} (${res.durationMs}ms)`);
  }

  // TEST 9: Hiring Manager Role -> POST /api/match/jobs (FORBIDDEN RBAC Check)
  {
    const res = await makeRequest('/api/match/jobs', 'POST', tokens.hiringManager);
    const passed = res.status === 403;
    testResults.push({
      id: 'TC-ROLE-09',
      category: 'RBAC Enforcement',
      roleUnderScore: 'HIRING_MANAGER',
      scenario: 'Hiring Manager blocked from candidate matching endpoint',
      endpoint: 'POST /api/match/jobs',
      httpMethod: 'POST',
      expectedStatus: 403,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: { error: res.data?.message },
      passed,
    });
    console.log(`[TC-ROLE-09] HIRING_MANAGER -> POST /api/match/jobs (RBAC Guard): Status ${res.status} (Expected 403)`);
  }

  // TEST 10: Company Owner Role -> GET /api/match/candidates/:jobId
  {
    const res = await makeRequest(`/api/match/candidates/${jobChef.id}`, 'GET', tokens.companyOwner);
    const passed = res.status === 200 && Array.isArray(res.data?.data);
    testResults.push({
      id: 'TC-ROLE-10',
      category: 'Company Owner Access',
      roleUnderScore: 'COMPANY_OWNER',
      scenario: 'Company Owner retrieves candidate rankings for Executive Chef job',
      endpoint: `GET /api/match/candidates/:jobId`,
      httpMethod: 'GET',
      expectedStatus: 200,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: {
        jobTitle: jobChef.title,
        topCandidate: res.data?.data?.[0]?.candidate?.fullName,
        topScore: res.data?.data?.[0]?.score,
        matchedSkills: res.data?.data?.[0]?.matchedSkills,
      },
      passed,
    });
    console.log(`[TC-ROLE-10] COMPANY_OWNER -> GET /api/match/candidates/:id: Status ${res.status} (${res.durationMs}ms) - Top: "${res.data?.data?.[0]?.candidate?.fullName}" (${res.data?.data?.[0]?.score}%)`);
  }

  // TEST 11: Platform Admin Role -> POST /api/match/jobs (Admin Bypass Access)
  {
    const res = await makeRequest('/api/match/jobs', 'POST', tokens.platformAdmin);
    const passed = res.status === 200;
    testResults.push({
      id: 'TC-ROLE-11',
      category: 'Platform Admin Access',
      roleUnderScore: 'PLATFORM_ADMIN',
      scenario: 'Platform Admin has unrestricted access to candidate match endpoint',
      endpoint: 'POST /api/match/jobs',
      httpMethod: 'POST',
      expectedStatus: 200,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: { allowed: true },
      passed,
    });
    console.log(`[TC-ROLE-11] PLATFORM_ADMIN -> POST /api/match/jobs (Bypass): Status ${res.status}`);
  }

  // TEST 12: Platform Admin Role -> POST /api/match/candidates (Admin Bypass Access)
  {
    const res = await makeRequest('/api/match/candidates', 'POST', tokens.platformAdmin, { jobId: jobFrontend.id });
    const passed = res.status === 200;
    testResults.push({
      id: 'TC-ROLE-12',
      category: 'Platform Admin Access',
      roleUnderScore: 'PLATFORM_ADMIN',
      scenario: 'Platform Admin has unrestricted access to recruiter match endpoint',
      endpoint: 'POST /api/match/candidates',
      httpMethod: 'POST',
      expectedStatus: 200,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: { allowed: true },
      passed,
    });
    console.log(`[TC-ROLE-12] PLATFORM_ADMIN -> POST /api/match/candidates (Bypass): Status ${res.status}`);
  }

  // TEST 13: Unauthenticated Access -> 401 Unauthorized Guard
  {
    const res = await makeRequest('/api/match/jobs', 'POST');
    const passed = res.status === 401;
    testResults.push({
      id: 'TC-ROLE-13',
      category: 'Authentication Security',
      roleUnderScore: 'ANONYMOUS',
      scenario: 'Unauthenticated requests rejected with 401 Unauthorized',
      endpoint: 'POST /api/match/jobs',
      httpMethod: 'POST',
      expectedStatus: 401,
      actualStatus: res.status,
      executionTimeMs: res.durationMs,
      details: { error: res.data?.message },
      passed,
    });
    console.log(`[TC-ROLE-13] ANONYMOUS -> POST /api/match/jobs: Status ${res.status} (Expected 401)`);
  }

  // ========================================================================
  // PHASE 4: VERIFY PERSISTENCE IN POSTGRESQL JOB_MATCHES TABLE
  // ========================================================================
  console.log('\n[Phase 4/4] Verifying PostgreSQL job_matches table persistence...');

  const dbMatches = await prisma.jobMatch.findMany({
    include: {
      job: { select: { title: true, requirements: true } },
      candidate: { select: { email: true, candidateProfile: { select: { fullName: true, skills: true } } } },
    },
    orderBy: { score: 'desc' },
  });

  console.log(`✓ Total Job Matches in PostgreSQL database: ${dbMatches.length}`);
  dbMatches.forEach((m, idx) => {
    console.log(
      `  [${idx + 1}] Candidate: ${m.candidate?.candidateProfile?.fullName} | Job: "${m.job.title}" | Score: ${m.score}% | Matched: [${m.matchedSkills.join(', ')}] | Missing: [${m.missingSkills.join(', ')}]`
    );
  });

  // Calculate Summary
  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = testResults.filter((t) => !t.passed).length;

  console.log('\n========================================================================');
  console.log(`   EXECUTION SUMMARY: ${passedCount} PASSED | ${failedCount} FAILED (${testResults.length} TOTAL)`);
  console.log('========================================================================\n');

  // Save audit results to JSON
  const outputData = {
    executedAt: new Date().toISOString(),
    totalTestCases: testResults.length,
    passedCount,
    failedCount,
    testResults,
    persistedMatches: dbMatches.map((m) => ({
      id: m.id,
      candidate: m.candidate?.candidateProfile?.fullName,
      email: m.candidate?.email,
      jobTitle: m.job.title,
      jobRequirements: m.job.requirements,
      score: m.score,
      matchedSkills: m.matchedSkills,
      missingSkills: m.missingSkills,
      reason: m.reason,
      createdAt: m.createdAt,
    })),
  };

  const outputPath = path.resolve(__dirname, '../role-matching-audit-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`Results saved to: ${outputPath}`);

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
