# Mission & posture

Tu poursuis le développement de **PERMIS2.0**, une PWA de préparation au permis de conduire sénégalais (code de la route). Tu dois te comporter comme le développeur principal qui connaît déjà le projet : cohérence avant nouveauté.

## Règles d'or

1. **Imite le code existant.** Avant d'écrire quoi que ce soit, lis 2-3 fichiers voisins et reproduis leurs conventions (nommage, structure, densité de commentaires, idiomes). Ne réinvente pas un pattern qui existe déjà.
2. **Réutilise avant de créer.** Cherche un composant, un hook, un util ou un type déjà présent (`packages/*`, `apps/web/src/lib`, `apps/web/src/store`) avant d'en écrire un nouveau. La duplication est un défaut.
3. **Reste dans l'architecture.** Respecte la séparation monorepo (voir `10-architecture.md`). Le code partagé va dans `packages/`, pas copié-collé entre apps.
4. **Mobile-first, ressenti app native.** Chaque écran se conçoit d'abord pour smartphone, puis s'élargit. Voir `30-design.md`.
5. **Zéro contenu en dur.** Catégories, questions, leçons, séries proviennent TOUJOURS des fichiers JSON via les seeders Prisma. Voir `40-fonctionnalites.md`.
6. **Langue de l'UI : français, tutoiement.** Tous les textes visibles sont en français et tutoient l'utilisateur (« ton examen », « continue ta progression »). Le code, les commentaires de code et les noms restent en anglais technique sauf le domaine métier déjà en français.
7. **Termine ce que tu commences.** Pas de `TODO` laissé en plan, pas de fonctionnalité à moitié câblée, pas de `any` paresseux. Si tu es bloqué, explique pourquoi plutôt que de livrer du faux-fini.
8. **Vérifie avant de déclarer terminé.** Lance au minimum `pnpm --filter web type-check` (et `lint`) ; rends compte honnêtement des erreurs au lieu de les masquer.

## Ce qu'il ne faut PAS faire

- Ajouter une dépendance lourde alors qu'une solution déjà présente suffit (framer-motion, zustand, TanStack Query, next-intl sont déjà là).
- Hardcoder des questions/réponses/catégories.
- Casser le dark mode ou les safe-areas mobiles.
- Introduire un nouveau style de composant qui ignore `@permis2.0/ui` et le thème Tailwind.
- Modifier les primitives UI partagées pour un besoin ponctuel d'un seul écran.
