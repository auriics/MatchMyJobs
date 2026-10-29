import fs from 'fs';
import path from 'path';

const collection = {
  info: {
    _postman_id: 'a1b2c3d4-mmj-postman-collection-2026',
    name: 'Match My Jobs REST API',
    description: 'Complete production REST API collection for Match My Jobs / AntiGravite platform.\nIncludes all endpoints for Authentication, Profiles, Jobs, Candidate actions, Resumes, AI Matching, Recruiter/Company workflows, and Super Admin / Platform Administration.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5001', type: 'string' },
    { key: 'accessToken', value: '', type: 'string' },
    { key: 'adminToken', value: '', type: 'string' },
    { key: 'refreshToken', value: '', type: 'string' }
  ],
  item: [
    {
      name: '00. Health & Status',
      item: [
        {
          name: 'Health Check',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/health',
              host: ['{{baseUrl}}'],
              path: ['api', 'health']
            },
            description: 'Verify server status, version, and running features.'
          }
        }
      ]
    },
    {
      name: '01. Authentication',
      item: [
        {
          name: 'Register Candidate',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: 'candidate@example.com',
                password: 'Password123!',
                role: 'CANDIDATE'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/auth/register',
              host: ['{{baseUrl}}'],
              path: ['api', 'auth', 'register']
            },
            description: 'Public registration for Candidates.'
          }
        },
        {
          name: 'Register Company Owner',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: 'owner@techcorp.com',
                password: 'Password123!',
                role: 'COMPANY_OWNER',
                companyName: 'TechCorp Solutions'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/auth/register',
              host: ['{{baseUrl}}'],
              path: ['api', 'auth', 'register']
            },
            description: 'Public registration for Company Owners (creates company organization).'
          }
        },
        {
          name: 'Login (Candidate / Company)',
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  'var jsonData = pm.response.json();',
                  'if (jsonData.success && jsonData.data && jsonData.data.tokens) {',
                  '    pm.environment.set("accessToken", jsonData.data.tokens.accessToken);',
                  '    pm.collectionVariables.set("accessToken", jsonData.data.tokens.accessToken);',
                  '    if (jsonData.data.tokens.refreshToken) {',
                  '        pm.environment.set("refreshToken", jsonData.data.tokens.refreshToken);',
                  '        pm.collectionVariables.set("refreshToken", jsonData.data.tokens.refreshToken);',
                  '    }',
                  '    console.log("Access token saved to environment!");',
                  '}'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: 'candidate@example.com',
                password: 'Password123!'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/auth/login',
              host: ['{{baseUrl}}'],
              path: ['api', 'auth', 'login']
            },
            description: 'Standard login. Automatically saves accessToken & refreshToken.'
          }
        },
        {
          name: 'Admin Login (Platform Admin)',
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  'var jsonData = pm.response.json();',
                  'if (jsonData.success && jsonData.data && jsonData.data.tokens) {',
                  '    pm.environment.set("adminToken", jsonData.data.tokens.accessToken);',
                  '    pm.collectionVariables.set("adminToken", jsonData.data.tokens.accessToken);',
                  '    pm.environment.set("accessToken", jsonData.data.tokens.accessToken);',
                  '    pm.collectionVariables.set("accessToken", jsonData.data.tokens.accessToken);',
                  '    console.log("Admin token saved to environment!");',
                  '}'
                ]
              }
            }
          ],
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: 'admin@matchmyjobs.com',
                password: 'AdminPassword123!'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/auth/admin/login',
              host: ['{{baseUrl}}'],
              path: ['api', 'auth', 'admin', 'login']
            },
            description: 'Dedicated login for Platform Admin & Admin Managers. Saves adminToken.'
          }
        },
        {
          name: 'Get Current User (/me)',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/auth/me',
              host: ['{{baseUrl}}'],
              path: ['api', 'auth', 'me']
            },
            description: 'Fetch current authenticated user profile and permissions.'
          }
        },
        {
          name: 'Refresh Token',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                refreshToken: '{{refreshToken}}'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/auth/refresh',
              host: ['{{baseUrl}}'],
              path: ['api', 'auth', 'refresh']
            },
            description: 'Exchange refresh token for a new access token.'
          }
        },
        {
          name: 'Logout',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/auth/logout',
              host: ['{{baseUrl}}'],
              path: ['api', 'auth', 'logout']
            },
            description: 'Revoke active refresh token session.'
          }
        },
        {
          name: 'OAuth - Google',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                provider: 'google',
                token: 'google_id_token_here',
                role: 'CANDIDATE'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/auth/google',
              host: ['{{baseUrl}}'],
              path: ['api', 'auth', 'google']
            }
          }
        },
        {
          name: 'OAuth - LinkedIn',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                provider: 'linkedin',
                token: 'linkedin_auth_code_here',
                role: 'CANDIDATE'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/auth/linkedin',
              host: ['{{baseUrl}}'],
              path: ['api', 'auth', 'linkedin']
            }
          }
        }
      ]
    },
    {
      name: '02. Profiles',
      item: [
        {
          name: 'Get Full My Profile',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/profile/me',
              host: ['{{baseUrl}}'],
              path: ['api', 'profile', 'me']
            }
          }
        },
        {
          name: 'Create Candidate Profile',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                fullName: 'Alex Johnson',
                headline: 'Senior Full Stack Engineer | React & Node.js',
                bio: 'Passionate software engineer with 6+ years of experience building scalable web applications.',
                skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL'],
                location: 'San Francisco, CA',
                expectedSalaryMin: 130000,
                expectedSalaryMax: 170000,
                salaryCurrency: 'USD',
                jobTypePreference: 'FULL_TIME'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/profile/candidate',
              host: ['{{baseUrl}}'],
              path: ['api', 'profile', 'candidate']
            }
          }
        },
        {
          name: 'Update Candidate Profile',
          request: {
            method: 'PUT',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                headline: 'Lead Architect & Staff Software Engineer',
                skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'System Design'],
                expectedSalaryMin: 150000,
                expectedSalaryMax: 190000
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/profile/candidate',
              host: ['{{baseUrl}}'],
              path: ['api', 'profile', 'candidate']
            }
          }
        },
        {
          name: 'Get Candidate Profile by ID',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/profile/candidate/:id',
              host: ['{{baseUrl}}'],
              path: ['api', 'profile', 'candidate', ':id'],
              variable: [{ key: 'id', value: 'candidate-user-id-here' }]
            }
          }
        },
        {
          name: 'Create Company Profile',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'InnovateTech Inc',
                website: 'https://innovatetech.io',
                industry: 'Information Technology',
                size: '51-200',
                description: 'Building AI tools for modern global enterprises.',
                location: 'Austin, TX'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/profile/company',
              host: ['{{baseUrl}}'],
              path: ['api', 'profile', 'company']
            }
          }
        },
        {
          name: 'Update Company Profile',
          request: {
            method: 'PUT',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                website: 'https://innovatetech.io',
                description: 'Global AI platform for talent recruitment and enterprise growth.'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/profile/company',
              host: ['{{baseUrl}}'],
              path: ['api', 'profile', 'company']
            }
          }
        },
        {
          name: 'Get Company Profile by ID',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/profile/company/:id',
              host: ['{{baseUrl}}'],
              path: ['api', 'profile', 'company', ':id'],
              variable: [{ key: 'id', value: 'company-id-here' }]
            }
          }
        },
        {
          name: 'Upload User Avatar',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            body: {
              mode: 'formdata',
              formdata: [
                { key: 'avatar', type: 'file', src: '' }
              ]
            },
            url: {
              raw: '{{baseUrl}}/api/profile/avatar',
              host: ['{{baseUrl}}'],
              path: ['api', 'profile', 'avatar']
            }
          }
        }
      ]
    },
    {
      name: '03. Jobs (Browse & Management)',
      item: [
        {
          name: 'List Public Jobs (Search & Filter)',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/jobs?keyword=Engineer&location=Remote&jobType=FULL_TIME&page=1&limit=20',
              host: ['{{baseUrl}}'],
              path: ['api', 'jobs'],
              query: [
                { key: 'keyword', value: 'Engineer' },
                { key: 'location', value: 'Remote' },
                { key: 'jobType', value: 'FULL_TIME' },
                { key: 'page', value: '1' },
                { key: 'limit', value: '20' }
              ]
            }
          }
        },
        {
          name: 'Get Job by ID',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/jobs/:id',
              host: ['{{baseUrl}}'],
              path: ['api', 'jobs', ':id'],
              variable: [{ key: 'id', value: 'job-id-here' }]
            }
          }
        },
        {
          name: 'Create Job (Company / Recruiter)',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                title: 'Senior Frontend Developer',
                department: 'Engineering',
                description: 'We are seeking an experienced React and TypeScript engineer to lead our core mobile and web frontends.',
                requirements: ['TypeScript', 'React', 'TailwindCSS', 'REST APIs', 'Unit Testing'],
                location: 'Remote, US',
                jobType: 'FULL_TIME',
                workplaceType: 'REMOTE',
                salaryMin: 120000,
                salaryMax: 160000,
                currency: 'USD',
                status: 'PUBLISHED'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/jobs',
              host: ['{{baseUrl}}'],
              path: ['api', 'jobs']
            }
          }
        },
        {
          name: 'Update Job',
          request: {
            method: 'PUT',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                salaryMin: 130000,
                salaryMax: 170000,
                status: 'PUBLISHED'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/jobs/:id',
              host: ['{{baseUrl}}'],
              path: ['api', 'jobs', ':id'],
              variable: [{ key: 'id', value: 'job-id-here' }]
            }
          }
        },
        {
          name: 'Delete Job',
          request: {
            method: 'DELETE',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/jobs/:id',
              host: ['{{baseUrl}}'],
              path: ['api', 'jobs', ':id'],
              variable: [{ key: 'id', value: 'job-id-here' }]
            }
          }
        }
      ]
    },
    {
      name: '04. Candidate Portal',
      item: [
        {
          name: 'Candidate Browse Jobs',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/api/candidate/jobs?search=react&location=Remote&page=1&limit=10',
              host: ['{{baseUrl}}'],
              path: ['api', 'candidate', 'jobs'],
              query: [
                { key: 'search', value: 'react' },
                { key: 'location', value: 'Remote' },
                { key: 'page', value: '1' },
                { key: 'limit', value: '10' }
              ]
            }
          }
        },
        {
          name: 'Apply for Job',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                jobId: 'target-job-id-here',
                coverLetter: 'I am excited to apply for this position and bring my extensive TypeScript experience to the team.',
                resumeUrl: 'https://storage.antigravite.com/resumes/my-resume.pdf'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/candidate/apply',
              host: ['{{baseUrl}}'],
              path: ['api', 'candidate', 'apply']
            }
          }
        },
        {
          name: 'Get My Applications',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/candidate/applications',
              host: ['{{baseUrl}}'],
              path: ['api', 'candidate', 'applications']
            }
          }
        },
        {
          name: 'Toggle Save Job (Bookmark)',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                jobId: 'target-job-id-here'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/candidate/saved-jobs/toggle',
              host: ['{{baseUrl}}'],
              path: ['api', 'candidate', 'saved-jobs', 'toggle']
            }
          }
        },
        {
          name: 'Get Saved Jobs',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/candidate/saved-jobs',
              host: ['{{baseUrl}}'],
              path: ['api', 'candidate', 'saved-jobs']
            }
          }
        },
        {
          name: 'Get My Scheduled Interviews',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/candidate/interviews',
              host: ['{{baseUrl}}'],
              path: ['api', 'candidate', 'interviews']
            }
          }
        }
      ]
    },
    {
      name: '05. Resumes & AI Parsing',
      item: [
        {
          name: 'Upload Resume File',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            body: {
              mode: 'formdata',
              formdata: [
                { key: 'file', type: 'file', src: '' }
              ]
            },
            url: {
              raw: '{{baseUrl}}/api/resume/upload',
              host: ['{{baseUrl}}'],
              path: ['api', 'resume', 'upload']
            },
            description: 'Upload PDF/DOCX resume file (max 10MB).'
          }
        },
        {
          name: 'Parse Resume with AI',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            body: {
              mode: 'formdata',
              formdata: [
                { key: 'file', type: 'file', src: '' }
              ]
            },
            url: {
              raw: '{{baseUrl}}/api/resume/parse',
              host: ['{{baseUrl}}'],
              path: ['api', 'resume', 'parse']
            },
            description: 'Extract skills, work history, and contact info via AI parser.'
          }
        },
        {
          name: 'Get Uploaded Resumes',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/resume',
              host: ['{{baseUrl}}'],
              path: ['api', 'resume']
            }
          }
        }
      ]
    },
    {
      name: '06. AI Job & Candidate Matching',
      item: [
        {
          name: 'Candidate: Calculate & Score Job Matches',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/match/jobs?limit=10',
              host: ['{{baseUrl}}'],
              path: ['api', 'match', 'jobs'],
              query: [{ key: 'limit', value: '10' }]
            },
            description: 'Trigger AI matching algorithm against candidate skills/preferences.'
          }
        },
        {
          name: 'Candidate: Get Saved Job Matches',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/match/jobs?limit=10',
              host: ['{{baseUrl}}'],
              path: ['api', 'match', 'jobs'],
              query: [{ key: 'limit', value: '10' }]
            }
          }
        },
        {
          name: 'Recruiter: Match Candidates for Job',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                jobId: 'target-job-id-here'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/match/candidates?limit=10',
              host: ['{{baseUrl}}'],
              path: ['api', 'match', 'candidates'],
              query: [{ key: 'limit', value: '10' }]
            }
          }
        },
        {
          name: 'Recruiter: Get Scored Candidates for Job',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/match/candidates/:jobId?limit=10',
              host: ['{{baseUrl}}'],
              path: ['api', 'match', 'candidates', ':jobId'],
              variable: [{ key: 'jobId', value: 'target-job-id-here' }],
              query: [{ key: 'limit', value: '10' }]
            }
          }
        }
      ]
    },
    {
      name: '07. Company & Recruitment Management',
      item: [
        {
          name: 'Company Profile - Get',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/profile',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'profile']
            }
          }
        },
        {
          name: 'Company Profile - Update with Logo',
          request: {
            method: 'PUT',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            body: {
              mode: 'formdata',
              formdata: [
                { key: 'name', value: 'TechCorp Solutions', type: 'text' },
                { key: 'website', value: 'https://techcorp.com', type: 'text' },
                { key: 'industry', value: 'Enterprise Software', type: 'text' },
                { key: 'size', value: '51-200', type: 'text' },
                { key: 'logo', type: 'file', src: '' }
              ]
            },
            url: {
              raw: '{{baseUrl}}/api/company/profile',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'profile']
            }
          }
        },
        {
          name: 'Recruiter: Get Company Jobs',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/jobs',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'jobs']
            }
          }
        },
        {
          name: 'Recruiter: Get Job Applications',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/applications?jobId=&status=SUBMITTED',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'applications'],
              query: [
                { key: 'jobId', value: '' },
                { key: 'status', value: 'SUBMITTED' }
              ]
            }
          }
        },
        {
          name: 'Recruiter: Move Application Stage',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                status: 'SHORTLISTED',
                stageNotes: 'Candidate demonstrates strong React background; shortlisted for HM technical review.'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/company/applications/:id/stage',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'applications', ':id', 'stage'],
              variable: [{ key: 'id', value: 'application-id-here' }]
            }
          }
        },
        {
          name: 'Recruiter: Schedule Interview',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                applicationId: 'application-id-here',
                interviewerId: 'hiring-manager-user-id-here',
                scheduledAt: '2026-11-05T15:00:00.000Z',
                durationMinutes: 45,
                meetingUrl: 'https://meet.google.com/abc-defg-hij'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/company/interviews',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'interviews']
            }
          }
        },
        {
          name: 'Recruiter: Overview Stats',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/recruiter/stats',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'recruiter', 'stats']
            }
          }
        },
        {
          name: 'Hiring Manager: Assigned Jobs',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/hiring/assigned-jobs',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'hiring', 'assigned-jobs']
            }
          }
        },
        {
          name: 'Hiring Manager: Shortlisted Candidates',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/hiring/shortlisted',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'hiring', 'shortlisted']
            }
          }
        },
        {
          name: 'Hiring Manager: Submit Interview Evaluation',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                applicationId: 'application-id-here',
                feedback: 'Demonstrated superb system design capabilities and clear communication.',
                rating: 5,
                recommendation: 'STRONG_HIRE'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/company/hiring/evaluation',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'hiring', 'evaluation']
            }
          }
        },
        {
          name: 'Hiring Manager: Submit Final Decision',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                applicationId: 'application-id-here',
                decision: 'OFFERED'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/company/hiring/decision',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'hiring', 'decision']
            }
          }
        },
        {
          name: 'Hiring Manager: Stats',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/hiring/stats',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'hiring', 'stats']
            }
          }
        },
        {
          name: 'Ads Manager: List Campaigns',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/ads/campaigns',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'ads', 'campaigns']
            }
          }
        },
        {
          name: 'Ads Manager: Launch Campaign',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                title: 'Q4 Senior Developer Boost',
                jobId: 'target-job-id-here',
                budget: 1500,
                targetAudience: 'Senior React Engineers in US/Canada',
                startDate: '2026-11-01T00:00:00.000Z',
                endDate: '2026-11-30T23:59:59.000Z'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/company/ads/campaigns',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'ads', 'campaigns']
            }
          }
        },
        {
          name: 'Ads Manager: Update Campaign Status',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                status: 'ACTIVE'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/company/ads/campaigns/:id/status',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'ads', 'campaigns', ':id', 'status'],
              variable: [{ key: 'id', value: 'campaign-id-here' }]
            }
          }
        },
        {
          name: 'Ads Manager: Get Analytics',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/ads/analytics',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'ads', 'analytics']
            }
          }
        },
        {
          name: 'Team: Get Members',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/team',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'team']
            }
          }
        },
        {
          name: 'Team: Invite Member (Owner Only)',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{accessToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: 'hiring.lead@techcorp.com',
                role: 'HIRING_MANAGER'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/company/team/invite',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'team', 'invite']
            }
          }
        },
        {
          name: 'Team: Remove Member (Owner Only)',
          request: {
            method: 'DELETE',
            header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/company/team/:id',
              host: ['{{baseUrl}}'],
              path: ['api', 'company', 'team', ':id'],
              variable: [{ key: 'id', value: 'member-user-id-here' }]
            }
          }
        }
      ]
    },
    {
      name: '08. Platform Administration (Admin Portal)',
      item: [
        {
          name: 'Overview Dashboard Stats',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/admin/overview',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'overview']
            }
          }
        },
        {
          name: 'List Companies',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/admin/companies?page=1&limit=20&status=ACTIVE',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'companies'],
              query: [
                { key: 'page', value: '1' },
                { key: 'limit', value: '20' },
                { key: 'status', value: 'ACTIVE' }
              ]
            }
          }
        },
        {
          name: 'Provision Company Organization',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{adminToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'NextGen AI Inc',
                industry: 'Artificial Intelligence',
                website: 'https://nextgenai.com',
                location: 'San Francisco, CA',
                size: '11-50',
                description: 'Enterprise generative AI solutions.'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/admin/companies',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'companies']
            }
          }
        },
        {
          name: 'Update Company Status (Suspend/Activate)',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{adminToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                status: 'ACTIVE'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/admin/companies/:id/status',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'companies', ':id', 'status'],
              variable: [{ key: 'id', value: 'company-id-here' }]
            }
          }
        },
        {
          name: 'List Candidates',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/admin/candidates?page=1&limit=20',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'candidates'],
              query: [
                { key: 'page', value: '1' },
                { key: 'limit', value: '20' }
              ]
            }
          }
        },
        {
          name: 'List Company Users',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/admin/company-users?organizationId=&role=RECRUITER',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'company-users'],
              query: [
                { key: 'organizationId', value: '' },
                { key: 'role', value: 'RECRUITER' }
              ]
            }
          }
        },
        {
          name: 'Update User Status (Active/Suspended/Deactivated)',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{adminToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                status: 'ACTIVE'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/admin/users/:id/status',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'users', ':id', 'status'],
              variable: [{ key: 'id', value: 'user-id-here' }]
            }
          }
        },
        {
          name: 'Super Admin: Update User Role & Org',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{adminToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                role: 'RECRUITER',
                organizationId: 'organization-id-here'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/admin/users/:id/role-org',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'users', ':id', 'role-org'],
              variable: [{ key: 'id', value: 'user-id-here' }]
            }
          }
        },
        {
          name: 'Super Admin: List Admin Accounts',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/admin/admins',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'admins']
            }
          }
        },
        {
          name: 'Super Admin: Create Admin Manager',
          request: {
            method: 'POST',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{adminToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: 'manager@matchmyjobs.com',
                password: 'ManagerPassword123!',
                permissions: ['MANAGE_JOBS', 'MANAGE_CANDIDATES', 'VIEW_REPORTS']
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/admin/admins',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'admins']
            }
          }
        },
        {
          name: 'Super Admin: Update Admin Manager Permissions',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{adminToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                permissions: ['MANAGE_COMPANIES', 'MANAGE_JOBS', 'MANAGE_CANDIDATES', 'VIEW_REPORTS']
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/admin/admins/:id/permissions',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'admins', ':id', 'permissions'],
              variable: [{ key: 'id', value: 'admin-manager-user-id-here' }]
            }
          }
        },
        {
          name: 'Moderate Jobs List',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/admin/jobs?page=1&limit=20&status=PUBLISHED',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'jobs'],
              query: [
                { key: 'page', value: '1' },
                { key: 'limit', value: '20' },
                { key: 'status', value: 'PUBLISHED' }
              ]
            }
          }
        },
        {
          name: 'Update Job Moderation Status',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Content-Type', value: 'application/json' },
              { key: 'Authorization', value: 'Bearer {{adminToken}}' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                status: 'PUBLISHED'
              }, null, 2)
            },
            url: {
              raw: '{{baseUrl}}/api/admin/jobs/:id/status',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'jobs', ':id', 'status'],
              variable: [{ key: 'id', value: 'job-id-here' }]
            }
          }
        },
        {
          name: 'List All Platform Campaigns',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/admin/campaigns?page=1&limit=20',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'campaigns'],
              query: [
                { key: 'page', value: '1' },
                { key: 'limit', value: '20' }
              ]
            }
          }
        },
        {
          name: 'View Immutable Audit Logs',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: {
              raw: '{{baseUrl}}/api/admin/audit-logs?page=1&limit=50',
              host: ['{{baseUrl}}'],
              path: ['api', 'admin', 'audit-logs'],
              query: [
                { key: 'page', value: '1' },
                { key: 'limit', value: '50' }
              ]
            }
          }
        }
      ]
    }
  ]
};

