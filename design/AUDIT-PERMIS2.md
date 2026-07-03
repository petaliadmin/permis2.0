# Audit complet — Permis2.0

Audit technique du monorepo (web Next.js + API NestJS/Prisma) : architecture, workflow, logique métier, sécurité, base de données, qualité, conformité et performance. Chaque constat renvoie au fichier concerné et porte une sévérité : **P0** bloquant, **P1** important, **P2** amélioration.

---

## 1. Vue d'ensemble

Monorepo Turborepo cohérent et bien découpé :

- **`apps/web`** — Next.js 15 (App Router), React 18, Tailwind, Framer Motion, Zustand, React Query, PWA. 22 écrans (auth, quizz, examen, tests, panneaux, boutique, profil).
- **`apps/api`** — NestJS + Prisma + PostgreSQL. Modules complets : auth (JWT + Google OAuth + rôles), user, category, lesson, series, question, exam, gamification, statistics, ai-coach, traffic-sign, conduite, entitlement, shop (paiement Bictorys = Orange Money / Wave / carte).
- **`packages`** — ui, hooks, utils, types, shared (bien mutualisés).

La base technique est de bon niveau (validation, helmet, throttler, bcrypt, transactions, webhooks vérifiés). Les problèmes sont surtout **architecturaux et de cohérence**, pas de plomberie.

---

## 2. Constat majeur — deux systèmes parallèles déconnectés (P1, structurant)

Le cœur du parcours (quiz, progression, XP) tourne **côté client** sur du JSON embarqué (`apps/web/src/app/quizz/config.ts`, `public/data/questions_doc.json`) et `localStorage` (`quizz_progress`, `permis_user`, `gamificationStore`).

En parallèle, l'API expose un système **serveur-autoritaire complet** (Series → Question → `submitAnswer` → Progress/Statistic/XP, Exam, Entitlement) qui **n'est pas branché** au quiz du frontend. Seuls l'authentification, la boutique et les achats consomment réellement l'API.

Conséquences directes :

- **Progression et XP non fiables** : stockés en local, effaçables, non synchronisés entre appareils, falsifiables (DevTools).
- **Contenu premium contournable** : tout le JSON est livré au navigateur et la limite « 3 questions gratuites » (`FREE_QUESTIONS`) est appliquée en JS. Le vrai verrou serveur (`EntitlementService`) existe mais ne protège pas le quiz.
- **Triple source de vérité pour les niveaux** : `getLevelFromXP` (`@permis2.0/utils`), `SeriesService.calculateLevel`, `ExamService.calculateLevel` — trois implémentations à maintenir, risque d'incohérence.

C'est le point n°1 à trancher : soit l'app reste « offline-first invité » (assumé, avec sync serveur en option), soit le quiz passe serveur-autoritaire. L'état actuel cumule les coûts des deux sans les garanties.

---

## 3. Sécurité

### Points forts (à conserver)

`ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`), `helmet`, `ThrottlerGuard` global, `RolesGuard` sur l'admin, bcrypt(10), tokens de reset **hashés + TTL 1h + pas d'énumération d'emails**, webhook Bictorys vérifié par `X-Secret-Key` en comparaison **temps-constant** (`timingSafeEqual`), `markPaid` **idempotent + vérification du montant + transaction**. Bon niveau global.

### Failles / risques

