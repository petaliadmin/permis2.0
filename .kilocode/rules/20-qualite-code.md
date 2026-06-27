# Qualité de code

## TypeScript

- **Mode strict.** Pas de `any` implicite ni paresseux. Si un type est inconnu, modélise-le (interface, union) ou utilise `unknown` + narrowing.
- Type les props de chaque composant via une `interface` nommée (ex. `interface AppShellProps`). Réutilise les types de `@permis2.0/types` quand ils existent.
- Pas de `@ts-ignore` / `@ts-expect-error` sans commentaire justifiant et seulement en dernier recours.

## Style & conventions

- Suis ESLint + Prettier du repo (`.eslintrc.json`, `.prettierrc.json`). N'invente pas un autre formatage.
- Composants React : `PascalCase`. Hooks : `useXxx`. Constantes de module : `SCREAMING_SNAKE_CASE` (ex. `NAV_LINKS`, `QUICK_ACTIONS`). Variables/fonctions : `camelCase`.
- Préfère des composants fonctionnels avec hooks. Extrais un sous-composant (comme `ActionCard`, `GameChip`) plutôt que de gonfler le JSX.
- Données statiques d'un écran (listes de liens, d'actions) : déclare-les en constante de module, mappe dessus — ne répète pas le JSX à la main.

## Commentaires

- Commente le **pourquoi**, pas le quoi. Densité faible et ciblée, comme dans le code existant (`AppShell.tsx`, `InstallPrompt.tsx` : un court commentaire au-dessus d'un bloc non évident).
- Tous les commentaires de code en anglais.

## Robustesse

- Gère les états async : chargement (skeletons/spinner déjà présents), vide, erreur. Ne suppose pas que `fetch` réussit (`.catch(() => fallback)` est le pattern en place).
- Accès optionnels sûrs : `user?.xp ?? 0`, garde les valeurs par défaut.
- Pas de secret ni de token en clair ; pas de token brut dans `localStorage` (règle sécurité du projet).

## Vérification obligatoire avant de conclure

Depuis la racine ou avec `--filter` :

```bash
pnpm --filter web type-check   # tsc --noEmit, doit passer
pnpm --filter web lint         # next lint
pnpm --filter web build        # si changement structurel
pnpm test                      # si tu touches de la logique testée
```

Rends compte du résultat réel. Si quelque chose échoue, corrige ou explique — ne déclare jamais « terminé » sur une compilation cassée.

## Tests

- Logique métier (utils, services) : tests unitaires. Endpoints : tests d'intégration. Parcours critiques : E2E (Playwright est configuré).
- Objectif de couverture du projet : > 80 % sur la logique. Ajoute des tests quand tu ajoutes de la logique.
