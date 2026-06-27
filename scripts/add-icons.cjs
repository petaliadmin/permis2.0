const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'panneaux_senegal.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const defaultIcons = {
  danger: '⚠️',
  interdiction: '🚫',
  obligation: '🔵',
  priorite: '✨',
  indication: 'ℹ️',
  direction: '➡️',
  temporaire: '🚧',
  restriction: '📏',
  stationnement: '🅿️',
};

let updated = 0;
for (const pan of data.panneaux) {
  if (!pan.icone) {
    pan.icone = defaultIcons[pan.categorie] || '🚦';
    updated++;
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
console.log(`✅ Updated ${updated} panneaux with icons`);
console.log(`Total panneaux: ${data.panneaux.length}`);
