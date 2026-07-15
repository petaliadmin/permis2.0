# Fonctionnalités, données & contexte produit

## Contexte produit

PWA d'entraînement au code de la route sénégalais : entraînement par séries, examen blanc chronométré, leçons théoriques, panneaux, statistiques, gamification (XP, niveaux, badges, streaks à la Duolingo), coach IA. Cible principale : smartphone, contexte parfois hors-ligne.

## Données — JAMAIS de contenu en dur

Tout le contenu vient des fichiers JSON à la racine, importés via les seeders Prisma :

- `categories_et_meta.json` — catégories de questions + métadonnées
- `fiches_theoriques.json` — leçons théoriques
- `serie_B1.json`, `serie_B2.json`, `serie_B3.json` — séries d'entraînement (25 questions chacune, 75 au total)

Règles :

- N'écris jamais une question, réponse, catégorie ou leçon directement dans le code/JSX.
- Valide les données JSON avant seed (types, relations catégorie↔question↔série, présence des champs).
- Toute nouvelle donnée de contenu passe par un JSON + seeder, pas par une constante.

## Parcours existants (à respecter pour la cohérence)

- **Entraînement** (`app/training`, `components/TrainingComponents.tsx`) : sélection de série → questions une par une, sélection puis validation, **feedback immédiat** (bonne/mauvaise réponse + explication + XP), navigation précédent/suivant. État via store Zustand.
- **Examen blanc** (`app/exam`, `components/ExamComponents.tsx`) : 40 questions / 30 min, timer avec alertes couleur (bleu → jaune <5 min → rouge <1 min), **pas de feedback ni de retour arrière** pendant l'examen, auto-soumission à l'expiration, page de résultats (score %, détail par catégorie, XP gagné).
- **Auth** (`app/auth/login`, `register`) : fond `bg-gradient-hero`, carte centrée, JWT + Google OAuth. Store `authStore`.

Quand tu ajoutes une fonctionnalité, reprends ces conventions (états de chargement par skeleton/spinner, feedback gamifié, structure header sticky + contenu + footer sticky).

## Gamification

- XP, niveaux, badges, streaks quotidiens. Le calcul d'XP/niveau est une logique pure → `packages/utils`, testée. Affiche la progression avec `Progress` et `Stat`.

## PWA & offline

- `public/manifest.json` (standalone, portrait, shortcuts), `public/sw.js` (network-first pour la navigation, stale-while-revalidate pour les assets, **ne cache jamais les appels API ni le non-GET**), `components/pwa/ServiceWorkerRegister.tsx`, `components/pwa/InstallPrompt.tsx` (Android `beforeinstallprompt` + instructions iOS, cooldown de refus, jamais affiché si déjà installé).
- Si tu touches au cache : incrémente la version du SW et garde l'exclusion des API.

## Sécurité

- Valide toutes les entrées (DTO/pipes côté API). Rate limiting sur l'API. Headers sécurisés. CSRF. Pas de token brut en `localStorage`.

## Workflow Git

- Branches : `feature/*`, `bugfix/*` depuis `develop`. Commits conventionnels : `feat(scope):`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:`. Ex. `feat(exam): add per-category score breakdown`.
- Ne commit/push que si on te le demande.
