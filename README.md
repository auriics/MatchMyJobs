# AntiGravite — AI-Powered Job Matching Platform (Phase 1)

**AntiGravite** is an intelligent, full-stack AI-driven talent and job matching platform built with a high-performance monorepo architecture featuring a React web app, a Flutter mobile app (iOS & Android), and a robust Node.js/Express REST API.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Key Libraries |
| :--- | :--- | :--- |
| **Monorepo** | pnpm workspaces | Monorepo orchestrator |
| **Web App** | React 18 + TypeScript + Vite | React Router v6, React Hook Form + Zod, Axios, Zustand, Tailwind CSS, Lucide React |
| **Mobile App** | Flutter (Dart 3) | Dio, flutter_secure_storage, go_router, flutter_riverpod, google_sign_in, flutter_web_auth_2, image_picker, cached_network_image, flutter_form_builder, shimmer, google_fonts |
| **Backend API** | Node.js + Express + TypeScript | Prisma ORM, express-rate-limit, Helmet.js, Zod, bcryptjs (12 rounds), jsonwebtoken, cookie-parser, Multer, ioredis |
| **Database** | PostgreSQL (Primary) | Managed via Prisma ORM schemas & migrations |
| **Cache & Sessions**| Redis | Session invalidation and token revocation (with in-memory dev fallback) |
| **File Storage** | AWS S3 | Avatars and resumes (with local disk fallback for dev) |
| **Auth** | JWT + OAuth 2.0 | Access token (15m), Refresh token (7d httpOnly cookie / secure storage), Google & LinkedIn OAuth |

---

## 📁 Repository Structure

```
.
├── apps/
│   ├── api/                     # Node.js + Express REST API
│   │   ├── prisma/              # Prisma schema & SQL migrations
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── config/          # Environment, Prisma, Redis, AWS S3
│   │       ├── controllers/     # Auth & Profile controllers
│   │       ├── middleware/      # Auth, RBAC, Rate limiting, Zod validation, Error handler
│   │       ├── routes/          # Express route definitions
│   │       ├── schemas/         # Zod request validation schemas
│   │       ├── services/        # Business logic (Auth, Profile, OAuth, S3)
│   │       └── utils/           # JWT & bcrypt utilities
│   │
│   ├── web/                     # React + Vite web application
│   │   └── src/
│   │       ├── components/      # Navbar, Button, Input, AvatarUpload, ProtectedRoute
│   │       ├── lib/             # Axios instance with 401 token refresh interceptor
│   │       ├── pages/           # /register, /login, /onboarding, /dashboard
│   │       └── stores/          # Zustand AuthStore with persistent state
│   │
│   └── mobile/                  # Standalone Flutter mobile app
│       └── lib/
│           ├── core/
│           │   ├── api/         # Dio client with 401 token refresh interceptor
│           │   ├── auth/        # TokenStorageService (flutter_secure_storage), AuthService
│           │   ├── router/      # GoRouter with smooth slide+fade transitions
│           │   └── theme/       # Custom ThemeData (Teal palette, Inter via google_fonts)
│           ├── features/
│           │   ├── auth/        # Splash, Role Picker, Register, Login, Riverpod provider
│           │   ├── onboarding/  # Multi-step profile setup wizard (role-based)
│           │   └── dashboard/   # Role-based dashboard (Candidate & Company)
│           └── shared/          # Reusable widgets (AppButton, AvatarPicker, Shimmer) & models
│
├── packages/
│   └── types/                   # Shared TypeScript contracts & DTOs
│
├── .env.example                 # Root environment variables reference
├── package.json                 # Monorepo root scripts
└── pnpm-workspace.yaml          # pnpm workspace configuration
```

---

## 🛡️ Role-Based Access Control (RBAC)

AntiGravite Phase 1 defines 6 user roles with fine-grained access:
1. `CANDIDATE` — Job seekers configuring skills, salary goals, and viewing AI matches.
2. `COMPANY_OWNER` — Organization leaders managing company profiles and team recruitment.
3. `RECRUITER` — Sourcing agents creating and qualifying candidate pipelines.
4. `HIRING_MANAGER` — Team leaders reviewing shortlists and managing interviews.
5. `ADS_MANAGER` — Marketing specialists managing spotlight postings.
6. `PLATFORM_ADMIN` — System administrators with overarching platform controls.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **pnpm**: v9+ or v10+ (included locally via workspace)
- **PostgreSQL**: v14+ (local or cloud provider e.g. Neon, Supabase, AWS RDS)
- **Redis**: v6+ (optional for local dev; built-in memory fallback included)
- **Flutter SDK**: 3.20+ with Dart 3.3+

---