const environment = {
  id: 'b2c3d4e5-mmj-postman-environment-2026',
  name: 'MatchMyJobs Local & Cloud Dev',
  values: [
    {
      key: 'baseUrl',
      value: 'http://localhost:5001',
      type: 'default',
      enabled: true
    },
    {
      key: 'accessToken',
      value: '',
      type: 'secret',
      enabled: true
    },
    {
      key: 'adminToken',
      value: '',
      type: 'secret',
      enabled: true
    },
    {
      key: 'refreshToken',
      value: '',
      type: 'secret',
      enabled: true
    },
    {
      key: 'adminEmail',
      value: 'admin@matchmyjobs.com',
      type: 'default',
      enabled: true
    },
    {
      key: 'adminPassword',
      value: 'AdminPassword123!',
      type: 'secret',
      enabled: true
    }
  ],
  _postman_variable_scope: 'environment'
};

const postmanDir = path.resolve(process.cwd(), 'postman');
if (!fs.existsSync(postmanDir)) {
  fs.mkdirSync(postmanDir, { recursive: true });
}

fs.writeFileSync(
  path.join(postmanDir, 'MatchMyJobs_API.postman_collection.json'),
  JSON.stringify(collection, null, 2)
);

fs.writeFileSync(
  path.join(postmanDir, 'MatchMyJobs_Environment.postman_environment.json'),
  JSON.stringify(environment, null, 2)
);

console.log('Postman collection and environment successfully generated in ./postman/');
