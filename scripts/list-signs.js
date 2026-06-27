const data = require('./panneaux_senegal.json');
data.panneaux.forEach(p => console.log(p.code + '\t' + p.nom + '\t' + p.categorie));
