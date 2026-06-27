# 📑 Permis2.0 - Project Index

## 🚀 Quick Links

### Documentation
- [README.md](./README.md) - Project overview and setup guide
- [CLAUDE.md](./CLAUDE.md) - Development guidelines and technical decisions
- [SPRINT_PLAN.md](./SPRINT_PLAN.md) - Detailed 12-sprint development plan
- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - Sprint 1 completion report
- [context.md](./context.md) - Original project requirements

### Configuration
- [turbo.json](./turbo.json) - Turborepo configuration
- [docker-compose.yml](./docker-compose.yml) - Local development environment
- [tsconfig.json](./tsconfig.json) - Root TypeScript configuration
- [.eslintrc.json](./.eslintrc.json) - Linting rules
- [.prettierrc.json](./.prettierrc.json) - Code formatting
- [.env.example](./.env.example) - Environment variables template

---

## 📁 Directory Structure

### Root Directory
```
permis2.0/
├── 📄 Documentation (README.md, CLAUDE.md, SPRINT_PLAN.md)
├── 📄 Configuration (turbo.json, tsconfig.json, .env.example)
├── 📄 Docker (docker-compose.yml, Dockerfile.api, Dockerfile.web)
├── 📄 CI/CD (.github/workflows/ci.yml)
├── 📁 apps/ (Frontend & Backend)
├── 📁 packages/ (Shared code)
└── 📁 JSON Data (categories_et_meta.json, fiches_theoriques.json, serie_*.json)
```

### Frontend Application (`apps/web/`)
**Next.js 15 Progressive Web App**

Key files:
- `src/app/layout.tsx` - Root layout with PWA metadata
- `src/app/page.tsx` - Home page placeholder
- `src/app/globals.css` - Global styles
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration

**Structure (to build):**
```
src/
├── app/                   # Next.js 15 app directory
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/            # React components
├── pages/                 # API routes (optional)
├── hooks/                 # Custom hooks
├── store/                 # Zustand stores
└── utils/                 # Utilities
```

### Backend Application (`apps/api/`)
**NestJS REST API with Swagger**

Key files:
- `src/main.ts` - Application entry point with Swagger setup
- `src/app.module.ts` - Root module
- `prisma/schema.prisma` - Database schema (327 lines, 17 models)

**Structure (to build):**
```
src/
├── auth/                  # Authentication (JWT, Google OAuth)
├── categories/            # Categories module
├── lessons/               # Lessons/Theory module
├── series/                # Training series module
├── questions/             # Questions module
├── exams/                 # Exam system
├── statistics/            # Statistics and analytics
├── users/                 # User management
├── traffic-signs/         # Traffic signs module
├── common/                # Common guards, pipes, decorators
└── config/                # Configuration services
```

### Shared Packages (`packages/`)

#### 1. `packages/types/` - TypeScript Interfaces
Exports 20+ type definitions:
- User, Category, Lesson, Series, Question
- Exam, ExamResult, ExamQuestion
- Progress, Statistic, Favorite, Badge
- DailyStreak, TrafficSign, Notification
- Subscription, ApiResponse, PaginatedResponse

#### 2. `packages/utils/` - Shared Utilities
Functions and constants:
- Score calculation (`calculateScore`, `getScoreLabel`)
- XP system (`calculateXP`, `getLevelFromXP`, `getProgressToNextLevel`)
- Formatting (`formatTime`, `formatPercentage`, `formatDate`)
- Array utilities (`shuffle`, `chunk`)
- Object utilities (`deepMerge`)
- Validation (`validateEmail`, `validatePassword`)
- Constants (EXAM_DURATION, SERIES_QUESTION_COUNT, etc)

#### 3. `packages/hooks/` - React Hooks
Custom hooks for common functionality:
- `useTimer` - Countdown timer with pause/resume
- `useAuth` - Authentication state management
- `useFavorites` - Favorite items management
- `useStreak` - Daily streak tracking
- `useLocalStorage` - localStorage with JSON serialization

#### 4. `packages/ui/` - Component Library
Shadcn-inspired components:
- `Button` - Variants: default, secondary, danger, outline, ghost
- `Card` - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `Input` - Text input with Tailwind styles
- `Badge` - Inline labels with variants
- `Progress` - Progress bar component
- `cn()` utility - Tailwind class merging

