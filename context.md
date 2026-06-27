# PERMIS2.0 - Product Requirements & Development Prompt

## Role

Act as a Senior Product Manager, Senior UX/UI Designer, Software Architect, and Fullstack Engineer.

Build a production-ready Progressive Web App (PWA) called **Permis2.0**, dedicated to preparing users for the Senegalese driving theory exam and driving license.

The application must provide an experience comparable to Duolingo, Ornikar and En Voiture Simone.

The application is **mobile-first** and must be optimized for smartphones before desktop.

---

# Source of Truth

The application must use ONLY the data contained in the following JSON files:

- `categories_et_meta.json`
- `fiches_theoriques.json`
- `serie_B1.json`
- `serie_B2.json`
- `serie_B3.json`

### Important Rules

- Never hardcode categories.
- Never hardcode questions.
- Never invent lessons.
- Never invent answers.
- Everything must be generated dynamically from the JSON files.
- Create Prisma seeds from these files.

---

# Technical Stack

## Frontend

- Next.js 15
- TypeScript
- TailwindCSS
- Shadcn UI
- Framer Motion
- Zustand
- TanStack Query
- PWA support
- Dark Mode

## Backend

- NestJS
- Prisma ORM
- PostgreSQL

## Authentication

- JWT
- Google Login

## Storage

- Supabase Storage

## Notifications

- Firebase

## Charts

- Recharts

---

# Architecture

Use Clean Architecture.

```
apps/
│
├── web/
├── api/
│
packages/
├── ui/
├── hooks/
├── utils/
├── types/
├── shared/
```

Layers:

```
Domain
Application
Infrastructure
Presentation
```

Follow SOLID principles.

---

# Branding

Application name:

# PERMIS2.0

Slogan:

> Réussissez votre permis du premier coup.

---

# Design System

Inspired by:

- Duolingo
- Ornikar
- En Voiture Simone

### Colors

Primary

```css
#16A34A
```

Secondary

```css
#FACC15
```

Danger

```css
#DC2626
```

Dark

```css
#111827
```

Background

```css
#FFFFFF
```

### Style

- Modern
- Rounded cards
- Soft shadows
- Large icons
- Smooth animations
- Highly readable
- Mobile-first

---

# Home Screen

Display:

- User Level
- XP
- Daily streak 🔥
- Overall progression
- Average score
- Last activity

Sections:

- Révision
- Séries
- Examen blanc
- Panneaux
- Statistiques
- Profil

Bottom Navigation:

- Accueil
- Révision
- Tests
- Stats
- Profil

---

# Revision Module

Generate dynamically from:

`fiches_theoriques.json`

Display:

- titre
- contenu
- points_cles
- exceptions
- erreurs_frequentes
- règles
- illustrations

Features:

❤️ Favorites

🔊 Text-to-Speech

📄 Export PDF

🔎 Search

🏷 Category filter

---

# Categories Module

Generate from:

`categories_et_meta.json`

Each category contains:

- id
- label
- description
- couleur
- icone

Display:

- icon
- color
- progress percentage
- number of questions

Nothing must be hardcoded.

---

# Training Series

Automatically import:

- B1
- B2
- B3

Each series contains:

25 questions.

Each question contains:

- numero
- enonce
- signalisation_visible
- propositions
- reponses_correctes
- explication
- categorie

UX:

- One question per screen
- Swipe navigation
- Progress bar
- Immediate correction
- Success animation
- Sound effects

---

# Mock Exam

Generate dynamically.

Select 40 random questions among:

- B1
- B2
- B3

Timer:

30 minutes

Results:

- Score
- Percentage
- Time used
- Pass or Fail

Detailed analysis:

- Strong categories
- Weak categories

---

# AI Coach

Analyze user mistakes.

Example:

> You frequently fail on Priority and Overtaking questions.

Recommend:

- Related lessons
- Personalized quizzes
- Revision plan

---

# Traffic Signs Module

Build automatically from:

```ts
signalisation_visible
```

Features:

### Search

### Filters

- Danger
- Interdiction
- Obligation
- Priorité
- Indication

Each sign contains:

- name
- meaning
- category
- description

---

# Statistics Module

Charts:

### Success rate

### Category performance

### Progress over time

### Average answer time

### Number of completed tests

### Daily streak

Use Recharts.

---

# Gamification

Inspired by Duolingo.

XP System

Levels:

- Débutant
- Intermédiaire
- Confirmé
- Expert

Lives

❤️❤️❤️

Daily Streak

🔥

Achievements

🏆 First Test

🏆 100 Correct Answers

🏆 B1 Completed

🏆 B2 Completed

🏆 B3 Completed

🏆 Priority Master

🏆 Traffic Sign Expert

Rewards

🎁

---

# User Profile

Display:

- Avatar
- Name
- XP
- Level
- Badges
- Average score
- Tests completed
- Weak categories
- Strong categories

---

# Favorites

Save:

- Lessons
- Questions

Synchronize with database.

---

# Database Schema

Create Prisma models:

```prisma
User

Category

Lesson

Series

Question

Choice

Exam

ExamQuestion

ExamResult

Progress

Statistic

Favorite

Badge

DailyStreak

Subscription

Notification

TrafficSign
```

Create all relationships.

---

# Admin Dashboard

Full CRUD:

### Categories

### Lessons

### Questions

### Answers

### Series

### Users

### Statistics

### Subscriptions

### Notifications

Changes must update PostgreSQL automatically.

---

# NestJS API

```http
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

---

# PWA Features

Offline mode

Installable app

Push notifications

Background sync

Caching

Service Worker

App shortcuts

Splash screen

---

# Mobile First Requirements

Large buttons

Bottom navigation

Infinite scroll

Skeleton loading

Pull-to-refresh

Fast transitions

Responsive cards

Touch friendly

Dark mode

Accessibility support

---

# Internationalization

Languages:

- Français
- Wolof

Architecture ready for future languages.

---

# Performance Requirements

- Lighthouse score > 95
- SEO optimized
- Lazy loading
- Code splitting
- Server Components
- Suspense
- React Query caching
- Optimistic updates

---

# Testing

Unit Tests

Integration Tests

E2E Tests

Vitest

Playwright

---

# CI/CD

GitHub Actions

Docker

Docker Compose

Environment variables

Production-ready deployment

---

# Deliverables

Generate:

1. Complete project architecture.
2. Prisma schema.
3. NestJS backend.
4. Prisma seeders from JSON files.
5. Next.js frontend.
6. Shadcn components.
7. REST APIs.
8. Authentication system.
9. Admin dashboard.
10. Statistics module.
11. AI Coach module.
12. Gamification system.
13. Docker configuration.
14. CI/CD pipelines.
15. Unit and E2E tests.

The final product must be production-ready and deployable on Web, Android and iOS using Capacitor.