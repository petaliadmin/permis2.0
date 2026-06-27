# PERMIS2.0 - Progressive Web App for Driving License Exam Preparation

🎯 **Réussissez votre permis du premier coup**

Permis2.0 is a production-ready Progressive Web App (PWA) designed to help users prepare for the Senegalese driving theory exam and driving license test.

Inspired by **Duolingo**, **Ornikar**, and **En Voiture Simone** with a mobile-first approach.

## 🎨 Features

### Core Modules
- ✅ **Theory Training** - Learn from theoretical lessons with multimedia content
- ✅ **Training Series** - Practice with 3 series (B1, B2, B3) of 25 questions each
- ✅ **Mock Exam** - Timed 30-minute exam with 40 random questions
- ✅ **Traffic Signs** - Complete reference of traffic signs with search and filters
- ✅ **Statistics** - Detailed performance analytics with charts
- ✅ **AI Coach** - Personalized recommendations based on weak areas
- ✅ **Gamification** - XP, levels, badges, and daily streaks

### User Features
- 🌙 Dark Mode support
- 📱 Mobile-first design
- ⭐ Favorites system
- 🔊 Text-to-speech
- 📊 Progress tracking
- 📈 Category performance analysis
- 💾 Offline mode with service worker

### PWA Features
- 📲 Installable app
- 🔌 Offline functionality
- 🔔 Push notifications
- 💪 Background sync
- ⚡ Caching strategies

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 15
- TypeScript
- TailwindCSS
- Shadcn UI
- Framer Motion
- Zustand (state management)
- TanStack Query (data fetching)
- Recharts (visualizations)

**Backend:**
- NestJS
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Google OAuth

**Infrastructure:**
- Docker & Docker Compose
- GitHub Actions CI/CD
- Supabase Storage
- Firebase Cloud Messaging

### Directory Structure

```
permis2.0/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # NestJS backend
├── packages/
│   ├── types/               # TypeScript types
│   ├── utils/               # Shared utilities
│   ├── hooks/               # React hooks
│   ├── ui/                  # Component library
│   └── shared/              # Shared constants
├── docker-compose.yml
├── turbo.json
└── SPRINT_PLAN.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Docker & Docker Compose (optional, for containerized setup)
- PostgreSQL 16+ (if running locally)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd permis2.0
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**
```bash
cd apps/api
npx prisma migrate dev
npm run prisma:seed
```

### Development

**Start all services:**
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

**Individual services:**
```bash
npm run dev --workspace=@permis2.0/web
npm run dev --workspace=@permis2.0/api
```

### Docker Setup

```bash
# Start all services with Docker
docker-compose up -d

# Seed database
docker-compose exec api npm run prisma:seed

# View logs
docker-compose logs -f api
docker-compose logs -f web

# Stop services
docker-compose down
```

## 📦 Database Schema

The application uses Prisma ORM with the following models:

- **User** - User accounts and profiles
- **Category** - Question categories
- **Lesson** - Theoretical lessons
- **Series** - Training series (B1, B2, B3)
- **Question** - Quiz questions
- **Choice** - Answer choices
- **Exam** - User exams and results
- **Progress** - Series progress tracking
- **Statistic** - Performance statistics
- **Favorite** - User favorites
- **Badge** - Achievement badges
- **DailyStreak** - Streak tracking
- **TrafficSign** - Traffic sign references
- **Notification** - User notifications
- **Subscription** - Subscription plans

## 📋 Sprint Plan

Development is organized into 12 two-week sprints (6 months total):

1. **Sprint 1** - Foundation & Setup
2. **Sprint 2** - Database & Authentication
3. **Sprint 3** - Data Import & Categories
4. **Sprint 4** - Training Series & Questions
5. **Sprint 5** - Mock Exam System
6. **Sprint 6** - Gamification System
7. **Sprint 7** - Traffic Signs Module
8. **Sprint 8** - Statistics & Analytics
9. **Sprint 9** - AI Coach & Personalization
10. **Sprint 10** - PWA & Offline Features
11. **Sprint 11** - Admin Dashboard
12. **Sprint 12** - Testing, Deployment & Polish

See [SPRINT_PLAN.md](./SPRINT_PLAN.md) for detailed breakdown.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔍 Linting & Formatting

```bash
# Lint
npm run lint

# Format
npm run format

# Check formatting
npm run format:check
```

## 🚢 Deployment

### Build

```bash
npm run build
```

### Docker

```bash
# Build images
docker build -f Dockerfile.api -t permis2.0-api:latest .
docker build -f Dockerfile.web -t permis2.0-web:latest .

# Push to registry
docker push your-registry/permis2.0-api:latest
docker push your-registry/permis2.0-web:latest
```

## 📚 API Documentation

API documentation is available at `/api/docs` when the backend is running.

### Key Endpoints

```
GET    /categories
GET    /lessons
GET    /lessons/:id
GET    /series
GET    /series/:id
GET    /questions
GET    /questions/random
POST   /exam/start
POST   /exam/submit
GET    /statistics
POST   /favorites
GET    /profile
POST   /auth/login
POST   /auth/register
GET    /traffic-signs
```

## 🎨 Design System

Colors:
- **Primary:** #16A34A (Green)
- **Secondary:** #FACC15 (Yellow)
- **Danger:** #DC2626 (Red)
- **Dark:** #111827
- **Background:** #FFFFFF

## 📱 Mobile Optimization

- Touch-friendly UI with large buttons
- Bottom navigation for easy access
- Infinite scroll for lists
- Skeleton loading states
- Pull-to-refresh functionality
- Responsive cards
- Optimized performance (Lighthouse > 95)

## 🌍 Internationalization

Currently supports:
- 🇫🇷 Français (French)
- 🇸🇳 Wolof

Architecture ready for additional languages.

## 📊 Performance Targets

- Lighthouse score > 95
- First Contentful Paint < 2s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- Interaction to Next Paint < 200ms

## 🔒 Security

- JWT authentication with refresh tokens
- Google OAuth integration
- CORS configuration
- Input validation
- XSS protection
- CSRF protection
- Secure headers
- Rate limiting

## 📄 License

MIT

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, contact the development team or open an issue on GitHub.

---

**Made with ❤️ for Senegal's drivers**
