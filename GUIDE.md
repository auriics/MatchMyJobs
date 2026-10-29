# MatchMyJobs (AntiGravite) — Comprehensive Project & Architecture Guide

Welcome to **MatchMyJobs** (`matchmyjobs.si` / `antigravite`), an AI-powered recruitment, job-matching, and professional talent networking platform.

This document serves as the complete technical reference for developers, engineers, and administrators working on the codebase.

---

## Table of Contents
1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Monorepo Directory Map](#2-monorepo-directory-map)
3. [Tech Stack](#3-tech-stack)
4. [Environment Setup & Configuration](#4-environment-setup--configuration)
5. [Getting Started (Step-by-Step)](#5-getting-started-step-by-step)
6. [Core System Phases](#6-core-system-phases)
   - [Phase 1: Multi-Role Auth & User Profiles](#phase-1-multi-role-auth--user-profiles)
   - [Phase 2: Resume Upload & AI Parsing](#phase-2-resume-upload--ai-parsing)
   - [Phase 3: Company Hub & Job Publishing](#phase-3-company-hub--job-publishing)
   - [Phase 4: AI Matching & Explainability Engine](#phase-4-ai-matching--explainability-engine)
7. [Database Schema & Models](#7-database-schema--models)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Pre-Configured Test Accounts & Credentials](#9-pre-configured-test-accounts--credentials)
10. [Testing, Auditing & Interactive Dashboards](#10-testing-auditing--interactive-dashboards)
11. [Troubleshooting & Common Fixes](#11-troubleshooting--common-fixes)

---

## 1. Project Overview & Architecture

MatchMyJobs is built as a high-performance monorepo serving web, mobile, and backend microservices:

```
                          ┌───────────────────────────┐
                          │   Client Applications     │
                          ├─────────────┬─────────────┤
                          │  React SPA  │ Flutter App │
                          │  (Port 5173)│ (iOS/Android│
                          └──────┬──────┴──────┬──────┘
                                 │ HTTP / REST │
                                 ▼             ▼
                          ┌───────────────────────────┐
                          │     Node.js REST API      │
                          │   Express + TypeScript    │
                          │        (Port 5001)        │
                          └─────────────┬─────────────┘
                                        │
          ┌──────────────────┬──────────┴──────────┬──────────────────┐
          │                  │                     │                  │
          ▼                  ▼                     ▼                  ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ PostgreSQL DB    │ │  AI Matching  │ │ File Storage S3  │ │ In-Memory Redis  │
│ (Supabase Cloud  │ │ (OpenAI /     │ │ (AWS S3 + Local  │ │ (Match & Session │
│  + Prisma ORM)   │ │  Gemini /     │ │  Disk Fallback)  │ │  Caching)        │
│                  │ │  Local Vector)│ │                  │ │                  │
└──────────────────┘ └───────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 2. Monorepo Directory Map

```text
matchmyjobs/
├── apps/
│   ├── api/                          # Node.js Express REST API
│   │   ├── prisma/
│   │   │   └── schema.prisma         # Central PostgreSQL Prisma Schema
│   │   ├── scripts/
│   │   │   ├── audit-ai-matching.ts  # 51-Scenario Full AI Matching Benchmark
│   │   │   ├── role-matching-suite.ts# Multi-Role RBAC & DB Persistence Suite
│   │   │   └── seed-demo-accounts.ts # Idempotent multi-role account seeder
│   │   ├── src/
│   │   │   ├── config/               # Prisma, Environment, S3, Redis configs
│   │   │   ├── controllers/          # API route handlers
│   │   │   ├── middleware/           # JWT, Rate limiting, RBAC authorization
│   │   │   ├── routes/               # Express router endpoints
│   │   │   ├── services/             # Core business logic (Match, Resume, Job, Auth)
│   │   │   └── utils/                # Password, token, encryption utilities
│   │   └── package.json
│   │
│   ├── web/                          # React + Vite + TypeScript Frontend
│   │   ├── src/
│   │   │   ├── components/           # Reusable UI components & layouts
│   │   │   ├── pages/                # Candidate, Company & Admin Dashboards
│   │   │   ├── routes/               # Client-side router definitions
│   │   │   └── store/                # Zustand client state stores
│   │   └── package.json
│   │
│   └── mobile/                       # Flutter Mobile Application
│       ├── lib/                      # Cross-platform Dart application code
│       └── pubspec.yaml              # Riverpod, Dio, GoRouter, Secure Storage
│
├── packages/
│   └── types/                        # Shared TypeScript interfaces & types
│
├── postman/                          # Postman API Collections & Environment
├── .env                              # Root Environment Configuration
├── package.json                      # Monorepo root scripts & pnpm configuration
├── pnpm-workspace.yaml               # PNPM Workspace packages declaration
└── GUIDE.md                          # This comprehensive project documentation
```

---

## 3. Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Web** | React 18, TypeScript, Vite, TailwindCSS, Zustand, React Router 6, Lucide Icons, TipTap |
| **Mobile App** | Flutter 3.x, Dart, Riverpod, Dio, GoRouter, Flutter Secure Storage |
| **Backend API** | Node.js (v20+), Express, TypeScript, Prisma ORM, Zod, Helmet, CORS |
| **Database** | PostgreSQL (Supabase Cloud + Local PostgreSQL fallback) |
| **AI & LLM** | OpenAI `text-embedding-3-small`, OpenAI `gpt-4o`, Google Gemini, Deterministic Vector Scorer |
| **File Storage** | AWS S3 (`@aws-sdk/client-s3`) with automatic Local Disk fallback |
| **Document Parsers** | `pdf-parse`, `mammoth` (DOCX extraction) |
| **Authentication** | JWT (Access + Refresh tokens), bcryptjs, Google OAuth, Role-Based Access Control (RBAC) |
| **Package Manager** | `pnpm` (v9+) with recursive workspace filters |

---

## 4. Environment Setup & Configuration

The application uses environment variables defined in `.env` and `apps/api/.env`.

### Key Environment Variables Reference:

```ini
# --- SERVER & NETWORKING ---
PORT=5001
NODE_ENV=development
API_BASE_URL=http://localhost:5001
WEB_APP_URL=http://localhost:5173

# --- DATABASE (SUPABASE POSTGRESQL) ---
# Pooler connection (Port 6543 with PgBouncer)
DATABASE_URL="postgresql://postgres.USER:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Direct connection (Port 5432 for migrations and DDL)
DIRECT_URL="postgresql://postgres.USER:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# --- SECURITY & JWT ---
JWT_SECRET="your-256-bit-jwt-secret-string"
JWT_REFRESH_SECRET="your-256-bit-refresh-secret-string"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# --- ARTIFICIAL INTELLIGENCE & LLM ---
OPENAI_API_KEY=""                # Optional: Leave blank to use built-in zero-cost local vector scorer
GEMINI_API_KEY=""                # Optional: Google Gemini API key

# --- STORAGE (AWS S3) ---
AWS_ACCESS_KEY_ID=""            # Leave blank or placeholder to auto-fallback to local disk storage
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="matchmyjobs-resumes"

# --- REDIS (CACHE & RATE LIMITING) ---
REDIS_URL="redis://localhost:6379"
```

> [!NOTE]
> The backend features **graceful fallback handling**:
> - If `OPENAI_API_KEY` is not provided, the API automatically uses its built-in **Deterministic Local Semantic Scorer** without failing.
> - If `AWS_ACCESS_KEY_ID` contains placeholder credentials, the API automatically stores uploaded resumes on the **local filesystem** under `apps/api/uploads/`.

---

## 5. Getting Started (Step-by-Step)

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **pnpm**: `v9.x` or later (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Flutter SDK**: `v3.13+` (only if developing for mobile)

### Step 1: Clone & Install Dependencies
```bash
git clone <repository-url>
cd matchmyjobs
pnpm install
```

### Step 2: Generate Prisma Database Client
```bash
pnpm prisma:generate
```

### Step 3: Run Database Migrations (or Sync to Supabase)
```bash
# Push Prisma schema to your PostgreSQL database
pnpm --filter @antigravite/api prisma:db:push
```

### Step 4: Seed Multi-Role Test Accounts
```bash
pnpm --filter @antigravite/api tsx scripts/seed-demo-accounts.ts
```

### Step 5: Start the Development Servers
In separate terminal tabs:

**Terminal 1 — Backend API Server:**
```bash
pnpm dev:api
# API starts at http://localhost:5001
# Health check: http://localhost:5001/api/health
```

**Terminal 2 — Frontend Web Application:**
```bash
pnpm dev:web
# Web SPA starts at http://localhost:5173
```

**Terminal 3 (Optional) — Flutter Mobile App:**
```bash
cd apps/mobile
flutter run -d chrome # or ios / android
```

---

## 6. Core System Phases

### Phase 1: Multi-Role Auth & User Profiles
The system enforces strict Multi-Tenant Role-Based Access Control (RBAC):
- **User Roles (`Role` Enum):**
  - `CANDIDATE`: Job seekers managing resumes, preferences, and matching job searches.
  - `COMPANY_OWNER`: Organization administrators managing company branding, teams, and jobs.
  - `RECRUITER`: Recruiters scoring and ranking candidates for organization jobs.
  - `HIRING_MANAGER`: Reviewing shortlists and conducting applicant interviews.
  - `ADS_MANAGER`: Managing recruitment advertising campaigns.
  - `ADMIN_MANAGER`: Delegated administrative authority with granular permissions.
  - `PLATFORM_ADMIN`: Super Administrator with unrestricted system-wide access.
- **Session Security:** Short-lived access JWTs ($15\text{ mins}$) + database-persisted refresh tokens with device IP and User-Agent fingerprinting.

---

### Phase 2: Resume Upload & AI Parsing
- **Endpoints:** `POST /api/resume/upload` and `POST /api/resume/parse`
- **Format Support:** PDF (`pdf-parse`) and Microsoft Word DOCX (`mammoth`).
- **Data Normalization:**
  Extracts candidate name, email, phone, headline, structured technical skills array, work experience with start/end dates, education degrees, and certifications into validated JSON.

---

### Phase 3: Company Hub & Job Publishing
- **Multi-Tenancy:** Each company user is bounded to their `organizationId`.
- **Job Lifecycle:** Draft $\rightarrow$ Published $\rightarrow$ Closed $\rightarrow$ Archived.
- **Workplace Modes:** `remote`, `hybrid`, `onsite`.
- **Applicant Tracking:** `APPLIED` $\rightarrow$ `SCREENING` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `INTERVIEW_SCHEDULED` $\rightarrow$ `OFFERED` $\rightarrow$ `HIRED` / `REJECTED`.

---

### Phase 4: AI Matching & Explainability Engine
The AI Matching Engine evaluates both **Candidate-to-Job** and **Job-to-Candidate** alignments.

#### 1. Two-Tier Matching Pipeline
1. **Tier 1 (High-Speed Vector Scoring):**
   - Embeds candidate text (skills, headline, bio, experience) and job text (title, requirements, department, description).
   - Computes normalized Cosine Vector Similarity.
2. **Tier 2 (Skills Intersection & Bonus Calibration):**
   - Calculates exact and substring overlap between candidate skills and job requirements.
   - Combines semantic similarity ($0\text{--}45\text{ pts}$) + skills intersection bonus ($0\text{--}35\text{ pts}$) + presence bonus.
   - Eliminates artificial minimums (scores range realistically from $12\%$ to $99\%$).
3. **Tier 3 (Explainability Layer):**
   - Automatically generates plain-English feedback chips (e.g. *"Solid React, TypeScript, Next.js background; aligns with key requirements"*).
   - Identifies exact `matchedSkills` and `missingSkills`.
   - Categorizes matches:
     - **Strong Match:** $80\% - 100\%$
     - **Good Match:** $60\% - 79\%$
     - **Partial Match:** $30\% - 59\%$
     - **Low Match:** $< 30\%$
4. **Tier 4 (PostgreSQL Persistence):**
   - Caches results directly in the `job_matches` table, indexed by `(jobId, candidateId)`.

---

## 7. Database Schema & Models

Key PostgreSQL models defined in [`schema.prisma`](file:///c:/matchmyjobs/apps/api/prisma/schema.prisma):

```prisma
model User {
  id              String            @id @default(uuid())
  email           String            @unique
  passwordHash    String?
  role            Role              @default(CANDIDATE)
  status          String            @default("ACTIVE")
  organizationId  String?
  organization    Company?          @relation("CompanyEmployees", fields: [organizationId], references: [id])
  candidateProfile CandidateProfile?
  companyProfile   CompanyProfile?
  jobMatches      JobMatch[]        @relation("CandidateJobMatches")
  // ...
}

model Company {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  jobs        Job[]
  employees   User[]   @relation("CompanyEmployees")
  // ...
}

model Job {
  id            String      @id @default(uuid())
  organizationId String
  organization  Company     @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  title         String
  description   String      @db.Text
  requirements  String[]    @default([])
  department    String?
  location      String?
  workplaceType String?     @default("remote")
  salaryMin     Int?
  salaryMax     Int?
  status        String      @default("PUBLISHED")
  matches       JobMatch[]
  // ...
}

model CandidateProfile {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName          String
  headline          String?
  skills            String[] @default([])
  experience        Json?
  education         Json?
  location          String?
  expectedSalaryMin Int?
  expectedSalaryMax Int?
  // ...
}

model JobMatch {
  id            String   @id @default(uuid())
  jobId         String
  job           Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidateId   String
  candidate     User     @relation("CandidateJobMatches", fields: [candidateId], references: [id], onDelete: Cascade)
  score         Float    // 0 to 100 percentage match
  reason        String?  @db.Text
  matchedSkills String[] @default([])
  missingSkills String[] @default([])

  @@unique([jobId, candidateId])
  @@index([jobId])
  @@index([candidateId])
  @@index([score])
  @@map("job_matches")
}
```

---

## 8. API Endpoints Reference

### Authentication Routes (`/api/auth`)
* `POST /api/auth/register` — Register new Candidate or Company Owner account.
* `POST /api/auth/login` — Authenticate and receive Access & Refresh JWTs.
* `POST /api/auth/refresh` — Rotate refresh token and obtain fresh access token.
* `GET  /api/auth/me` — Retrieve current authenticated session identity.
* `POST /api/auth/logout` — Revoke active session tokens.

### Candidate Matching Routes (`/api/match`)
* `POST /api/match/jobs` — Compute and refresh job matches for current candidate (`Role.CANDIDATE`).
* `GET  /api/match/jobs` — Retrieve cached job matches for candidate.

### Recruiter & Company Matching Routes (`/api/match`)
* `POST /api/match/candidates` — Score and rank all candidate profiles for a given `jobId` (`Role.RECRUITER`, `Role.COMPANY_OWNER`).
* `GET  /api/match/candidates/:jobId` — Retrieve ranked candidates for job.

### Job Management Routes (`/api/jobs`)
* `GET  /api/jobs` — List jobs (public or organization-scoped).
* `POST /api/jobs` — Publish a new job requisition.
* `GET  /api/jobs/:id` — Retrieve detailed job requirements.
* `PUT  /api/jobs/:id` — Update job requirements and status.
* `DELETE /api/jobs/:id` — Archive or delete job.

### Resume Routes (`/api/resume`)
* `POST /api/resume/upload` — Upload PDF/DOCX resume file (multipart/form-data).
* `POST /api/resume/parse` — Parse uploaded resume with AI extraction.

---

## 9. Pre-Configured Test Accounts & Credentials

The seed script creates the following pre-configured test users:

| Persona | Email | Password | Allowed Matching Operations |
|---|---|---|---|
| **Platform Admin** | `admin_124272@test.com` | `Password123!` | System-wide candidate & job match inspection |
| **Company Owner** | `owner_124272@test.com` | `Password123!` | Job candidate ranking for company jobs |
| **Recruiter** | `recruiter_124272@test.com` | `Password123!` | Job candidate ranking & applicant shortlisting |
| **Hiring Manager** | `hiring_manager_124272@test.com` | `Password123!` | Candidate ranking for assigned roles |
| **Candidate** | `candidate_124272@test.com` | `Password123!` | Candidate-to-job matching (`POST /api/match/jobs`) |

---

## 10. Testing, Auditing & Interactive Dashboards

### Running the Multi-Role Validation Suite
To execute the live 13-test role verification suite against your running backend and PostgreSQL database:
```bash
pnpm --filter @antigravite/api tsx scripts/role-matching-suite.ts
```

### Running the 51-Scenario Full AI Matching Audit
To run the full Information Retrieval benchmark (51 test cases + 7 progressive load scaling tests up to 10M matches):
```bash
pnpm --filter @antigravite/api tsx scripts/audit-ai-matching.ts
```

### Viewing the Visual Graphical Dashboard
Open the standalone interactive HTML dashboard generated in the artifact directory:
```text
C:\Users\DELL\.gemini\antigravity\brain\e762e547-9d52-4765-94ef-b56211d7bfe0\ai-matching-dashboard.html
```
The dashboard includes:
- Live multi-role execution metrics and RBAC validation.
- Interactive candidate skills vs JD requirements breakdown.
- Logarithmic workload scaling charts (1x1 to 10,000x1,000).
- Information Retrieval (IR) quality radar: Precision@5, Precision@10, Recall, MRR, NDCG.

---

## 11. Troubleshooting & Common Fixes

### 1. `Cannot reach database at aws-0-ap-south-1.pooler.supabase.com:6543`
- Ensure your network allows outbound connections to ports `6543` and `5432`.
- Verify `DATABASE_URL` and `DIRECT_URL` in `apps/api/.env`.
- If using Supabase connection pooling, ensure `?pgbouncer=true` is appended to `DATABASE_URL`.

### 2. `InvalidAccessKeyId: The AWS Access Key Id you provided does not exist`
- The system automatically detects placeholder AWS credentials (`your-aws-access-key-id`) and falls back safely to local disk storage in `apps/api/uploads/`.
- No action needed unless using real AWS S3 storage in production.

### 3. Missing `@prisma/client` after pulling changes
- Run `pnpm prisma:generate` to regenerate the TypeScript Prisma client for your local OS environment.

---

*MatchMyJobs Technical Documentation &bull; Built with Google Antigravity &bull; Version 2.0*
