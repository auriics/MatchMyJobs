import axios from 'axios';

const API = 'http://localhost:5001/api';

async function run() {
  console.log('--- STARTING PHASE 2 ENDPOINT VERIFICATION ---');

  // 1. Register a Candidate
  const candEmail = `phase2_cand_${Date.now()}@example.com`;
  const candRes = await axios.post(`${API}/auth/register`, {
    email: candEmail,
    password: 'Password123!',
    role: 'CANDIDATE',
  });
  const candToken = candRes.data.data.tokens.accessToken;
  console.log('✓ Registered test candidate:', candEmail);

  // 2. Test Resume Parse with Raw Text
  const resumeText = `
Alex Mercer
alex.mercer@techjobs.io
(555) 234-5678
Full-Stack Software Engineer with 5+ years of experience building scalable web applications with React, TypeScript, Node.js, and PostgreSQL.

SKILLS:
React, TypeScript, JavaScript, Node.js, Express, PostgreSQL, Redis, Docker, AWS, GraphQL, Git

EXPERIENCE:
Senior Frontend Developer at CloudScale Technologies (2022 - Present)
- Architected performant dashboard with Next.js and TypeScript.
- Integrated GraphQL API and optimized state management.

Full Stack Engineer at ByteWave Solutions (2019 - 2022)
- Built microservices using Node.js and PostgreSQL.

EDUCATION:
BS in Computer Science, Georgia Tech (2019)
`;

  const parseRes = await axios.post(
    `${API}/resume/parse`,
    { rawText: resumeText },
    { headers: { Authorization: `Bearer ${candToken}` } }
  );
  console.log('✓ Resume parse response:');
  console.log('  Name:', parseRes.data.data.parsedData.name);
  console.log('  Email:', parseRes.data.data.parsedData.email);
  console.log('  Skills extracted:', parseRes.data.data.parsedData.skills.length, parseRes.data.data.parsedData.skills.slice(0, 5));

  // 3. Test Register a Company Owner
  const ownerEmail = `phase2_owner_${Date.now()}@company.com`;
  const ownerRes = await axios.post(`${API}/auth/register`, {
    email: ownerEmail,
    password: 'Password123!',
    role: 'COMPANY_OWNER',
    companyName: 'Vertex AI Labs',
  });
  const ownerToken = ownerRes.data.data.tokens.accessToken;
  console.log('✓ Registered test company owner:', ownerEmail);

  // 4. Test GET & PUT Company Profile
  const compProfileGet = await axios.get(`${API}/company/profile`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  console.log('✓ GET /company/profile:', compProfileGet.data.data.name);

  const compProfilePut = await axios.put(
    `${API}/company/profile`,
    {
      description: 'Building next-generation generative AI workforce solutions.',
      industry: 'Artificial Intelligence',
      location: 'San Francisco, CA',
      website: 'https://vertexai.example.com',
      size: '51-200',
    },
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );
  console.log('✓ PUT /company/profile updated industry:', compProfilePut.data.data.industry);

  // 5. Test Create Job listing
  const createJobRes = await axios.post(
    `${API}/jobs`,
    {
      title: 'Senior React & TypeScript Engineer',
      description: 'Lead development of next-gen job matching user interfaces using React, TypeScript, and modern state architectures.',
      requirements: ['React', 'TypeScript', 'Node.js', 'TailwindCSS'],
      department: 'Engineering',
      location: 'San Francisco, CA',
      workplaceType: 'remote',
      jobType: 'FULL_TIME',
      salaryMin: 140000,
      salaryMax: 180000,
      status: 'active',
    },
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );
  const newJobId = createJobRes.data.data.id;
  console.log('✓ POST /jobs created job:', newJobId, createJobRes.data.data.title);

  // 6. Test GET /jobs filter
  const listJobsRes = await axios.get(`${API}/jobs?keyword=React&workplaceType=remote`);
  console.log('✓ GET /jobs with filter found:', listJobsRes.data.data.jobs.length, 'jobs');

  // 7. Test PUT /jobs/:id
  const updateJobRes = await axios.put(
    `${API}/jobs/${newJobId}`,
    { salaryMax: 190000 },
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );
  console.log('✓ PUT /jobs/:id updated salaryMax:', updateJobRes.data.data.salaryMax);

  // 8. Test AI Job Matching for Candidate: POST /api/match/jobs
  const matchJobsRes = await axios.post(
    `${API}/match/jobs`,
    {},
    { headers: { Authorization: `Bearer ${candToken}` } }
  );
  console.log('✓ POST /api/match/jobs scored jobs:');
  for (const m of matchJobsRes.data.data.slice(0, 3)) {
    console.log(`  - ${m.job.title}: ${m.score}% Match | Reason: "${m.reason}"`);
  }

  // 9. Test GET /api/match/jobs for Candidate
  const getMatchesRes = await axios.get(`${API}/match/jobs`, {
    headers: { Authorization: `Bearer ${candToken}` },
  });
  console.log('✓ GET /api/match/jobs returned', getMatchesRes.data.data.length, 'matches');

  // 10. Test AI Candidate Matching for Recruiter: POST /api/match/candidates
  const matchCandidatesRes = await axios.post(
    `${API}/match/candidates`,
    { jobId: newJobId },
    { headers: { Authorization: `Bearer ${ownerToken}` } }
  );
  console.log('✓ POST /api/match/candidates scored candidates for job:');
  for (const c of matchCandidatesRes.data.data.slice(0, 3)) {
    console.log(`  - Candidate: ${c.candidate.fullName}: ${c.score}% Match | Reason: "${c.reason}"`);
  }

  // 11. Test Soft-Delete: DELETE /api/jobs/:id
  const deleteJobRes = await axios.delete(`${API}/jobs/${newJobId}`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  console.log('✓ DELETE /jobs/:id soft-archived job status:', deleteJobRes.data.data.status);

  console.log('\n=================================================');
  console.log('ALL PHASE 2 BACKEND ENDPOINTS PASSED SUCCESSFULLY!');
  console.log('=================================================');
}

run().catch((err) => {
  console.error('VERIFICATION ERROR:', err.response?.data || err.message);
  process.exit(1);
});
