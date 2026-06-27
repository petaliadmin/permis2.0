# Design system & ressenti « app mobile native »

L'app doit ressembler à une application mobile installée, pas à un site web responsive. Mobile d'abord, desktop ensuite.

## Tokens — n'utilise QUE ceux du thème Tailwind (`apps/web/tailwind.config.ts`)

- **Couleurs** : `primary` #16A34A (vert succès/conduite), `secondary` #FACC15 (jaune attention), `danger` #DC2626 (interdiction), `dark` #111827 / `dark-950` #0b1120. Chaque couleur a ses nuances 50→900 — utilise-les, n'invente pas de hex en dur.
- **Rayons** : `rounded-xl` / `2xl` / `3xl` (cartes : 2xl, feuilles/hero : 3xl).
- **Ombres** : `shadow-soft`, `shadow-card`, `shadow-glow` (glow vert pour le focus/hover).
- **Gradients** : `bg-gradient-primary`, `bg-gradient-hero`.
- **Animations Tailwind** : `animate-fade-in`, `fade-in-fast`, `scale-in`, `float`, `shimmer`.

## Composants

- **Toujours** réutiliser `@permis2.0/ui` : `Button` (variants default/secondary/danger/outline/ghost ; tailles sm/default/lg/xl/icon), `Card` (+ Header/Title/Description/Content/Footer), `Input`, `Badge`, `Progress`, `Stat`. Ne fabrique pas un bouton/carte maison.
- Dark mode obligatoire sur tout nouvel élément : décline chaque couleur en `dark:` (regarde n'importe quel composant existant pour le pattern).

## Patterns « app native » établis (à respecter et reproduire)

- **Chrome** : `AppShell` fournit le header sticky compact + la barre d'onglets basse (5 onglets max). Toute page principale passe par `AppShell`. Les écrans plein-flux (training/exam) ont leur propre header/footer sticky.
- **Transitions d'écran** : `PageTransition` (fondu + slide via `framer-motion` + `AnimatePresence` keyé sur le pathname). Réutilise-le, ne recâble pas une autre solution.
- **Interactions tactiles** : effet d'appui `whileTap={{ scale: 0.95-0.97 }}` (framer-motion) plutôt que des effets `hover:` qui n'existent pas au doigt. Indicateur d'onglet actif animé via `layoutId`.
- **Safe-areas** : respecte les encoches avec `pt-[env(safe-area-inset-top)]` / `pb-[env(safe-area-inset-bottom)]` et `viewportFit: 'cover'` (déjà en place dans `layout.tsx`).
- **App-feel global** (`globals.css`) : `overscroll-behavior-y: none`, `-webkit-tap-highlight-color: transparent`, `user-select:none` sur le chrome (nav/boutons) mais le **texte de contenu reste sélectionnable**.
- **Cibles tactiles ≥ 44px**, padding généreux, typo qui se réduit sur mobile (`text-sm` → `sm:text-base`).

## Animation

- `framer-motion` (déjà installé) pour les micro-interactions et transitions ; `animate-*` Tailwind pour les effets simples. Reste subtil et rapide (durées ~0.2–0.35s, ressorts amortis). Respecte `prefers-reduced-motion` (framer-motion le gère automatiquement).

## Accessibilité (WCAG 2.1 AA, cible du projet)

- Contraste suffisant, `aria-*` sur les éléments interactifs (`aria-current`, `aria-label`, `role="dialog"`…).
- **Ne bloque pas le zoom** (`userScalable` reste `true`) — critère 1.4.4. Le ressenti app ne justifie pas de casser l'accessibilité.
- Navigation clavier fonctionnelle, focus visibles (ring primary déjà défini).

## Performance

- Cible Lighthouse > 95. Code splitting, lazy loading, images optimisées (`next/image`), cache des réponses via TanStack Query. Surveille la taille du bundle ; pas d'import massif pour un petit besoin.