| # | Sévérité | Constat | Fichier |
|---|---|---|---|
| S1 | **P0** | **Route de confirmation « dev » exploitable en prod.** `devConfirm` n'est bloquée que si `NODE_ENV==='production'` **ET** `PAYMENT_LIVE==='true'`. En prod sans `PAYMENT_LIVE=true`, `POST /shop/confirm/:id` accorde les entitlements **sans paiement** → premium gratuit. | `shop/shop.service.ts:242` |
| S2 | **P1** | **Farm d'XP illimité** : `submitAnswer` (entraînement) n'a aucune idempotence ni unicité `(userId, questionId)` ni liaison de session → rejouer la requête ajoute de l'XP à l'infini. | `series/series.service.ts:107` |
| S3 | **P1** | **Gate premium côté client** (voir §2) : contenu payant lisible via le JSON livré au navigateur. | `web/.../quizz/config.ts` |
| S4 | **P1** | **Rate-limit trop permissif sur l'auth** : throttler global 100 req/60 s appliqué uniformément → brute-force login peu contraint. Ajouter une limite dédiée stricte sur `/auth/login` et `/auth/register`. | `app.module.ts:30` |
| S5 | **P1** | **Google OAuth sans liaison de compte** : `googleLogin` cherche par `googleId` seul ; si l'email existe déjà (compte mot de passe), le `create` viole l'unique email → 500, pas de fusion. | `auth/auth.service.ts:66` |
| S6 | **P2** | **JWT en `localStorage`** (zustand persist `auth-store`) → vol de token si XSS. Envisager cookie httpOnly + refresh, ou au minimum durcir la CSP. | `web/src/store/authStore.ts:127` |
| S7 | **P2** | **Swagger exposé sans condition** (`/api/docs`) même en production. À gater sur `NODE_ENV`. | `api/src/main.ts:36` |
| S8 | **P2** | Doc obsolète : `CLAUDE.md`/README annoncent **Supabase + RLS**, l'implémentation est **Postgres brut via Prisma sans RLS** — l'autorisation repose 100 % sur les guards. Aligner la doc (ou ajouter RLS si multi-tenant auto-écoles prévu). | `CLAUDE.md` |

---

## 4. Logique métier

- **Questions à réponses multiples mal notées (P1)** : `reponses_correctes` est un `String[]`, mais `submitAnswer` fait `reponses_correctes.includes(userAnswer)` avec **une seule** réponse. Les questions à choix multiples ne sont pas correctement évaluées (pas de vérification d'égalité d'ensembles). — `series/series.service.ts:121`, `exam/exam.service.ts:211`
- **Examen** : sélection aléatoire globale toutes séries confondues, auto-submit à l'expiration, seuil de réussite **70 %**, durée **30 min / 25 questions** par défaut. → **À valider contre le format officiel sénégalais** (nombre de questions, durée, seuil). Ne pas figer une règle non vérifiée ; sourcer officiellement avant mise en prod.
- **`xpEarned` approximatif** dans `getExamResult` (`result.score * XP_RULES.correctAnswer`) alors que `score` = nombre de questions répondues, pas de bonnes réponses → XP affiché ≠ XP réellement crédité. — `exam/exam.service.ts:379`
- **Entraînement non persisté serveur** : hors examen, les réponses ne créent pas de trace par question → les statistiques serveur sont partielles.
- **Migration invité → compte** (`migrateGuestProgress`) : bien pensée (XP additionné une fois, streak seulement relevé). Vérifier que le frontend l'appelle réellement à l'inscription.

---

## 5. Base de données

Schéma **propre et bien indexé** : FK indexées, cascades cohérentes, contraintes d'unicité pertinentes (`Progress @@unique([userId,serieId])`, `Entitlement @@unique([userId,key])`, `Badge @@unique([userId,name])`). Montants en XOF entiers (pas de sous-unité) — correct pour le FCFA.

Points d'attention :

- **Redondance `Subscription` vs `Entitlement`/`Product`** : le modèle `Subscription` (plan free/premium/pro) semble legacy et coexiste avec le système d'entitlements du Sprint 6 → clarifier lequel fait foi, supprimer l'autre.
- Pas de table de réponses d'entraînement (voir §4) — à ajouter si le quiz passe serveur.
- Multi-catégorie de permis (A, B, C…) évoquée dans le CLAUDE.md mais non modélisée (pas de champ `permitCategory`).

---

## 6. Qualité de code & dette technique

