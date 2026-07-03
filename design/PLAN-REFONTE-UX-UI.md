# Permis2.0 — Plan de refonte UX/UI complète

**Direction de design : « Playful Premium »**
Style ludique, doux, moderne et fluide — sensation de jeu, rigueur d'une app d'apprentissage.
Basé sur le référentiel *UI-UX Pro Max* (67 styles, 99 guidelines UX, anti-patterns).

---

## 1. Diagnostic & objectif

Le produit apprend le Code de la route sénégalais et prépare l'examen. Le risque classique de ce type d'app : **une interface « formulaire »** (listes de questions, texte dense) qui décourage. L'objectif de la refonte est de transformer l'apprentissage en **boucle de jeu** (essayer → feedback → récompense → progresser) tout en gardant une lisibilité et une crédibilité pédagogique premium.

**Nord de la refonte :** *chaque écran doit être compréhensible en 3 secondes, agréable au toucher, et donner envie de revenir demain.*

---

## 2. Choix du langage visuel (justifié)

Croisement du référentiel avec le besoin « jeu + doux + premium + éducatif » :

| Style candidat (repo) | Apport | Verdict |
|---|---|---|
| **Claymorphism** | Formes gonflées, douces, ludiques — recommandé pour apps éducatives/enfants | ✅ Base principale |
| **Soft UI Evolution** | Ombres douces, profondeur subtile, feel premium | ✅ Base principale |
| **Micro-interactions** | Feedback tactile, mobile/touch | ✅ Couche d'interaction |
| Vibrant & Block-based | Énergie « gaming » | ⚠️ Par touches (jeux, récompenses) |
| Neumorphism pur | Trop faible contraste → risque accessibilité | ❌ Écarté |
| Dark mode par défaut, néon, glassmorphism lourd | Fatigue visuelle, hors ton pédagogique | ❌ Anti-patterns |

**Décision :** un hybride **Claymorphism + Soft UI** avec micro-interactions à ressort. Doux au repos, vivant au toucher.

---

## 3. Design tokens (source de vérité)

### Couleurs — double lecture marque / code de la route
Astuce clé : les couleurs sémantiques **sont** celles du code de la route, ce qui renforce l'apprentissage.

| Rôle | Hex | Usage |
|---|---|---|
| Vert marque | `#0E9B74` | Identité, en-têtes |
| Go / réussite | `#1FBF8F` | Bonnes réponses, « autorisé » |
| Or / XP | `#FFC24B` | Récompenses, progression, chaleur « teranga » |
| Énergie | `#FF7A59` | Défis, CTA secondaires |
| Danger / infraction | `#F1556C` | Erreurs, interdictions, sanctions |
| Vigilance | `#FFB020` | Avertissements, priorités |
| Info / simulateur | `#3D8BFD` | Contexte, mode simu |
| Fond | `#FFF9F2` | Fond chaud, non blanc pur (moins fatigant) |
| Encre | `#232733` | Texte principal (contraste AA) |

> Anti-patterns évités : néon, dégradés « IA violet/rose », dark mode imposé.

### Typographie
- **Display — Baloo 2** (arrondie, amicale, premium) : titres, scores, récompenses.
- **Texte — Plus Jakarta Sans** (nette, lisible) : contenu pédagogique, méta, boutons.
- Échelle : 46 / 30 / 20 / 16 / 13 px. Deux niveaux de graisse par police.

### Forme & profondeur
- Rayons : cartes 20–28px, contrôles 14px, boutons **pill**.
- Ombres « clay » douces à deux couches (jamais dures, jamais de néon).
- Espacement généreux (grille 4/8px), zones tactiles ≥ 44px.

Ces tokens sont à matérialiser dans `tailwind.config.ts` + CSS variables + thème shadcn/ui, et documentés dans `design-system/MASTER.md`.

---

## 4. Architecture d'information & navigation

Navigation principale en **5 onglets** (bottom nav mobile / rail latéral desktop) :

1. **Accueil** — parcours de progression, défi du jour, reprise rapide.
2. **Jeux** — mini-jeux éducatifs par thème.
3. **Simulateur** — conduite (ville, nuit, pluie, giratoires…).
4. **Moniteur IA** — coach conversationnel, corrige et encourage.
5. **Profil** — stats, badges, abonnement, réglages.

