# Enregistrements audio en wolof

Déposer les fichiers `.mp3` ici — l'application les détecte automatiquement,
aucun changement de code n'est nécessaire. Le bouton « Wolof » n'apparaît que
si le fichier du panneau ou de la leçon existe.

## Convention de nommage

| Contenu  | Dossier     | Nom du fichier          | Exemple          |
| -------- | ----------- | ----------------------- | ---------------- |
| Panneaux | `panneaux/` | `<code du panneau>.mp3` | `AB4.mp3` (STOP) |
| Leçons   | `lecons/`   | `<id de la leçon>.mp3`  | `cmr5g56p….mp3`  |

- Les codes des panneaux sont ceux de `public/data/panneaux.json` (A1, B14, AB4, FEU1…).
- Les ids des leçons sont visibles dans l'URL de chaque leçon (`/cours/<id>`).
- Format recommandé : MP3 mono, 64–96 kbps (fichiers légers pour les connexions mobiles).
- Contenu suggéré : nom du panneau + description, telles qu'affichées dans l'app.