- **P0 — Corruption de fichiers dans l'arbre de travail** : plusieurs sources contiennent des **octets NUL / troncatures** (`themeStore.ts`, `AppShell.tsx`, pages `auth/*`, `exam/diapo/*`, `boutique`…). `tsc` renvoie des milliers d'erreurs `TS1127 « Invalid character »` et le type-check/build **échoue**. Que ce soit une corruption réelle ou un artefact de synchronisation, c'est **bloquant pour tout déploiement** — à diagnostiquer en premier (`git status`, ré-encodage UTF-8, `pnpm type-check`).
- **Triple calcul de niveau** (§2) → centraliser sur `@permis2.0/utils`.
- **Bruit repo** : ~25 fichiers `*_SUMMARY.md`, `SPRINT_*.md`, logs (`web-dev.log`), scripts temporaires (`tmp_patch.py`, `_fix-auth.mjs`) à la racine → nettoyer / déplacer dans `/docs`.
- **Décalage front/back** : des modules API entiers (ai-coach, lessons, categories, statistics, conduite) n'ont pas d'écran correspondant dans le web actuel → soit backend en avance, soit écrans supprimés. À rationaliser.

---

## 7. Conformité Code de la route sénégalais

Données présentes et localisées : `panneaux_senegal.json`, `serie_B1/B2/B3.json`, `fiches_theoriques.json`, `categories_et_meta.json`. Bon ancrage local.

**À vérifier avec une source officielle avant production** (ne rien inventer) : format exact de l'examen théorique (nombre de questions, durée, seuil de réussite), catégories de permis, barème d'infractions. Les valeurs actuelles (70 % / 25 Q / 30 min) sont des hypothèses codées en dur, à confirmer.

---

## 8. Performance, PWA & contexte terrain

- PWA en place (service worker + `InstallPrompt`) ; le quiz local est **offline-first** par nature — excellent pour le contexte sénégalais (réseau instable, Android d'entrée de gamme).
- Paiement **mobile money** (Bictorys : Orange Money, Wave) déjà intégré — très adapté au marché.
- **À optimiser** : tout le JSON de questions est livré au client → poids initial. Prévoir un code-splitting / chargement par catégorie, et des images optimisées (`next/image`, formats compressés).

---

## 9. Workflow utilisateur (parcours)

Onboarding sans compte (prénom / niveau / objectif → `localStorage`) → accueil (streak, défi du jour, parcours, stats, bannière premium) → quiz par catégories → examen blanc → boutique (mobile money) → profil. Auth optionnelle avec migration invité→compte. **Bon design d'activation** (essayer avant de s'inscrire).

Ruptures à corriger : progression invité fragile (localStorage), et cohérence des données entre le parcours local et le serveur (§2).

---

## 10. Plan d'action priorisé

**P0 — à traiter immédiatement (bloquant / sécurité argent)**

1. Réparer la corruption de fichiers et faire passer `pnpm type-check` + `pnpm build` (§6).
2. Corriger la garde de `devConfirm` : bloquer en production quelle que soit la valeur de `PAYMENT_LIVE` (§S1).

**P1 — avant mise en production**

3. Trancher l'architecture (§2) : source de vérité de la progression/XP (local assumé + sync, ou serveur-autoritaire).
4. Idempotence de `submitAnswer` + notation des réponses multiples (§S2, §4).
5. Verrou premium côté serveur pour le contenu payant (§S3).
6. Rate-limit strict dédié sur l'auth + liaison de compte Google (§S4, §S5).
7. Valider le format d'examen officiel sénégalais (§7).

**P2 — durcissement / propreté**

8. JWT en cookie httpOnly, Swagger gaté, doc alignée (Prisma vs Supabase), nettoyage repo, centralisation du calcul de niveau, clarification `Subscription` vs `Entitlement`.

---

*Note méthodo : l'environnement shell de cet audit était désynchronisé du système de fichiers réel ; les constats de code s'appuient sur la lecture directe des fichiers, et les constats de build (corruption/`tsc`) sont à reproduire localement pour confirmation.*
