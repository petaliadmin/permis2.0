/**
 * Restructure les cours en CHAPITRES GÉNÉRALISTES : chaque leçon couvre un
 * domaine complet du code de la route (ex. « Priorité » regroupe priorité à
 * droite, STOP, cédez-le-passage, route prioritaire et giratoire) et illustre
 * l'ensemble des panneaux du domaine.
 *
 * Le script REMPLACE toutes les leçons existantes. Idempotent.
 *
 *   pnpm --filter @permis2.0/api run enrich:lessons
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const P = (code: string) => `/icons/panneaux/${code}.svg`;

interface Chapter {
  titre: string;
  categorie: string;
  contenu: string;
  points_cles: string[];
  regles: string[];
  erreurs_frequentes: string[];
  exceptions: string[];
  illustrations: string[];
}

const CHAPTERS: Chapter[] = [
  {
    titre: 'Priorité',
    categorie: 'Priorité aux intersections',
    contenu: `Qui passe en premier ? Toute la sécurité des carrefours tient dans cette question. Ce chapitre regroupe l'ensemble des règles et panneaux de priorité.

LA PRIORITÉ À DROITE — la règle de base
Sans signalisation (ni panneau, ni feu, ni agent), tu cèdes le passage à tout véhicule venant de ta DROITE. La largeur ou l'importance de la route ne donne aucun droit. Le panneau AB1a rappelle cette règle à l'approche d'une intersection ; AB5 (« route sans priorité ») t'annonce que tu devras l'appliquer tout au long de la route.

LE CÉDEZ-LE-PASSAGE — triangle pointe en bas (AB3)
Tu laisses passer les véhicules des DEUX sens de la route croisée. L'arrêt n'est obligatoire que si la circulation l'exige : voie libre, tu passes en restant prêt à freiner. La ligne discontinue M5 marque la limite d'attente ; le signal avancé AB3a annonce l'intersection à distance.

LE STOP — l'octogone rouge (AB4)
Arrêt COMPLET et obligatoire, roues immobiles, même si tout semble libre, même la nuit. On s'arrête à la ligne continue M4 (sinon à l'aplomb du panneau), on contrôle gauche-droite-gauche, on cède aux deux sens. Le « STOP roulé » est éliminatoire à l'examen.

LA ROUTE PRIORITAIRE — le losange jaune (AB1)
Tu es prioritaire à TOUTES les intersections jusqu'au losange barré (AB2) qui met fin au statut. AB2a donne une priorité ponctuelle : uniquement le prochain carrefour. Prioritaire ne veut pas dire invulnérable : charrettes et deux-roues surgissent sans toujours céder.

LE CARREFOUR GIRATOIRE (AB25 → C8)
Règle inversée : priorité aux véhicules DÉJÀ dans l'anneau. Tu cèdes à gauche en entrant, tu tournes en sens antihoraire, tu mets le clignotant droit avant de sortir.

LA HIÉRARCHIE À RETENIR
Agent > feux > panneaux > marquage > priorité à droite. En cas de contradiction, le niveau supérieur l'emporte toujours.`,
    points_cles: [
      'Sans signalisation : priorité à droite, toujours',
      'Cédez (AB3) : céder aux deux sens, arrêt si nécessaire / STOP (AB4) : arrêt total obligatoire',
      'Losange AB1 = prioritaire jusqu’à AB2 ; AB2a = un seul carrefour',
      "Giratoire : priorité à l'anneau, clignotant à la sortie",
      'Hiérarchie : agent > feux > panneaux > marquage > priorité à droite',
    ],
    regles: [
      'Ralentir et contrôler à chaque intersection, prioritaire ou non',
      "S'arrêter à la ligne (M4 pour STOP, M5 pour cédez)",
      'Sortie de propriété ou de piste : céder à tous les usagers',
    ],
    erreurs_frequentes: [
      'Croire que la grande route est prioritaire sans panneau',
      'Le STOP « roulé » sans immobilisation complète',
      'Forcer l’entrée d’un giratoire',
      'Oublier que la priorité du losange s’arrête au panneau AB2',
    ],
    exceptions: [
      'Véhicules d’intervention (pompiers, ambulance, police) : toujours les laisser passer',
      'Un agent de circulation prime sur tous les panneaux de priorité',
    ],
    illustrations: [
      P('AB1a'),
      P('AB3'),
      P('AB3a'),
      P('AB4'),
      P('AB1'),
      P('AB2'),
      P('AB2a'),
      P('AB5'),
      P('AB25'),
      P('C8'),
      P('M4'),
      P('M5'),
    ],
  },
  {
    titre: 'Panneaux de danger',
    categorie: 'Panneaux de danger',
    contenu: `Triangle blanc à bord rouge, pointe en haut : un DANGER t'attend à environ 150 m sur route (50 m en ville). Le pictogramme central te dit lequel. Le réflexe est toujours le même : ralentir, augmenter les distances, ne pas dépasser.

LES VIRAGES (A1, A1a, A1c, A1d)
Virage à droite, à gauche, ou succession de virages : adapte ta vitesse AVANT d'entrer dans la courbe, jamais dedans.

LA CHAUSSÉE (A3, A4, A4a, A5, A2b, A10, A19, A3a)
Rétrécissements (symétrique, par la droite, par la gauche), cassis et dos d'âne, ralentisseurs aménagés, chaussée glissante, chutes de pierres, forte descente : la route elle-même devient le danger. Par pluie d'hivernage ou sur latérite, double tes précautions.

LES USAGERS VULNÉRABLES (A12, A13, A21, A15c)
Passage piétons, zone scolaire, débouché de cyclistes, cavaliers et charrettes : des personnes peuvent surgir. Aux abords des écoles, vitesse minimale et vigilance maximale.

LES ANIMAUX (A14, A15a)
Sauvages ou domestiques (troupeaux fréquents sur les nationales) : ralentis, ne klaxonne pas, prêt à l'arrêt complet.

LES INTERSECTIONS ET INSTALLATIONS (A6, A7, A8, A9, A9a, A9b, A6b)
Débouché de route secondaire, giratoire, feux tricolores, passages à niveau avec ou sans barrières, tramway/TER, pont mobile : chaque annonce te laisse le temps de préparer la bonne manœuvre.

LES CONDITIONS PARTICULIÈRES (A18, A20, A23, A24, A15, A30)
Circulation à double sens après un sens unique, débouché sur un quai, danger aérien, vent latéral, travaux, et le « danger divers » (A30) précisé par panonceau.`,
    points_cles: [
      'Triangle rouge = danger à ~150 m (50 m en agglomération)',
      'Réflexe unique : ralentir + distances + zéro dépassement',
      'Le pictogramme identifie le danger précis',
      'A30 + panonceau = danger non catégorisé',
    ],
    regles: [
      'Adapter la vitesse AVANT le danger',
      'Redoubler de prudence de nuit, par pluie et sur latérite',
      'Ne jamais klaxonner près des animaux',
    ],
    erreurs_frequentes: [
      'Ignorer les triangles sur un trajet habituel',
      'Freiner SUR le dos d’âne au lieu d’avant',
      'Confondre triangle (danger) et rond (interdiction/obligation)',
    ],
    exceptions: ['En zone de travaux, la signalisation temporaire jaune prime'],
    illustrations: [
      P('A1'),
      P('A1c'),
      P('A3'),
      P('A2b'),
      P('A10'),
      P('A12'),
      P('A13'),
      P('A14'),
      P('A15a'),
      P('A7'),
      P('A8'),
      P('A9'),
      P('A18'),
      P('A24'),
      P('A30'),
    ],
  },
  {
    titre: 'Panneaux d’interdiction et restrictions',
    categorie: "Panneaux d'interdiction",
    contenu: `Rond blanc à bord rouge : INTERDIT. L'interdiction commence au panneau et dure jusqu'à la prochaine intersection ou jusqu'au panneau de levée (barré de noir).

LES ACCÈS (B1, B0, B2a, B9a, B19)
Sens interdit (B1) : y entrer, c'est rouler à contresens — l'infraction la plus dangereuse du code. Circulation interdite dans les deux sens (B0), véhicules à moteur interdits (B2a), accès interdit aux piétons (B9a), poids lourds interdits (B19).

LES MANŒUVRES (B2b, B17, B9, B10, B16)
Interdiction de tourner à droite (B2b), demi-tour interdit (B17), dépassement interdit (B9) jusqu'à sa levée (B10), klaxon interdit (B16) près des hôpitaux et écoles.

LES VITESSES (B11, B14, B14b, B14c, B15)
30, 50, 70, 90 km/h : le chiffre dans le rond rouge est un MAXIMUM local. B15 lève la limitation : on revient à la règle générale de la voie, jamais plus.

L'ARRÊT ET LE STATIONNEMENT (B6, B7)
B6 (une diagonale) : stationnement interdit, arrêt bref toléré avec conducteur au volant. B7 (deux diagonales en croix) : NI arrêt NI stationnement, pas même « une minute ».

LES RESTRICTIONS DE GABARIT (B5, B4, B3)
Hauteur (B5 — ponts, portiques), largeur (B4 — passages étroits), poids total en charge (B3 — ouvrages fragiles). On compare avec la carte grise ET le chargement réel (bagages de toit compris) AVANT de partir. Dans le doute, on considère qu'on dépasse.`,
    points_cles: [
      'Rond rouge = interdiction immédiate, jusqu’à l’intersection ou la levée',
      'B1 sens interdit = risque de collision frontale',
      'B6 : arrêt bref toléré / B7 : aucune immobilisation',
      'Restrictions chiffrées : vérifier carte grise + chargement',
      'Une levée (B10, B15) ramène à la règle générale, pas à la liberté',
    ],
    regles: [
      'Respecter dès le panneau, sans distance de tolérance',
      'Chercher un itinéraire alternatif plutôt que « tenter »',
      'Préparer son itinéraire selon son gabarit',
    ],
    erreurs_frequentes: [
      'Remonter un sens interdit « sur 50 mètres »',
      'Stationner sous un B7',
      'Oublier les bagages de toit dans la hauteur',
      'Croire que fin de limitation = vitesse libre',
    ],
    exceptions: [
      'Panonceaux : l’interdiction peut viser certains véhicules ou horaires seulement',
      'Véhicules d’intervention en mission',
    ],
    illustrations: [
      P('B1'),
      P('B0'),
      P('B2a'),
      P('B2b'),
      P('B9'),
      P('B10'),
      P('B16'),
      P('B17'),
      P('B19'),
      P('B11'),
      P('B14'),
      P('B15'),
      P('B6'),
      P('B7'),
      P('B5'),
      P('B4'),
      P('B3'),
    ],
  },
  {
    titre: 'Panneaux d’obligation et d’indication',
    categorie: 'Signalisation de voie',
    contenu: `Le BLEU domine ce chapitre — mais la forme change tout : ROND bleu = obligation (tu DOIS), CARRÉ bleu = indication (tu PEUX / tu SAIS).

LES OBLIGATIONS DE DIRECTION (C1 à C7)
Tout droit obligatoire (C1), droite (C2), gauche (C3), les combinaisons (C4, C5) et le contournement d'îlot par la droite (C6) ou la gauche (C7). Se placer tôt dans la bonne voie, clignoter même quand la direction est imposée. Contourner un îlot du mauvais côté te met face au trafic.

LES AUTRES OBLIGATIONS (C8, C9, C10, C18)
Sens giratoire (C8), piste cyclable obligatoire pour les cycles (C9), chemin piétons (C10), vitesse MINIMALE (C18) sur les voies rapides.

LES INDICATIONS (D2, D3, D5, D7, D9, D11, D12)
Parking (D2), dépassement autorisé (D3), site touristique (D5), centre de soins (D7), station-service (D9), restaurant (D11), hôtel (D12) : des services et facilités, aucun ordre.

LA DIRECTION (D1, D6, E1, E2, E11, E13, E20)
Flèches de jalonnement (D1), cartouches de route numérotée N1/N7 (D6), route nationale (E1), voie express (E2 — 110 km/h maxi), centre-ville (E11), sens unique (E13), déviation (E20). Ces panneaux permettent de préparer l'itinéraire et de se localiser — précieux pour guider les secours.`,
    points_cles: [
      'ROND bleu = obligation / CARRÉ bleu = indication',
      'Flèches C1-C7 : seules directions autorisées, îlots à contourner du bon côté',
      'C18 = vitesse minimale ; E13 = sens unique',
      'D6/E1 : se repérer par les numéros de route (N1, N7…)',
    ],
    regles: [
      'Se positionner tôt dans la voie de la direction obligatoire',
      'Clignoter même pour une direction imposée',
      'Respecter les voies réservées (cycles, piétons)',
    ],
    erreurs_frequentes: [
      'Confondre rond (obligation) et carré (indication)',
      'Contourner un îlot par la gauche quand C6 impose la droite',
      'Prendre un sens unique (E13) à contresens par l’autre bout',
    ],
    exceptions: ["Fin d'obligation : même panneau barré de rouge"],
    illustrations: [
      P('C1'),
      P('C2'),
      P('C4'),
      P('C6'),
      P('C8'),
      P('C9'),
      P('C10'),
      P('C18'),
      P('D2'),
      P('D7'),
      P('D9'),
      P('D1'),
      P('D6'),
      P('E2'),
      P('E13'),
      P('E20'),
    ],
  },
  {
    titre: 'Marquage au sol',
    categorie: 'Signalisation de voie',
    contenu: `Le marquage est une signalisation à part entière, aussi contraignante que les panneaux. Blanc = permanent ; JAUNE = temporaire (et il PRIME sur le blanc pendant les travaux).

LES LIGNES LONGITUDINALES (M1, M2)
Ligne continue (M1) : un mur peint — ni franchir, ni chevaucher, même pour éviter un nid-de-poule. Ligne discontinue (M2) : dépassement autorisé si les conditions sont réunies. Ligne mixte : c'est la ligne de TON côté qui compte — discontinue de ton côté, tu peux ; continue, tu ne peux pas.

LES LIGNES TRANSVERSALES (M4, M5, M3)
Ligne continue épaisse (M4) : arrêt du STOP. Ligne pointillée large (M5) : cédez-le-passage. Passage piétons « zébra » (M3) : arrêt dès qu'un piéton est engagé ou manifeste l'intention de traverser — et interdiction absolue de s'y garer.

LES FLÈCHES ET ZONES
Flèches directionnelles : une fois dans une voie fléchée, la direction peinte devient OBLIGATOIRE. Flèches de rabattement : ta voie se termine, insère-toi. Zébras hachurés (îlots peints) : zones neutralisées — on ne roule pas dessus, on ne s'y arrête pas.

LES VOIES RÉSERVÉES (M6)
« BUS » peint au sol : voie interdite aux voitures, même dans les embouteillages. Les couloirs du BRT à Dakar en sont l'exemple type.`,
    points_cles: [
      'M1 continue : ni franchir ni chevaucher / M2 discontinue : dépassement possible',
      'Ligne mixte : seule TA ligne compte',
      'M4 = STOP, M5 = cédez, M3 = piétons prioritaires',
      'Voie fléchée = direction obligatoire ; zébras hachurés = zone interdite',
      'Marquage jaune temporaire > marquage blanc',
    ],
    regles: [
      'Choisir sa voie AVANT les flèches directionnelles',
      "S'arrêter en amont du zébra dès qu'un piéton s'engage",
      'Respecter les voies bus en toute circonstance',
    ],
    erreurs_frequentes: [
      'Chevaucher « un peu » la continue en virage',
      'Changer de direction au dernier moment malgré la flèche',
      'Stationner sur le passage piétons',
    ],
    exceptions: ['Franchissement de ligne continue uniquement sur ordre d’un agent'],
    illustrations: [P('M1'), P('M2'), P('M3'), P('M4'), P('M5'), P('M6')],
  },
  {
    titre: 'Feux tricolores et agents',
    categorie: 'Feux tricolores',
    contenu: `Le carrefour urbain est réglé par les feux — et, au-dessus d'eux, par l'agent.

LES TROIS COULEURS (FEU1)
ROUGE : arrêt total avant la ligne d'effet, sans empiéter sur le passage piétons. ORANGE fixe : arrêt obligatoire, SAUF si tu es trop engagé pour freiner sans danger — ce n'est jamais une invitation à accélérer. VERT : passage autorisé APRÈS un contrôle visuel du carrefour (retardataires, piétons).

LES FEUX PARTICULIERS (FEU2, FEU3, FEU4)
Flèche verte (FEU2) : uniquement la direction fléchée, même au rouge général, en cédant aux piétons. Feu piétons (FEU3) : il organise les traversées — un piéton engagé reste prioritaire. Jaune clignotant (FEU4) : le carrefour n'est plus régulé, la priorité à droite reprend ses droits.

FEUX EN PANNE
Coupure de courant, feux éteints : le carrefour redevient une intersection ordinaire — priorité à droite, prudence maximale. Le panneau A8 annonce des feux à l'approche.

LES AGENTS DE CIRCULATION (AG1, AG2)
Leurs gestes priment sur TOUT : feux, panneaux, marquage. De face ou de dos = arrêt ; de profil = passage ; bras levé vertical = attention, arrêt général. Le signal d'arrêt individuel (AG2 — bras ou panneau vers TON véhicule) t'ordonne de te ranger à droite immédiatement : obtempère calmement, documents prêts. La nuit, mêmes codes au bâton lumineux.`,
    points_cles: [
      'Rouge = arrêt / Orange = arrêt sauf impossibilité / Vert = passer après contrôle',
      'Flèche verte : direction fléchée seulement, piétons prioritaires',
      'Jaune clignotant ou feux en panne = priorité à droite',
      "L'agent prime sur feux, panneaux et marquage",
      'De face ou de dos = arrêt ; de profil = passage',
    ],
    regles: [
      "S'arrêter à la ligne d'effet des feux",
      'Contrôler le carrefour même au vert',
      "Se ranger à droite immédiatement sur signe de l'agent",
    ],
    erreurs_frequentes: [
      "Accélérer à l'orange",
      'Bloquer le passage piétons en attendant le vert',
      "Suivre le feu vert alors que l'agent ordonne l'arrêt",
    ],
    exceptions: ['Véhicules prioritaires en intervention : céder même au vert'],
    illustrations: [P('FEU1'), P('FEU2'), P('FEU3'), P('FEU4'), P('A8'), P('AG1'), P('AG2')],
  },
  {
    titre: 'Vitesse et distances de sécurité',
    categorie: 'Limitation de vitesse',
    contenu: `LES LIMITES AU SÉNÉGAL
50 km/h en agglomération (dès le panneau d'entrée de localité), 90 km/h hors agglomération, 110 km/h sur autoroute et voie express (E2). Les panneaux B11 (30), B14 (50), B14b (70), B14c (90) abaissent localement ; B15 lève la limitation — retour à la règle générale, jamais au-delà.

LA VITESSE ADAPTÉE
La limite est un MAXIMUM par conditions idéales, pas un objectif. Pluie d'hivernage, poussière d'harmattan, nuit sans éclairage, marché en bord de route, sortie d'école : chaque situation impose de descendre EN DESSOUS. Règle d'or : pouvoir s'arrêter sur la distance que tu VOIS.

LA DISTANCE D'ARRÊT
Distance d'arrêt = temps de réaction (≈1 seconde, le double si fatigué) + distance de freinage (elle QUADRUPLE quand la vitesse double). Ordres de grandeur sur sec : ~25-30 m à 50 km/h, ~70-80 m à 90, plus de 100 m à 110. Sur chaussée mouillée : DOUBLE. Les premières pluies après la saison sèche sont les plus traîtres.

LA RÈGLE DES DEUX SECONDES
Choisis un repère fixe (poteau, ombre de pont) : si tu l'atteins moins de 2 secondes après le véhicule qui te précède, tu es trop près. Par pluie ou derrière un camion : 4 secondes. Le talonnage est la cause n°1 des carambolages — il supprime à la fois ta distance de réaction et ta visibilité.`,
    points_cles: [
      '50 ville / 90 route / 110 voie express',
      'La limite est un maximum, la bonne vitesse dépend des conditions',
      'Distance d’arrêt = réaction + freinage ; mouillé = distances doublées',
      'Règle des 2 secondes (4 par pluie ou derrière un camion)',
    ],
    regles: [
      "Pouvoir s'arrêter sur la distance visible",
      'Recréer la distance quand un véhicule s’intercale',
      'Zones 30 (écoles) : respect strict',
    ],
    erreurs_frequentes: [
      'Garder 90 dans une traversée de village',
      'Coller le véhicule de devant pour « pousser »',
      'Sous-estimer la première pluie de l’hivernage',
    ],
    exceptions: [
      'Arrêtés locaux abaissant les limites (signalés)',
      'En forte descente (A3a) : frein moteur et distances augmentées',
    ],
    illustrations: [
      P('B11'),
      P('B14'),
      P('B14b'),
      P('B14c'),
      P('B15'),
      P('E2'),
      P('A10'),
      P('A3a'),
    ],
  },
  {
    titre: 'Dépassement et croisement',
    categorie: 'Dépassement',
    contenu: `On roule à droite, on dépasse par la GAUCHE. Le dépassement raté est la première cause de choc frontal sur les nationales.

LES 4 CONDITIONS AVANT DE DÉPASSER
1) Visibilité totale sur la voie d'en face ; 2) espace suffisant pour tout le dépassement ; 3) aucune interdiction (B9, ligne continue M1) ; 4) retour possible sans gêner. Un seul doute = on renonce.

LA MANŒUVRE COMPLÈTE
Rétroviseurs + ANGLE MORT, clignotant gauche, déboîtement franc, dépassement rapide mais légal, retour quand le dépassé apparaît ENTIER dans le rétroviseur intérieur, clignotant droit. Large marge pour les deux-roues et charrettes : ils peuvent dévier d'un mètre sans prévenir.

LES INTERDICTIONS
Panneau B9 (levé par B10), ligne continue M1 (la discontinue M2 autorise), sommet de côte, virage aveugle, intersections, passages à niveau et piétons, et quand on est soi-même dépassé. Le panneau A18 (double sens) rappelle que la voie d'en face est occupée.

ÊTRE DÉPASSÉ ET CROISER
Si on te dépasse : MAINTIENS ta vitesse (accélérer est une faute grave) et serre à droite. En croisement difficile (rétrécissement, véhicule arrêté de ton côté) : celui qui a l'obstacle de son côté cède le passage ; de nuit, repasse en codes dès qu'un véhicule arrive en face.`,
    points_cles: [
      'Dépassement par la gauche uniquement, 4 conditions réunies',
      'Retour quand le dépassé est entier dans le rétro intérieur',
      'M1/B9 = interdit ; M2/B10 = de nouveau possible',
      'Être dépassé : maintenir sa vitesse et serrer à droite',
    ],
    regles: [
      "Contrôler l'angle mort avant de déboîter",
      'Clignotant au déboîtement ET au rabattement',
      'Marge large pour deux-roues et charrettes',
    ],
    erreurs_frequentes: [
      'Dépasser en côte ou en virage aveugle',
      'Se rabattre trop tôt',
      'Accélérer quand on est dépassé',
      'Coller avant de déboîter : zéro visibilité',
    ],
    exceptions: ["Dépassement par la droite : uniquement d'un véhicule tournant à gauche signalé"],
    illustrations: [P('B9'), P('B10'), P('M1'), P('M2'), P('A18'), P('A3')],
  },
  {
    titre: 'Arrêt et stationnement',
    categorie: 'Stationnement & Arrêt',
    contenu: `ARRÊT : immobilisation brève, conducteur au volant ou à côté, prêt à repartir. STATIONNEMENT : tout le reste. Cette distinction commande les panneaux.

LES PANNEAUX (B6, B7, D2)
B6 (une diagonale rouge) : STATIONNEMENT interdit — l'arrêt bref reste toléré. B7 (croix) : NI arrêt NI stationnement, aucune immobilisation même d'une minute. D2 : parking autorisé et aménagé (vérifier horaires et paiement sur panonceau).

INTERDIT MÊME SANS PANNEAU
Partout où l'on gêne ou masque : passages piétons (M3), intersections, virages, sommets de côte, trottoirs, double file, devant les entrées carrossables, les bouches d'incendie, les arrêts de bus. « Deux minutes » en double file devant la boutique = infraction ET bouchon.

BIEN SE GARER
Frein à main systématique, moteur coupé ; en pente, roues braquées vers le trottoir ; vérifier le panneau ET le marquage (bordure jaune = interdiction). Avant d'ouvrir la portière : contrôle rétro + « poignée hollandaise » (ouvrir de la main opposée pour tourner le buste et voir les motos) — l'accident de portière est un classique de Dakar.

EN CAS DE PANNE
Feux de détresse, gilet AVANT de sortir, triangle à ~30 m (100 m et plus sur voie rapide), véhicule dégagé au maximum de la chaussée.`,
    points_cles: [
      'Arrêt = bref, au volant / Stationnement = le reste',
      'B6 : arrêt toléré / B7 : rien du tout / D2 : parking',
      'Jamais d’immobilisation gênante, même sans panneau',
      'Portière : ouvrir de la main opposée (motos !)',
    ],
    regles: [
      'Frein à main systématique ; roues vers le trottoir en pente',
      'Vérifier panneau + marquage + panonceaux avant de se garer',
      'Panne : détresse, gilet, triangle, dégager la chaussée',
    ],
    erreurs_frequentes: [
      'La double file « deux minutes »',
      'Stationner sur zébras, trottoirs ou devant un portail',
      'Ouvrir la portière sans regarder',
    ],
    exceptions: ['Panonceaux de réservation (taxis, livraisons, riverains) et d’horaires'],
    illustrations: [P('B6'), P('B7'), P('D2'), P('M3')],
  },
  {
    titre: 'Chantiers et passages à niveau',
    categorie: 'Signalisation temporaire',
    contenu: `Deux zones à risque maximal où la signalisation change de nature : les chantiers (signalisation JAUNE temporaire) et les passages à niveau (le train ne peut PAS s'arrêter).

LES CHANTIERS (KD1, KC1, K5, AK1, A15, E20)
Le fond jaune signale le temporaire — et il PRIME sur la signalisation permanente. Dispositif type : annonce travaux (A15/KD1), limitation temporaire, cônes (KC1) qui dessinent le couloir, balises lumineuses la nuit (K5), fanion rouge (AK1) au plus près des ouvriers, déviation éventuelle (E20). Dans la zone : vitesse réduite, distances doublées, zéro dépassement, obéissance aux signaleurs comme à des agents. On ne réaccélère qu'après le DERNIER cône.

LES PASSAGES À NIVEAU (A9, A9a, A9b)
Avec barrières (A9) ou sans (A9a, complété par la croix de Saint-André), et traversées de tramway/TER (A9b) : c'est TOUJOURS la route qui cède au rail. Ralentir, écouter, et ne s'engager QUE si la sortie est totalement dégagée — jamais d'arrêt sur les voies dans un bouchon. Feu rouge clignotant ou sonnerie = arrêt absolu, même barrières levées ; ne JAMAIS contourner une demi-barrière.

EN CAS D'IMMOBILISATION SUR LA VOIE
Calage ou panne sur les rails : évacuer d'abord TOUS les occupants loin des voies, ensuite seulement tenter de dégager le véhicule ou alerter.`,
    points_cles: [
      'Jaune temporaire PRIME sur permanent',
      'Chantier : vitesse réduite, distances doublées, zéro dépassement',
      'Le train est toujours prioritaire et ne peut pas s’arrêter',
      "Ne s'engager sur un passage à niveau que sortie dégagée",
    ],
    regles: [
      'Obéir aux signaleurs de chantier comme aux agents',
      'Arrêt absolu au feu clignotant, barrière levée ou non',
      'Panne sur la voie : évacuer les personnes d’abord',
    ],
    erreurs_frequentes: [
      'Suivre le marquage blanc contredit par le chantier',
      'Contourner une demi-barrière',
      'Rester bloqué sur les rails dans un bouchon',
    ],
    exceptions: ['Un agent SNCF/gendarme peut réguler manuellement le passage'],
    illustrations: [
      P('KD1'),
      P('KC1'),
      P('K5'),
      P('AK1'),
      P('A15'),
      P('E20'),
      P('A9'),
      P('A9a'),
      P('A9b'),
    ],
  },
  {
    titre: 'Conduite responsable',
    categorie: 'Comportement du conducteur',
    contenu: `Le véhicule le plus sûr du monde ne protège pas d'un conducteur défaillant. Ce chapitre regroupe l'équipement et les comportements qui sauvent.

LA CEINTURE
Obligatoire pour TOUS, à toutes les places, dès le premier mètre. Sangle sur la clavicule et le bassin, jamais sous le bras. À 50 km/h, un choc non attaché = chute du 3e étage. Enfants : dispositif adapté à l'arrière, JAMAIS sur les genoux (au choc, l'enfant devient projectile). Le conducteur répond des mineurs non attachés.

L'ÉCLAIRAGE
Codes = éclairage normal de nuit et par visibilité réduite (pluie, harmattan). Phares = hors agglomération, route vide — retour aux codes dès qu'un véhicule apparaît (l'éblouissement aveugle 3-5 secondes). Antibrouillard arrière : brouillard dense uniquement. De nuit, la vitesse doit permettre de s'arrêter dans la portée des codes (~30 m) : gare aux charrettes et piétons non éclairés.

L'ALCOOL
Champ visuel rétréci, réflexes allongés, audace augmentée : le cocktail de l'accident. Aucune astuce ne dégrise (ni café, ni repas). La seule règle sûre : celui qui conduit ne boit pas.

LA FATIGUE
Un micro-sommeil de 3 secondes à 90 km/h = 75 m à l'aveugle. Signes : paupières lourdes, lignes franchies. Remède unique : PAUSE de 15-20 min toutes les 2 h. Longs trajets (Dakar–Tamba, Dakar–Ziguinchor) : partir reposé, éviter 2 h-5 h du matin.

LE TÉLÉPHONE
Tenu en main : interdit, risque ×3. Lire un message = 5 secondes sans regarder = 125 m à 90 km/h. Mode silencieux, consultation à l'arrêt.`,
    points_cles: [
      'Ceinture pour tous, enfants en dispositif adapté à l’arrière',
      'Codes la nuit ; phares seulement route vide ; vitesse = portée des feux',
      'Celui qui conduit ne boit pas — rien ne dégrise',
      'Pause toutes les 2 h ; téléphone en silencieux',
    ],
    regles: [
      'Boucler tout le monde AVANT de démarrer',
      'Repasser en codes dès un véhicule en face',
      'Désigner un conducteur sobre avant la fête',
    ],
    erreurs_frequentes: [
      '« Pas besoin, je vais juste au marché »',
      'Rester plein phares face aux autres',
      'Lutter contre le sommeil avec la musique ou la vitre ouverte',
      '« Juste un message rapide »',
    ],
    exceptions: ["Appel d'urgence (17/18) : s'arrêter dans un lieu sûr pour le passer"],
    illustrations: [P('A13'), P('A14'), P('B16'), P('A24'), P('A30')],
  },
  {
    titre: 'Accidents et premiers secours',
    categorie: 'Premiers secours & Accidents',
    contenu: `Face à un accident, trois mots dans un ordre STRICT : PROTÉGER, ALERTER, SECOURIR. Un sauveteur fauché fait deux victimes.

PROTÉGER
Se garer APRÈS l'accident, feux de détresse, gilet réfléchissant avant de sortir, triangle à ~30 m en amont (100 m et plus sur voie rapide), couper le contact des véhicules accidentés, interdire de fumer, écarter les curieux, baliser dans les deux sens si besoin.

ALERTER
Sapeurs-Pompiers : 18 ou 1515. Police : 17. Gendarmerie : 800 00 20 20. Annoncer : lieu précis (les bornes kilométriques J4 servent à se localiser), nombre de victimes, état apparent, dangers particuliers (feu, carburant). Ne JAMAIS raccrocher le premier.

SECOURIR SANS AGGRAVER
Parler aux victimes, les couvrir, comprimer une hémorragie visible avec un linge propre. NE PAS déplacer un blessé, NE PAS retirer le casque d'un motard (risque de lésion de la moelle), NE PAS donner à boire. Seule exception au déplacement : danger vital immédiat (incendie, submersion).

APRÈS L'ACCIDENT
Rester sur place jusqu'aux secours (partir = délit de fuite). Constat : remplir calmement, photographier les positions, ne signer que ce qu'on a compris. Le panneau D7 (centre de soins) aide à localiser l'hôpital le plus proche.`,
    points_cles: [
      'Protéger → Alerter → Secourir, dans cet ordre',
      'Pompiers 18/1515 · Police 17 · Gendarmerie 800 00 20 20',
      'Ne pas déplacer un blessé, ne pas ôter un casque, ne pas donner à boire',
      'Se localiser grâce aux bornes kilométriques (J4)',
    ],
    regles: [
      'Gilet AVANT de sortir, triangle à distance utile',
      'Comprimer une hémorragie, couvrir, parler',
      'Rester jusqu’à l’arrivée des secours',
    ],
    erreurs_frequentes: [
      "S'arrêter en face de l'accident et créer un suraccident",
      'Déplacer un blessé « pour l’installer mieux »',
      'Retirer le casque d’un motard',
    ],
    exceptions: ['Déplacement d’urgence uniquement si danger immédiat (feu, submersion)'],
    illustrations: [P('J4'), P('D7'), P('A30'), P('KC1')],
  },
  {
    titre: 'Position sur la chaussée et voies rapides',
    categorie: 'Circulation routière',
    contenu: `Où placer son véhicule ? La bonne position évite la moitié des conflits avant même qu'ils naissent.

LA RÈGLE DE BASE : TENIR SA DROITE
On circule le plus près possible du bord droit de la chaussée, sans serrer dangereusement (piétons, portières, sable accumulé). La voie de gauche sert à dépasser et à tourner à gauche — pas à « rouler tranquille ».

LE CHOIX DE LA VOIE
Sur chaussée à plusieurs voies dans le même sens : la voie la plus à droite par défaut, les autres pour dépasser. En approche de carrefour, on se place TÔT dans la voie correspondant à sa direction (les flèches au sol engagent). Changer de voie = rétroviseur, angle mort, clignotant, puis déplacement progressif.

LE SENS UNIQUE (E13)
Toute la largeur est dans le même sens : on peut se placer à gauche pour tourner à gauche. Attention aux entrées à contresens — vérifier le panneau B1 de l'autre bout.

LA VOIE EXPRESS ET L'AUTOROUTE (E2)
Accès interdit aux piétons (B9a), cycles, charrettes et véhicules lents. INSERTION : la voie d'accélération sert à atteindre la vitesse du flux — on s'insère au clignotant dans un créneau, sans s'arrêter en bout de voie sauf impossibilité absolue. On n'y fait JAMAIS demi-tour ni marche arrière ; une sortie ratée = on continue jusqu'à la suivante. En cas de panne : bande d'arrêt d'urgence, détresse, gilet, tous les occupants derrière la glissière.

LES INTERDITS ABSOLUS
Rouler sur la bande d'arrêt d'urgence pour doubler un bouchon, circuler sur les zébras hachurés, remonter une file par la droite.`,
    points_cles: [
      'Tenir sa droite ; la gauche sert à dépasser',
      'Se placer tôt dans la voie de sa direction',
      'Voie express : insertion lancée, jamais de demi-tour ni marche arrière',
      'Sortie ratée = continuer jusqu’à la suivante',
    ],
    regles: [
      'Rétro + angle mort + clignotant à chaque changement de voie',
      "S'insérer à la vitesse du flux",
      'Panne sur voie rapide : occupants derrière la glissière',
    ],
    erreurs_frequentes: [
      'Rouler durablement sur la voie de gauche',
      "S'arrêter en bout de voie d'accélération",
      'Reculer sur une bretelle après une sortie ratée',
    ],
    exceptions: [
      'Véhicules d’intervention et d’exploitation autorisés sur la bande d’arrêt d’urgence',
    ],
    illustrations: [P('E2'), P('E13'), P('B1'), P('B9a'), P('C18'), P('M2')],
  },
  {
    titre: 'Changer de direction et manœuvrer',
    categorie: 'Manœuvres',
    contenu: `Tourner, reculer, faire demi-tour : les manœuvres concentrent une grande partie des accrochages — et des questions d'examen.

TOURNER À DROITE
Clignotant tôt, serrer progressivement le bord droit, vitesse réduite, céder aux piétons qui traversent la rue où tu t'engages, surveiller les deux-roues qui remontent par la droite (angle mort !).

TOURNER À GAUCHE
Clignotant, se placer près de l'axe médian (ou sur la voie de gauche d'un sens unique), céder au trafic venant EN FACE, puis tourner en laissant le centre du carrefour à sa gauche. Aux carrefours équipés, les flèches au sol et le panneau C3 guident le mouvement.

LE DEMI-TOUR
Interdit partout où il surprend : B17, voies rapides, sens uniques, lignes continues, sommets de côte, intersections chargées. Ailleurs : uniquement avec une visibilité totale dans les deux sens, en une seule manœuvre fluide si possible.

LA MARCHE ARRIÈRE
Manœuvre d'exception : courte, lente, justifiée (créneau, garage). Contrôle direct par-dessus l'épaule ET rétroviseurs ; enfants et piétons sont invisibles bas derrière le véhicule. Interdite sur voies rapides et aux intersections.

LE STATIONNEMENT EN CRÉNEAU / ÉPI / BATAILLE
Signaler la manœuvre, laisser passer, reculer lentement. À l'examen pratique, la manœuvre se juge autant à la SÉCURITÉ (contrôles) qu'à la précision.

RÈGLE D'OR
Celui qui manœuvre CÈDE à tous les autres : une manœuvre ne donne jamais la priorité.`,
    points_cles: [
      'À droite : serrer à droite ; à gauche : près de l’axe, céder au trafic d’en face',
      'Piétons prioritaires dans la rue où tu t’engages',
      'Celui qui manœuvre cède à tout le monde',
      'Marche arrière : courte, lente, contrôle direct',
    ],
    regles: [
      'Clignotant AVANT chaque manœuvre',
      'Angle mort deux-roues avant de tourner à droite',
      'Demi-tour uniquement avec visibilité totale et sans interdiction',
    ],
    erreurs_frequentes: [
      'Couper le virage en tournant à gauche',
      'Tourner à droite sans contrôler les motos qui remontent',
      'Demi-tour en trois temps au milieu d’un axe passant',
    ],
    exceptions: ['Un agent peut ordonner un demi-tour (déviation) même sous panneau B17'],
    illustrations: [P('C2'), P('C3'), P('C4'), P('B17'), P('B2b'), P('E13')],
  },
  {
    titre: 'Partage de la route : usagers vulnérables',
    categorie: 'Usagers vulnérables',
    contenu: `Piétons, enfants, cyclistes, motos-Jakarta, charrettes : au Sénégal, la route se partage avec des usagers qui n'ont ni carrosserie ni ceinture. En cas de choc, c'est TOUJOURS eux qui perdent — la loi et la morale exigent du conducteur une prudence renforcée.

LES PIÉTONS (A12, M3)
Arrêt dès qu'un piéton est ENGAGÉ sur un passage ou manifeste clairement l'intention de traverser. Aux abords des marchés, gares routières et mosquées à la sortie de la prière, des flux entiers traversent : vitesse au pas. Un piéton qui traverse hors passage reste un être humain : on freine d'abord, on discute après.

LES ENFANTS (A13)
Imprévisibles par nature : un ballon qui roule = un enfant qui suit. Zone scolaire : vitesse minimale, pied prêt au frein, doublement de vigilance aux heures d'entrée et de sortie des classes.

LES DEUX-ROUES (A21, C9)
Motos-Jakarta et vélos se glissent partout : angle mort AVANT chaque changement de direction, marge d'un mètre minimum au dépassement, contrôle avant d'ouvrir une portière. La piste cyclable (C9) leur est réservée — ne pas y rouler ni s'y garer.

LES CHARRETTES ET CAVALIERS (A15c, A15a)
Lents, larges, parfois sans éclairage la nuit : les dépasser largement, sans klaxonner (risque d'emballement de l'animal).

LES TRANSPORTS EN COMMUN
Un car rapide ou un bus à l'arrêt = des piétons qui surgissent devant et derrière. On ralentit et on s'écarte. Voies réservées bus (M6) : interdites.`,
    points_cles: [
      'Piéton engagé ou intentionné = arrêt',
      'Un mètre minimum pour dépasser un deux-roues',
      'Zone scolaire : vitesse minimale, vigilance maximale',
      'Ne jamais klaxonner près des animaux attelés',
    ],
    regles: [
      'Angle mort avant chaque changement de direction',
      'Vitesse au pas aux abords des marchés et gares routières',
      'Bus à l’arrêt : ralentir, prévoir les traversées masquées',
    ],
    erreurs_frequentes: [
      'Forcer le passage au milieu des piétons',
      'Frôler les motos-Jakarta au dépassement',
      'Se garer sur la piste cyclable ou le passage piétons',
    ],
    exceptions: ['Aucune : la protection des vulnérables ne connaît pas d’exception'],
    illustrations: [
      P('A12'),
      P('A13'),
      P('A21'),
      P('A15c'),
      P('A15a'),
      P('C9'),
      P('C10'),
      P('M3'),
      P('M6'),
    ],
  },
  {
    titre: 'Conduire dans des conditions difficiles',
    categorie: 'Comportement du conducteur',
    contenu: `La route change avec le ciel et l'heure. Adapter sa conduite aux conditions, c'est déjà la moitié du code.

LA NUIT
Moins de visibilité, plus d'usagers non éclairés (charrettes, piétons, camions aux feux morts). Codes allumés, vitesse limitée à la portée des feux (~30 m), regard au bord droit quand un véhicule éblouit. Éviter de partir entre 2 h et 5 h : c'est le creux de vigilance humain.

LA PLUIE ET L'HIVERNAGE (A10)
Les PREMIÈRES pluies sont les plus dangereuses : elles remontent graisse et poussière accumulées en saison sèche. Distances doublées, vitesse réduite, codes allumés, essuie-glaces en état. Aquaplanage (l'eau soulève les pneus) : ni freiner fort ni braquer — lever le pied et tenir le cap. Ne JAMAIS franchir un radier ou une route submergée dont on ne voit pas le fond.

LA POUSSIÈRE ET L'HARMATTAN
Visibilité parfois réduite à quelques dizaines de mètres : codes (pas les phares, qui éblouissent dans la poussière comme dans le brouillard), antibrouillards si équipé, distances rallongées. Derrière un camion qui soulève un nuage : rester loin, ne pas dépasser à l'aveugle.

LE VENT LATÉRAL (A24) ET LE SABLE (A20)
Rafales à la sortie des zones abritées : tenir fermement le volant, attention aux véhicules hauts et aux deux-roues déportés. Sable sur la chaussée : comme du verglas — ralentir avant, pas dessus.

LA CHALEUR
Pression des pneus à vérifier À FROID (elle monte avec la température), eau à bord pour les longs trajets, surveiller la température moteur dans les bouchons.`,
    points_cles: [
      'Nuit : vitesse = portée des feux, gare aux usagers non éclairés',
      'Premières pluies = chaussée savonneuse ; distances doublées',
      'Aquaplanage : lever le pied, ne pas braquer',
      'Poussière : codes, jamais pleins phares',
    ],
    regles: [
      'Ne jamais traverser une route submergée à fond invisible',
      'Vérifier pneus et essuie-glaces avant l’hivernage',
      'Rallonger les distances dans TOUTE condition dégradée',
    ],
    erreurs_frequentes: [
      'Garder sa vitesse sous la première pluie',
      'Dépasser dans le nuage de poussière d’un camion',
      'Freiner brutalement sur le sable',
    ],
    exceptions: ['Convois et véhicules d’intervention peuvent imposer des consignes spécifiques'],
    illustrations: [P('A10'), P('A24'), P('A20'), P('A23'), P('A3a')],
  },
  {
    titre: 'Le véhicule : équipements et entretien',
    categorie: 'Véhicule et équipements',
    contenu: `Un véhicule mal entretenu est une infraction qui roule — et un accident qui attend. Le conducteur est responsable de l'état de son véhicule.

LES ORGANES DE SÉCURITÉ
PNEUS : gonflage à froid, usure régulière, témoins visibles = à remplacer ; un pneu lisse double la distance de freinage sur mouillé. FREINS : pédale spongieuse, voyant allumé ou tirage d'un côté = contrôle immédiat. DIRECTION et SUSPENSIONS : jeu ou flottement = danger. ÉCLAIRAGE : tous les feux fonctionnels — un phare mort te fait prendre pour une moto la nuit.

LES ÉQUIPEMENTS OBLIGATOIRES À BORD
Gilet rétro-réfléchissant (accessible depuis l'habitacle, pas dans le coffre), triangle de présignalisation, roue de secours en état avec cric et manivelle. Recommandés : extincteur, trousse de secours, lampe.

LES CONTRÔLES RÉGULIERS
Chaque semaine : niveaux (huile, liquide de refroidissement, lave-glace), pression des pneus, éclairage. Avant un long trajet (Dakar–Tamba…) : le tout, plus la roue de secours. La VISITE TECHNIQUE périodique est obligatoire : elle vérifie freins, direction, pollution, éclairage — rouler sans visite valide = amende et immobilisation possible.

LA SURCHARGE
Passagers et bagages au-delà du PTAC : freinage allongé, tenue de route dégradée, pneus en surchauffe — cause classique d'éclatement sur les nationales. Les bagages de toit changent aussi la hauteur (B5 !) et le centre de gravité.`,
    points_cles: [
      'Pneus, freins, direction, éclairage : les 4 organes vitaux',
      'Gilet accessible + triangle + roue de secours en état',
      'Visite technique valide obligatoire',
      'La surcharge dégrade freinage et tenue de route',
    ],
    regles: [
      'Pression des pneus à froid, chaque semaine',
      'Contrôle complet avant chaque long trajet',
      'Voyant rouge allumé = arrêt et vérification',
    ],
    erreurs_frequentes: [
      'Rouler avec des pneus lisses « encore un mois »',
      'Gilet enfoui dans le coffre sous les bagages',
      'Surcharger le véhicule pour un voyage de fête',
    ],
    exceptions: [
      'Transports spécifiques (marchandises, personnes) : équipements supplémentaires réglementés',
    ],
    illustrations: [P('D9'), P('B5'), P('B3'), P('A30')],
  },
  {
    titre: 'Documents, infractions et sanctions',
    categorie: 'Réglementation',
    contenu: `Conduire est un droit encadré : des documents le prouvent, des sanctions le protègent.

LES DOCUMENTS À BORD (toujours)
PERMIS DE CONDUIRE de la catégorie du véhicule ; CARTE GRISE (certificat d'immatriculation) ; ATTESTATION D'ASSURANCE en cours de validité — l'assurance responsabilité civile est OBLIGATOIRE : elle indemnise les victimes de tes dommages ; VISITE TECHNIQUE valide. Lors d'un contrôle (AG2) : se ranger calmement, présenter les documents. Conduire sans permis ou sans assurance est un délit, pas une simple contravention.

LES GRANDES FAMILLES D'INFRACTIONS
CONTRAVENTIONS : excès de vitesse, stationnement, ceinture, téléphone, feux ou panneaux grillés — amendes forfaitaires, parfois immobilisation. DÉLITS : conduite en état d'ivresse, sans permis, délit de fuite, refus d'obtempérer, blessures ou homicide involontaires — tribunal, fortes amendes, prison, retrait de permis.

LES SANCTIONS SUR LE PERMIS
Suspension (durée limitée) ou annulation (repasser l'examen). La récidive aggrave tout. Le nouveau conducteur est particulièrement exposé : les premiers mois construisent le dossier… et les réflexes.

LE VÉHICULE
Fourrière pour stationnement très gênant, immobilisation pour défaut de visite ou d'assurance, confiscation possible pour les délits graves.

EN RÉSUMÉ
Documents à jour + comportement conforme = zéro souci au contrôle. Le contrôle routier n'est pas un adversaire : il retire de la route ceux qui te mettent en danger.`,
    points_cles: [
      'À bord : permis + carte grise + assurance + visite technique',
      "L'assurance RC est obligatoire — rouler sans est un délit",
      'Contravention (amende) ≠ délit (tribunal, prison possible)',
      'Suspension = temporaire ; annulation = repasser l’examen',
    ],
    regles: [
      'Vérifier les dates de validité (assurance, visite) chaque mois',
      'Contrôle : se ranger calmement, documents prêts',
      'Signaler tout changement (adresse, cession) sur la carte grise',
    ],
    erreurs_frequentes: [
      "Rouler « en attendant » le renouvellement d'assurance",
      'Prêter son véhicule à un conducteur sans permis',
      'Fuir après un accrochage mineur (délit de fuite !)',
    ],
    exceptions: ['Permis étrangers : validité limitée, échange obligatoire au-delà du délai légal'],
    illustrations: [P('AG2'), P('AG1'), P('B14'), P('B7')],
  },
];

const NEW_CATEGORY_META: Record<string, { couleur: string; icone: string; description: string }> = {
  'Comportement du conducteur': {
    couleur: '#7C3AED',
    icone: 'ti-user-check',
    description: 'Vigilance, distances, alcool, fatigue et distractions au volant',
  },
  'Circulation routière': {
    couleur: '#2563EB',
    icone: 'ti-road',
    description: 'Position sur la chaussée, choix des voies, voies rapides',
  },
  Manœuvres: {
    couleur: '#0EA5E9',
    icone: 'ti-steering-wheel',
    description: 'Changements de direction, demi-tour, marche arrière, stationnement',
  },
  'Usagers vulnérables': {
    couleur: '#16A34A',
    icone: 'ti-walk',
    description: 'Piétons, enfants, deux-roues, charrettes : partager la route',
  },
  'Véhicule et équipements': {
    couleur: '#64748B',
    icone: 'ti-car-crash',
    description: 'Entretien, équipements obligatoires, visite technique',
  },
  Réglementation: {
    couleur: '#F97316',
    icone: 'ti-license',
    description: 'Documents, assurance, infractions et sanctions',
  },
};

async function main() {
  // Repartir d'une base propre : les chapitres remplacent les anciennes leçons.
  const removed = await prisma.lesson.deleteMany({});
  console.log(`🧹 ${removed.count} anciennes leçons supprimées`);

  let created = 0;
  for (const chapter of CHAPTERS) {
    let category = await prisma.category.findFirst({ where: { label: chapter.categorie } });
    if (!category) {
      const meta = NEW_CATEGORY_META[chapter.categorie];
      if (!meta) {
        console.warn(`⚠️  Catégorie introuvable, chapitre ignoré: ${chapter.titre}`);
        continue;
      }
      category = await prisma.category.create({ data: { label: chapter.categorie, ...meta } });
      console.log(`➕ Catégorie créée: ${chapter.categorie}`);
    }

    await prisma.lesson.create({
      data: {
        categoryId: category.id,
        titre: chapter.titre,
        contenu: chapter.contenu,
        points_cles: chapter.points_cles,
        regles: chapter.regles,
        erreurs_frequentes: chapter.erreurs_frequentes,
        exceptions: chapter.exceptions,
        illustrations: chapter.illustrations,
      },
    });
    created += 1;
  }

  console.log(`✅ ${created} chapitres généralistes créés`);
}

main()
  .catch((e) => {
    console.error('❌ Enrich failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
