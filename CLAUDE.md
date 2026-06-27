# CLAUDE.md - Permis2.0 Project Documentation

## Project Overview

**PERMIS2.0** is a production-ready Progressive Web App (PWA) for preparing users for the Senegalese driving theory exam and driving license test.

- **Architecture:** Clean Architecture with Turborepo monorepo
- **Frontend:** Next.js 15 with TypeScript, TailwindCSS, Framer Motion
- **Backend:** NestJS with Prisma ORM and PostgreSQL
- **Status:** Sprint 1 - Foundation & Setup (in progress)
- **Expected Launch:** 6 months (12 sprints)

## Key Context

### Design System
- **Primary Color:** #16A34A (Green) - represents success/driving
- **Secondary Color:** #FACC15 (Yellow) - represents warning/caution
- **Danger Color:** #DC2626 (Red) - represents prohibition
- **Dark Color:** #111827 - dark mode background
- **Background:** #FFFFFF - light mode background

### Data Sources
All content is dynamically generated from JSON files (NEVER hardcoded):
- `categories_et_meta.json` - Question categories with metadata
- `fiches_theoriques.json` - Theoretical lessons
- `serie_B1.json`, `serie_B2.json`, `serie_B3.json` - Training question series

### Core Requirements
1. **Mobile-First:** Optimize for smartphones before desktop
2. **Gamified:** XP, levels, badges, daily streaks (Duolingo-style)
3. **Comprehensive:** 75 questions (25 × 3 series) + mock exam
4. **Accessible:** WCAG 2.1 AA compliance
5. **Production-Ready:** Lighthouse > 95, Docker, CI/CD, offline support

## Architecture

### Monorepo Structure
```
apps/
  ├── web/           # Next.js 15 frontend
  └── api/           # NestJS backend
packages/
  ├── types/         # TypeScript interfaces
  ├── utils/         # Shared utilities (XP, formatting, etc)
  ├── hooks/         # React hooks (useAuth, useFavorites, etc)
  ├── ui/            # Shadcn-style component library
  └── shared/        # Constants and config
```

### Key Files
- `turbo.json` - Turborepo configuration
- `SPRINT_PLAN.md` - Detailed sprint breakdown
- `apps/api/prisma/schema.prisma` - Database schema
- `.github/workflows/ci.yml` - GitHub Actions CI/CD
- `docker-compose.yml` - Local development setup

## Development Workflow

### Current Sprint
**Sprint 1: Foundation & Setup** (Completed)
- ✅ Turborepo monorepo initialized
- ✅ All packages created (types, utils, hooks, ui, shared)
- ✅ Next.js 15 app structure
- ✅ NestJS API skeleton with Swagger
- ✅ Prisma schema defined
- ✅ Docker configuration
- ✅ GitHub Actions CI/CD pipeline
- ✅ Environment configuration

### Next Steps (Sprint 2)
1. Complete Prisma schema implementation
2. Implement JWT authentication
3. Set up Google OAuth
4. Create auth endpoints
5. Build login/register pages
6. Implement protected routes

## Technical Decisions

### Why Turborepo?
- Monorepo management with workspaces
- Optimized builds with caching
- Shared packages across apps
- Simplified dependency management

### Why Prisma?
- Type-safe database access
- Automatic migrations
- Built-in seeding
- Excellent TypeScript support
- Easy relationship management

### Why NestJS?
- Architectural structure (modules, controllers, services)
- Decorator-based configuration
- Built-in validation and pipes
- Swagger integration
- Excellent for scalable APIs

### Why Next.js 15?
- App Router for modern routing
- Server Components for performance
- Built-in image optimization
- Excellent PWA support
- Great TypeScript support

## Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch (default)
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### Commit Messages
Format: `type(scope): description`
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `style:` - Formatting
- `test:` - Test changes
- `chore:` - Build/dependency changes

Example: `feat(auth): implement JWT authentication`