#### 5. `packages/shared/` - Constants & Config
Global configuration:
- App metadata (APP_NAME, APP_SLOGAN)
- Brand colors (primary #16A34A, secondary #FACC15, danger #DC2626)
- API configuration (API_BASE_URL)
- Exam settings (EXAM_CONFIG, SERIES_CONFIG)
- Level thresholds (Débutant, Intermédiaire, Confirmé, Expert)
- XP configuration (point values, multipliers)

---

## 🗄️ Database Schema

### Models (17 total)
```
User ─┬─ Exam ─┬─ ExamQuestion ─┬─ Question
      │        └─ ExamResult    │
      ├─ Progress              └─ Category
      ├─ Statistic
      ├─ Favorite
      ├─ Badge
      ├─ DailyStreak
      ├─ Subscription
      └─ Notification

Category ─┬─ Lesson ─┬─ Favorite
          ├─ Question
          └─ Statistic

Series ─┬─ Question ─┬─ Choice
        └─ Progress  └─ ExamQuestion

TrafficSign (standalone)
```

### Key Relationships
- User: 1 → Many (Exams, Progress, Statistics, Favorites, Badges, Notifications)
- Category: 1 → Many (Lessons, Questions, Statistics)
- Series: 1 → Many (Questions, Progress)
- Question: 1 → Many (Choices, ExamQuestions, Favorites)
- Exam: 1 → Many (ExamQuestions), 1 → One (ExamResult)

---

## 🔌 API Endpoints (Planned)

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh JWT token

### Categories & Content
- `GET /categories` - List all categories (paginated)
- `GET /categories/:id` - Get category details
- `GET /lessons` - List lessons (paginated)
- `GET /lessons/:id` - Get lesson details
- `GET /lessons/search` - Search lessons
- `GET /traffic-signs` - List traffic signs
- `GET /traffic-signs/search` - Search signs

### Training
- `GET /series` - List training series (B1, B2, B3)
- `GET /series/:id` - Get series details
- `GET /series/:id/questions` - Get series questions
- `GET /questions/random` - Get random questions

### Exams
- `POST /exam/start` - Start new exam
- `GET /exam/:id` - Get exam status
- `POST /exam/:id/answer` - Submit answer
- `POST /exam/:id/submit` - Submit exam
- `GET /exam/:id/results` - Get exam results
- `GET /exam/history` - User exam history

### User Data
- `GET /profile` - Get user profile
- `PATCH /profile` - Update profile
- `POST /favorites` - Add/remove favorite
- `GET /favorites` - List user favorites
- `GET /statistics` - Get user statistics
- `GET /statistics/category/:id` - Category performance

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript 5.4
- **Styling:** Tailwind CSS 3.4
- **Components:** Shadcn UI patterns
- **Animations:** Framer Motion 10
- **State:** Zustand 4.4
- **Data Fetching:** TanStack Query 5.4
- **Charts:** Recharts 2.12
- **Form:** React Hook Form (planned)
- **Testing:** Vitest + Playwright

### Backend
- **Framework:** NestJS 10
- **Language:** TypeScript 5.4
- **Database:** PostgreSQL 16
- **ORM:** Prisma 5.13
- **Auth:** JWT + Passport (JWT & Google OAuth)
- **Validation:** class-validator + class-transformer
- **API Docs:** Swagger/OpenAPI
- **Testing:** Jest

### Infrastructure
- **Build:** Turborepo 2.0
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Package Manager:** npm with workspaces

---

## 📝 Data Files

All data must be dynamically loaded from JSON files (NEVER hardcoded):

### 1. `categories_et_meta.json`
Question categories with metadata
- Fields: id, label, description, couleur, icone
- Used by: Category seeder

### 2. `fiches_theoriques.json`
Theoretical lessons content
- Fields: titre, contenu, points_cles, exceptions, erreurs_frequentes, regles, illustrations
- Used by: Lesson seeder

### 3. `serie_B1.json`, `serie_B2.json`, `serie_B3.json`
Training question series (25 questions each = 75 total)
- Fields: numero, enonce, signalisation_visible, propositions, reponses_correctes, explication, categorie
- Used by: Question, Choice seeders

---

## 🎯 Current Sprint Status

**Sprint 1: Foundation & Setup** ✅ COMPLETE

Completed:
- ✅ Monorepo structure with Turborepo
- ✅ 5 shared packages (types, utils, hooks, ui, shared)
- ✅ Next.js 15 frontend skeleton
- ✅ NestJS backend skeleton with Swagger
- ✅ Complete Prisma schema (327 lines, 17 models)
- ✅ Docker & Docker Compose setup
- ✅ GitHub Actions CI/CD pipeline
- ✅ ESLint & Prettier configuration
- ✅ TypeScript strict mode
- ✅ Documentation (README, CLAUDE.md, SPRINT_PLAN)

**Next Sprint: Sprint 2 - Database & Authentication**
- Database migration and schema push
- JWT authentication implementation
- Google OAuth setup
- Login/Register endpoints
- Auth guards and protected routes

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start all services
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Lint and format
npm run lint
npm run format

# Database operations
npx prisma migrate dev
npx prisma studio
npm run prisma:seed

# Docker operations
docker-compose up
docker-compose down
```

---

## 📊 Project Metrics

- **Total Packages:** 5
- **Total Apps:** 2
- **Database Models:** 17
- **Planned API Endpoints:** 25+
- **React Components (planned):** 40+
- **Lines in Schema:** 327
- **Lines in Utils:** 150+
- **Development Time:** 6 months (12 sprints)
- **Target Lighthouse Score:** > 95
- **Test Coverage Target:** > 80%

---

## 🎓 For New Developers

1. **Start here:** Read [CLAUDE.md](./CLAUDE.md)
2. **Understand the plan:** Review [SPRINT_PLAN.md](./SPRINT_PLAN.md)
3. **Set up locally:** Follow [README.md](./README.md)
4. **Explore structure:** Check `apps/`, `packages/`
5. **Review schema:** Look at `apps/api/prisma/schema.prisma`

---

## 📞 Key Contacts

For questions about:
- **Project scope:** See [context.md](./context.md)
- **Development guidelines:** See [CLAUDE.md](./CLAUDE.md)
- **Sprint details:** See [SPRINT_PLAN.md](./SPRINT_PLAN.md)
- **Tech stack:** See [README.md](./README.md)
- **Setup issues:** See [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)

---

## ✅ Verification Checklist

Before starting development:
- [ ] Read CLAUDE.md
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Review SPRINT_PLAN.md
- [ ] Understand monorepo structure
- [ ] Check database schema
- [ ] Verify Docker setup
- [ ] Run `npm run lint` and `npm run format`

---

**Last Updated:** June 24, 2026  
**Status:** Sprint 1 Complete ✅  
**Next Sprint:** Sprint 2 - Database & Authentication  
**Project Timeline:** 6 months (24 weeks)
