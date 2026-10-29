# MatchMyJobs Postman API Collection & Environment

This directory contains the complete REST API Postman Collection (v2.1.0 standard) and Environment configuration for testing all 70 endpoints of MatchMyJobs.

---

## Files in this Directory

1. **[`MatchMyJobs_API.postman_collection.json`](file:///Users/apple/Documents/MatchMyJobs/postman/MatchMyJobs_API.postman_collection.json)**
   - Complete collection containing **70 endpoints** organized across 9 modular folders.
   - Pre-configured headers, JSON request bodies, form-data upload specifications, query parameters, and URL path variables.
   - Built-in test scripts that **automatically extract and save tokens** (`accessToken`, `adminToken`, `refreshToken`) on login.

2. **[`MatchMyJobs_Environment.postman_environment.json`](file:///Users/apple/Documents/MatchMyJobs/postman/MatchMyJobs_Environment.postman_environment.json)**
   - Environment variables pre-filled with:
     - `baseUrl`: `http://localhost:5001`
     - `accessToken`: (automatically filled upon login)
     - `adminToken`: (automatically filled upon admin login)
     - `adminEmail`: `admin@matchmyjobs.com`
     - `adminPassword`: `AdminPassword123!`

---

## How to Import into Postman

1. Open **Postman**.
2. Click the **Import** button in the top-left corner.
3. Drag and drop (or select) both files from this directory:
   - `postman/MatchMyJobs_API.postman_collection.json`
   - `postman/MatchMyJobs_Environment.postman_environment.json`
4. In the top-right corner of Postman, select the **MatchMyJobs Local & Cloud Dev** environment from the environment dropdown.

---

## Endpoints Breakdown

| Folder | Endpoints | Description |
| :--- | :--- | :--- |
| **00. Health & Status** | 1 | Verify service availability, version, and running features |
| **01. Authentication** | 9 | Register, Login, Admin Login, OAuth, Refresh, Logout, Current User |
| **02. Profiles** | 8 | Candidate & Company Profile creation, update, lookups, and avatar upload |
| **03. Jobs (Browse & Management)** | 5 | Public job search/filters, details, and Recruiter job CRUD |
| **04. Candidate Portal** | 6 | Browse jobs, apply for jobs, save/bookmark jobs, view interviews |
| **05. Resumes & AI Parsing** | 3 | Upload resumes (PDF/DOCX), AI extraction, and candidate resumes list |
| **06. AI Job & Candidate Matching** | 4 | Real-time AI scoring & matching for Candidates and Recruiters |
| **07. Company & Recruitment** | 19 | Recruiter pipeline, Hiring Manager evaluation/decisions, Ads campaigns, Team invites |
| **08. Platform Administration** | 15 | Super Admin overview, company provision/suspension, user roles, moderation, audit logs |

---

## Quick Testing Workflow

1. **Test Platform Admin**:
   - Run `01. Authentication` -> `Admin Login (Platform Admin)`.
   - The test script will automatically save `adminToken`.
   - You can now run any endpoint in `08. Platform Administration`!

2. **Test Candidate**:
   - Run `01. Authentication` -> `Register Candidate` or `Login (Candidate / Company)`.
   - The test script will automatically save `accessToken`.
   - You can now run candidate endpoints (Profile, Resumes, Browse & Apply, AI Matching).