## Important Notes

### No Hardcoding
- NEVER hardcode categories, questions, or lessons
- NEVER hardcode exam questions or answers
- Everything must be generated dynamically from JSON files
- Use Prisma seeders for data import

### Data Validation
- All JSON data must be validated before seeding
- Use TypeScript interfaces for type safety
- Validate category relationships
- Ensure all questions have valid categories and series

### Performance
- Target Lighthouse score > 95
- Optimize bundle size
- Use code splitting
- Implement lazy loading
- Cache API responses with TanStack Query

### Security
- Never store tokens in localStorage directly
- Implement CSRF protection
- Validate all inputs
- Use secure headers
- Rate limiting on API

### Testing
- Unit tests for business logic (utilities, services)
- Integration tests for API endpoints
- E2E tests for critical user flows
- Test coverage target: > 80%

## Development Tools

### Local Database
```bash
# Via Docker Compose
docker-compose up postgres

# Via Local Installation
# Set DATABASE_URL in .env
# Run migrations: npx prisma migrate dev
```

### Database Management
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Generate Prisma Client
npx prisma generate

# Seed database
npm run prisma:seed

# Open Prisma Studio
npx prisma studio
```

### API Documentation
- Swagger available at `http://localhost:3001/api/docs`
- All endpoints documented with decorators
- Test endpoints directly in Swagger UI

## Environment Variables

See `.env.example` for all required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `NODE_ENV` - Environment (development/staging/production)
- `NEXT_PUBLIC_API_URL` - Frontend API endpoint

## Performance Checklist

Before merging to main:
- [ ] Run `npm run lint` and `npm run format`
- [ ] Run `npm run test` with passing tests
- [ ] Check bundle size hasn't increased significantly
- [ ] Verify Lighthouse score > 95
- [ ] Test on mobile device
- [ ] No console errors or warnings
- [ ] Accessibility audit passed

## Useful Commands

```bash
# Development
npm run dev                    # Start all services
npm run dev --workspace=name   # Start specific service

# Building
npm run build                  # Build all packages
npm run clean                  # Clean all build artifacts

# Testing
npm run test                   # Run all tests
npm run test:e2e              # Run E2E tests
npm run test:cov              # Test coverage

# Linting
npm run lint                   # Lint all code
npm run format                 # Format code
npm run format:check           # Check formatting

# Database
npx prisma migrate dev        # Create migration
npx prisma studio             # Open Prisma Studio
npm run prisma:seed           # Seed database

# Docker
docker-compose up             # Start services
docker-compose down           # Stop services
docker-compose logs -f        # View logs
```

## Support

For questions about the project structure or development workflow, refer to:
1. `SPRINT_PLAN.md` - Detailed sprint breakdown
2. `README.md` - Project overview and API documentation
3. Individual app READMEs in `apps/` directories
4. GitHub Issues for bugs or feature requests

## Timeline

- **Sprint 1** (Jun 24 - Jul 7): Foundation ✅
- **Sprint 2** (Jul 8 - Jul 21): Auth & DB Schema
- **Sprint 3** (Jul 22 - Aug 4): Data Import & Categories
- **Sprint 4** (Aug 5 - Aug 18): Training Series
- **Sprint 5** (Aug 19 - Sep 1): Mock Exam
- **Sprint 6** (Sep 2 - Sep 15): Gamification
- **Sprint 7** (Sep 16 - Sep 29): Traffic Signs
- **Sprint 8** (Sep 30 - Oct 13): Statistics
- **Sprint 9** (Oct 14 - Oct 27): AI Coach
- **Sprint 10** (Oct 28 - Nov 10): PWA & Offline
- **Sprint 11** (Nov 11 - Nov 24): Admin Dashboard
- **Sprint 12** (Nov 25 - Dec 8): Testing & Deploy

**Expected Launch:** December 2024

---

Last Updated: June 24, 2026