Rôles séparés par des espaces dédiés : **Élève** (l'app ci-dessus), **Moniteur/Auto-école** (dashboard de suivi), **Admin** (gestion contenu, abonnements). Même design system, densité d'information différente (Bento Grid pour les dashboards).

---

## 5. Boucle de jeu & gamification

Moteurs de rétention prouvés (Duolingo-like, mais premium) :

- **Parcours de niveaux** : chemin visuel (fait / en cours pulsant / verrouillé), 3 étoiles par leçon.
- **XP & niveaux** : gain immédiat visible à chaque bonne réponse.
- **Série (streak)** : flamme quotidienne + rappel doux (notification/PWA).
- **Pièces & boutique** : débloquer thèmes, vies, indices.
- **Ligues hebdomadaires & défis quotidiens** : compétition légère, sociale.
- **Badges** : jalons pédagogiques (« 100 % priorités », « Prêt pour l'examen »).
- **Mode Examen blanc** : conditions réelles, chrono, score officiel.

Chaque interaction = feedback multisensoriel : couleur + son (Howler.js) + vibration + animation à ressort. Confettis sur réussite, secousse douce sur erreur (jamais punitif : on explique, on rejoue).

---

## 6. Écrans clés (priorités de conception)

1. **Onboarding ludique** : objectif, catégorie de permis, niveau — 3 écrans max, premier « win » en < 60 s.
2. **Accueil / parcours** (voir prototype).
3. **Leçon + Quiz** : panneau illustré, options en cartes, correction pédagogique (Pourquoi ? Règle ? Risque ? Sanction ? Astuce mémo).
4. **Mini-jeux** (Phaser/PixiJS) : priorités aux intersections, association, quiz éclair.
5. **Simulateur** : scènes routières (feux, piétons, pluie, nuit).
6. **Moniteur IA** : chat qui détecte les erreurs fréquentes et propose des exercices ciblés.
7. **Résultats & récompenses** : animation de succès, XP, badge, partage.
8. **Dashboard auto-école** : suivi élèves, taux de réussite, Bento cards + Chart.js.

---

## 7. Mouvement & performance (fluidité)

- **Framer Motion** : transitions de pages, ressorts sur cartes et boutons (200–300ms).
- **GSAP** : séquences de récompense, parcours animé.
- **Phaser 3 / PixiJS** : jeux 60 FPS.
- Skeleton loaders (pas de spinner brut), transitions partagées.
- Budget perf : LCP < 2,5 s sur 3G, animations GPU (transform/opacity), lazy-loading des jeux.

---

## 8. Accessibilité & contexte terrain (Afrique / Sénégal)

- Contraste texte ≥ 4.5:1, focus clavier visibles, cibles ≥ 44px.
- `prefers-reduced-motion` respecté (désactive rebonds/confettis).
- **Mobile & offline-first** : PWA, cache des leçons, synchro différée.
- Optimisé Android d'entrée de gamme, réseau instable, data légère.
- Français d'abord ; prévoir wolof pour l'audio/explications (fort levier local).
- Paiement : penser mobile money (Orange Money / Wave) en plus de Stripe.

---

## 9. Mise en œuvre technique (mapping stack)

- **Tokens** → `tailwind.config.ts` + variables CSS + thème shadcn/ui.
- **Composants** → bibliothèque `shared/ui` (Button, Card, XPBar, PathNode, QuizOption, RewardModal…), typés strict, testés (Storybook conseillé).
- **State/API** → React Query + Server Actions ; Supabase (RLS par rôle élève/moniteur/admin).
- **Jeux** → module `games/` isolé (Phaser), chargé à la demande.
- **Qualité** → tests unitaires (Vitest), E2E (Playwright), audit a11y (axe), Lighthouse.

---

## 10. Feuille de route (phasée)

| Phase | Durée | Livrables |
|---|---|---|
| **0 — Fondations** | 1–2 sem. | Design tokens, thème Tailwind/shadcn, `MASTER.md`, kit de composants de base |
| **1 — Cœur élève** | 3–4 sem. | Onboarding, accueil/parcours, leçon+quiz, récompenses, PWA |
| **2 — Jeux & simulateur** | 3–4 sem. | 3–4 mini-jeux Phaser, 1re scène simulateur, moniteur IA v1 |
| **3 — Gestion** | 2–3 sem. | Dashboards auto-école/admin, abonnements, paiements |
| **4 — Polish & scale** | continu | Ligues, défis, audits a11y/perf, A/B tests, i18n wolof |

---

## 11. Risques & garde-fous

- **Sur-gamification** → garder la crédibilité pédagogique (contenus conformes au Code, jamais inventés ; signaler l'incertain).
- **Perf sur bas de gamme** → tester tôt sur vrais appareils Android, budget d'animation strict.
- **Accessibilité vs. « fun »** → toute animation a un fallback réduit.
- **Cohérence** → un seul design system, revue de composants obligatoire (pas de styles ad hoc).

---

*Prochaine étape recommandée : valider la direction via le prototype HTML, puis générer les design tokens Tailwind + le kit de composants shadcn/ui de la Phase 0.*