### Step 1: Clone and Configure Environment

```bash
git clone <repo-url> AntiGravite
cd AntiGravite

# Copy environment variables template
cp .env.example .env
cp .env.example apps/api/.env
```

Edit `apps/api/.env` with your PostgreSQL database URL, JWT secrets, and optional OAuth/AWS credentials.

---

### Step 2: Install Dependencies & Build Shared Types

```bash
# Install all node packages across web, API, and types
./node_modules/.bin/pnpm install

# Build shared types package
./node_modules/.bin/pnpm build:types
```

---

### Step 3: Run Database Migrations

Generate the Prisma Client and run the Phase 1 PostgreSQL schema migrations:

```bash
# Generate Prisma Client
npm run prisma:generate

# Apply migrations to your PostgreSQL database
npm run prisma:migrate
```

Phase 1 creates the following tables:
- `users` — Email, password hash (12 rounds bcrypt), role enum, verified status.
- `profiles_candidate` — Full name, headline, bio, skills array, location, salary range, job preference, avatar URL.
- `profiles_company` — Name, website, industry, size enum, description, logo URL, location.
- `roles` — Role definitions and permissions.
- `sessions` — Active refresh token hashes, expiration timestamps, IP address, user agent, revocation flag.
- `oauth_accounts` — Google and LinkedIn linked identities.

---

### Step 4: Run the Backend REST API

```bash
# Start backend in development mode with live reload (default port: 5001)
npm run dev:api
```

Health check endpoint: `http://localhost:5001/api/health`

---

### Step 5: Run the Web App (React + Vite)

In a separate terminal:

```bash
# Start Vite development server (default port: 5173)
npm run dev:web
```

Open `http://localhost:5173` in your browser.

---

### Step 6: Run the Flutter Mobile App

Navigate to the `apps/mobile` directory:

```bash
cd apps/mobile

# Get Flutter packages
flutter pub get

# Run on connected device, iOS simulator, or Android emulator
flutter run
```

> **Note for Android Emulator**: The mobile Dio client automatically routes `10.0.2.2:5001` to access your host machine's local Express server.

---

## 📡 REST API Reference

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user with email, password, and chosen role | No |
| `POST` | `/auth/login` | Login, returns access token + sets httpOnly refresh cookie | No |
| `POST` | `/auth/refresh` | Generates new access token via refresh token | No |
| `POST` | `/auth/logout` | Revokes refresh token session and clears cookie | No |
| `POST` | `/auth/google` | Google OAuth token verification and account linking | No |
| `POST` | `/auth/linkedin` | LinkedIn OAuth code exchange / verification | No |
| `GET` | `/auth/me` | Returns current user, role, and profile completion status | Yes (Bearer) |

### Profile Endpoints (`/api/profile`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/profile/candidate` | Create initial candidate profile | Yes (CANDIDATE) |
| `PUT` | `/profile/candidate` | Update candidate details, skills, and preferences | Yes (CANDIDATE) |
| `GET` | `/profile/candidate/:id` | Get candidate profile by ID or user ID | Yes |
| `POST` | `/profile/company` | Create initial company profile | Yes (COMPANY_*) |
| `PUT` | `/profile/company` | Update company name, website, industry, and logo | Yes (COMPANY_*) |
| `GET` | `/profile/company/:id` | Get company profile by ID or user ID | Yes |
| `POST` | `/profile/avatar` | Upload avatar to AWS S3 (or dev fallback disk) | Yes |
| `GET` | `/profile/me` | Fetch full profile of current authenticated user | Yes |

---

## 🎨 UI Design System

### Color Palette
- **Primary Teal**: `#60D1D4`
- **Accent**: `#95DFDD`
- **Tints**: `#B1F0EE`, `#D1F4F3`, `#E2F7F9`, `#FFFFFF`
- **Dark Teal (Text)**: `#062224`

### Typography
- **Headings**: Sora (Google Fonts)
- **Body & Controls**: Inter (Google Fonts)

---

## 🔒 Security Best Practices Implemented
- **Rate Limiting**: `express-rate-limit` throttles auth endpoints to mitigate brute force attacks.
- **Security Headers**: `helmet` enforces strict HTTP headers (CSP, HSTS, frameguard).
- **Password Protection**: Salted bcrypt hashing with 12 rounds.
- **Token Rotation**: Short-lived access tokens (15 mins) paired with revocable, hashed refresh tokens (7 days).
- **Web Cookie Protection**: `httpOnly`, `sameSite: strict` (production) / `lax` (development).
- **Mobile Storage**: AES-256 encrypted hardware keychain storage via `flutter_secure_storage`.
- **CORS**: Strict whitelisting of authorized origins with credential allowances.
