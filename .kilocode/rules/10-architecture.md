# Architecture & structure du monorepo

Turborepo + pnpm workspaces. Respecte strictement les frontières.

```
apps/
  ├── web/    # Next.js 15 (App Router, TypeScript, TailwindCSS, Framer Motion)
  └── api/    # NestJS + Prisma + PostgreSQL
packages/
  ├── types/  # Interfaces TypeScript partagées
  ├── utils/  # Utilitaires (XP, formatage…)
  ├── hooks/  # Hooks React (useAuth, useFavorites…)
  ├── ui/     # Librairie de composants type Shadcn (@permis2.0/ui)
  └── shared/ # Constantes et config (APP_NAME, APP_SLOGAN…)
```

## Règles de placement

- **Composant réutilisable cross-app ou design-system** → `packages/ui/src`, exporté dans son `index.ts`. Sinon composant spécifique à un écran → `apps/web/src/components`.
- **Type partagé entre web et api** → `packages/types`. Ne redéclare pas un type déjà là.
- **Constante / config** → `packages/shared`. Importe via `@permis2.0/shared` (ex. `APP_NAME`).
- **Hook React réutilisable** → `packages/hooks`. Hook local à un écran → à côté de l'écran.
- **Logique métier pure** (calcul XP, scoring) → `packages/utils`, testable isolément.

## Côté web (`apps/web/src`)

- `app/` : App Router. Composants client en tête de fichier avec `'use client'` quand il y a état/effets/hooks navigateur.
- `components/` : composants applicatifs (`AppShell`, `PageTransition`, `TrainingComponents`, `ExamComponents`, `pwa/*`).
- `store/` : état global **Zustand** (`authStore`, `contentStore`). Utilise les stores existants ; ne crée pas un nouveau mécanisme d'état parallèle.
- `lib/` : helpers (ex. `cn` pour merge de classes — utilise-le, ne réimplémente pas).
- Données serveur : **TanStack Query** est disponible pour le cache ; les appels directs `fetch` existants suivent le pattern déjà en place (`NEXT_PUBLIC_API_URL`).
- i18n : **next-intl** (messages dans `apps/web/messages`).

## Côté api (`apps/api`)

- Structure NestJS : modules / controllers / services. Validation via pipes et DTO décorés.
- Accès BDD via **Prisma** uniquement. Schéma dans `apps/api/prisma/schema.prisma`.
- Tout endpoint est documenté Swagger (décorateurs) — disponible sur `/api/docs`.
- Import de données = seeders Prisma lisant les JSON, jamais d'insertion en dur.

## Imports

- Utilise les alias de packages (`@permis2.0/ui`, `@permis2.0/shared`, `@permis2.0/types`…) et l'alias `@/` côté web.
- Pas de chemins relatifs profonds qui traversent les frontières de packages (`../../../packages/...`).
