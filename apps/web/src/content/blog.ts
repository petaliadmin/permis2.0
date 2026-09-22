export type BlogCategory =
  | 'Conseils examen'
  | 'Code de la route'
  | 'Permis de conduire'
  | 'Auto-écoles';

export interface FaqBlock {
  question: string;
  answer: string;
}

export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; tone: 'info' | 'success' | 'warning'; title: string; text: string }
  | {
      type: 'links';
      /** `external: true` opens in a new tab with rel="noopener" — for
       *  citing a source outside permis2.com (e.g. an official government
       *  publication) rather than linking to another page on this site. */
      items: { href: string; label: string; external?: boolean }[];
    };

export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description + card excerpt — 1-2 sentences, no fluff. */
  description: string;
  category: BlogCategory;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  /** GEO-style: a direct 40-80 word answer, shown right under the H1 before any block. */
  directAnswer: string;
  blocks: ContentBlock[];
  faqs?: FaqBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'erreurs-frequentes-examen-code-route',
    title: "Les erreurs les plus fréquentes à l'examen du Code de la route",
    description:
      "Panique, questions pièges, mauvaise gestion du temps : voici les erreurs qui font échouer le plus de candidats à l'examen du Code, et comment les éviter.",
    category: 'Conseils examen',
    publishedAt: '2026-09-12',
    updatedAt: '2026-09-12',
    readingMinutes: 6,
    directAnswer:
      "Les candidats échouent le plus souvent à cause d'erreurs évitables : mauvaise gestion du temps, lecture trop rapide des questions à plusieurs bonnes réponses, confusion entre panneaux similaires, et panique face à une série de questions difficiles d'affilée. Identifier ces pièges à l'avance permet de les neutraliser le jour de l'examen.",
    blocks: [
      {
        type: 'h2',
        text: '1. Répondre trop vite sans lire toute la question',
      },
      {
        type: 'p',
        text: "C'est l'erreur numéro un. Une question comme « Quels panneaux annoncent un danger ? » peut avoir plusieurs bonnes réponses, alors qu'une question presque identique — « Quel panneau annonce un danger ? » — n'en a qu'une. Le cerveau, sous pression, a tendance à lire la première moitié de la phrase et à cocher une réponse qui « a l'air juste ». Prenez systématiquement deux secondes pour repérer si la question est au singulier ou au pluriel, et si elle demande la réponse correcte ou l'erreur à ne pas commettre.",
      },
      {
        type: 'h2',
        text: '2. Confondre des panneaux qui se ressemblent',
      },
      {
        type: 'p',
        text: "Les panneaux de danger et certains panneaux d'obligation partagent des formes ou des couleurs proches, et les candidats les confondent sous pression — surtout quand deux panneaux voisins n'ont qu'un détail qui change (un sens de flèche, une couleur de bordure). La meilleure parade n'est pas de mémoriser chaque panneau isolément, mais de les réviser par famille : une fois qu'on connaît la logique d'une catégorie (danger = triangle rouge, interdiction = cercle rouge, obligation = cercle bleu), les détails deviennent plus faciles à distinguer.",
      },
      {
        type: 'links',
        items: [
          { href: '/traffic-signs', label: 'Réviser les panneaux par catégorie' },
          { href: '/code-route-senegal', label: 'Le guide complet du Code de la route' },
        ],
      },
      {
        type: 'h2',
        text: '3. Mal gérer son temps sur les questions difficiles',
      },
      {
        type: 'p',
        text: "Rester bloqué trois minutes sur une question qui n'en vaut qu'une, c'est souvent la raison pour laquelle un candidat bâcle les cinq questions suivantes. Si une question ne vous parle pas après une lecture attentive, donnez votre meilleure réponse honnête et passez à la suite — vous pourrez toujours revenir dessus s'il vous reste du temps à la fin.",
      },
      {
        type: 'h2',
        text: '4. Paniquer après une série de mauvaises réponses',
      },
      {
        type: 'p',
        text: "Enchaîner deux ou trois erreurs d'affilée fait souvent perdre ses moyens pour le reste du test, alors que le score se calcule sur l'ensemble des questions, pas sur une série. Traiter chaque question indépendamment des précédentes est la meilleure façon d'éviter cet effet boule de neige.",
      },
      {
        type: 'h2',
        text: "5. Ne pas s'être entraîné dans des conditions réalistes",
      },
      {
        type: 'p',
        text: "Beaucoup de candidats révisent leurs leçons mais ne se sont jamais chronométrés dans les conditions réelles de l'examen. Le jour J, la pression du temps est souvent le facteur qui fait basculer une bonne préparation théorique en échec. Un examen blanc chronométré, fait plusieurs fois avant le jour de l'examen, est le meilleur indicateur de votre préparation réelle.",
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'À retenir',
        text: "La plupart de ces erreurs ne sont pas des erreurs de connaissance mais des erreurs de méthode. Un candidat qui maîtrise le contenu mais gère mal son temps ou panique peut échouer ; l'inverse — bien gérer son stress avec des lacunes ciblées à combler — se corrige plus facilement avec de l'entraînement.",
      },
    ],
    faqs: [
      {
        question: "Combien de temps faut-il passer sur chaque question à l'examen ?",
        answer:
          "Il n'y a pas de règle universelle, mais s'entraîner avec un examen blanc chronométré permet de repérer son propre rythme et d'identifier les types de questions qui demandent plus de temps.",
      },
      {
        question: 'Faut-il revoir ses réponses avant de valider ?',
        answer:
          "Si le temps le permet, oui — mais uniquement pour les questions où vous aviez un doute réel. Changer une réponse par simple anxiété, sans nouvel élément, fait plus souvent perdre des points qu'en gagner.",
      },
    ],
  },
  {
    slug: 'bien-preparer-quiz-code-route',
    title: 'Quiz Code de la route : comment bien se préparer',
    description:
      "Faire des quiz ne suffit pas si on ne s'entraîne pas intelligemment. Voici une méthode concrète pour progresser plus vite avec les séries de quiz.",
    category: 'Conseils examen',
    publishedAt: '2026-09-12',
    updatedAt: '2026-09-12',
    readingMinutes: 5,
    directAnswer:
      "Bien se préparer avec des quiz demande une méthode, pas seulement de la répétition : cibler ses catégories faibles plutôt que de refaire toujours les mêmes séries, revoir systématiquement ses erreurs, espacer ses sessions de révision dans le temps, et ne passer à l'examen blanc qu'une fois un score stable obtenu sur plusieurs séries.",
    blocks: [
      {
        type: 'h2',
        text: 'Pourquoi refaire la même série en boucle ne suffit pas',
      },
      {
        type: 'p',
        text: "Refaire dix fois la série 1 donne un faux sentiment de maîtrise : on finit par reconnaître les questions plutôt que par comprendre les règles. Un bon indicateur de progression est votre score sur des séries que vous n'avez pas encore beaucoup pratiquées, pas sur celles que vous connaissez par cœur.",
      },
      {
        type: 'h2',
        text: 'Cibler ses catégories faibles plutôt que réviser au hasard',
      },
      {
        type: 'p',
        text: "Chaque série de quiz pioche dans toutes les catégories (panneaux, priorités, circulation, signaux, situations). Si vous remarquez que vous vous trompez régulièrement sur un même thème — par exemple les priorités aux intersections — concentrez une session de révision entière sur les leçons de ce thème avant de reprendre les quiz.",
      },
      {
        type: 'links',
        items: [
          { href: '/cours', label: 'Réviser par thème avec les leçons' },
          { href: '/quizz', label: 'Voir toutes les séries de quiz' },
        ],
      },
      {
        type: 'h3',
        text: 'Utiliser la banque d\'erreurs',
      },
      {
        type: 'p',
        text: "Chaque question ratée est automatiquement gardée dans votre banque d'erreurs personnelle (« Revoir mes erreurs »). C'est la ressource de révision la plus efficace : plutôt que de repartir de zéro, vous concentrez votre temps sur les questions qui vous ont vraiment posé problème, jusqu'à ce qu'elles disparaissent de la liste.",
      },
      {
        type: 'h2',
        text: 'Espacer les sessions plutôt que tout réviser la veille',
      },
      {
        type: 'p',
        text: "Une préparation répartie sur plusieurs jours, même courte à chaque fois (15-20 minutes), ancre mieux les connaissances qu'une session unique de plusieurs heures juste avant l'examen. Le cerveau retient mieux ce qu'il a eu le temps d'oublier un peu puis de retrouver.",
      },
      {
        type: 'h2',
        text: 'Passer à l\'examen blanc au bon moment',
      },
      {
        type: 'p',
        text: "L'examen blanc simule les conditions réelles (temps limité, questions mélangées, pas de round trip vers une leçon). Il est plus utile une fois que vous obtenez déjà un score régulier au-dessus de 70-80 % sur les quiz : il sert alors à valider votre préparation et à vous habituer au format et au chronomètre, pas à découvrir le contenu.",
      },
      {
        type: 'callout',
        tone: 'success',
        title: 'Méthode en 3 étapes',
        text: '1) Leçons par thème pour combler les lacunes → 2) Quiz ciblés sur ces mêmes thèmes → 3) Examen blanc chronométré une fois un score stable atteint.',
      },
    ],
    faqs: [
      {
        question: 'Combien de séries de quiz faut-il faire avant de se sentir prêt ?',
        answer:
          "Il n'y a pas de nombre magique — mieux vaut viser un score stable et répété (au-dessus de 70-80 %) sur des séries variées plutôt qu'un nombre fixe de séries terminées.",
      },
      {
        question: 'Faut-il refaire une série déjà réussie à 100 % ?',
        answer:
          "Ce n'est pas prioritaire. Le temps est mieux investi sur les catégories où le score est encore faible, via les leçons puis de nouvelles séries.",
      },
    ],
  },
  {
    slug: 'examen-blanc-code-sentrainer-efficacement',
    title: "Examen blanc du Code : comment s'entraîner efficacement",
    description:
      "L'examen blanc reproduit les conditions du jour J. Voici comment l'utiliser au bon moment et interpréter son score pour savoir si vous êtes vraiment prêt.",
    category: 'Conseils examen',
    publishedAt: '2026-09-12',
    updatedAt: '2026-09-12',
    readingMinutes: 5,
    directAnswer:
      "Un examen blanc sert à s'entraîner dans des conditions proches de l'examen réel : temps limité, questions mélangées, sans retour possible vers une leçon. Il est le plus utile après une phase de révision par thème, pour valider sa préparation et repérer les derniers points faibles avant le jour J, plutôt que comme premier outil de découverte du contenu.",
    blocks: [
      {
        type: 'h2',
        text: "Pourquoi l'examen blanc est différent d'un quiz",
      },
      {
        type: 'p',
        text: "Un quiz classique permet de s'arrêter, de revenir en arrière, de comprendre une explication tout de suite après une erreur. L'examen blanc, lui, reproduit la pression du temps et le mélange de toutes les catégories, exactement comme le jour de l'examen officiel. C'est cette pression qui est le véritable test — beaucoup de candidats qui maîtrisent le contenu en quiz perdent des points à l'examen simplement parce qu'ils n'ont jamais été confrontés au chronomètre.",
      },
      {
        type: 'h2',
        text: 'Quand faire son premier examen blanc',
      },
      {
        type: 'p',
        text: "Idéalement après avoir couvert l'ensemble des thèmes au moins une fois en leçons et obtenu un score correct sur les quiz — pas avant. Un premier examen blanc fait trop tôt ne mesure que des lacunes déjà connues et peut décourager inutilement.",
      },
      {
        type: 'links',
        items: [
          { href: '/exam', label: 'Passer un examen blanc' },
          { href: '/quizz', label: "S'entraîner d'abord avec les quiz" },
        ],
      },
      {
        type: 'h2',
        text: 'Comment interpréter son score',
      },
      {
        type: 'ul',
        items: [
          "En dessous de 60 % : retour aux leçons sur les thèmes ratés avant de retenter.",
          "Entre 60 et 80 % : la préparation progresse, mais certaines catégories méritent encore une révision ciblée.",
          "Au-dessus de 80 %, obtenu sur plusieurs examens blancs différents : c'est un bon signal de préparation avant de se présenter à l'examen officiel.",
        ],
      },
      {
        type: 'h2',
        text: 'Refaire plusieurs examens blancs, pas un seul',
      },
      {
        type: 'p',
        text: "Un bon score obtenu une seule fois peut être en partie de la chance sur le tirage des questions. Répéter l'examen blanc plusieurs fois, à quelques jours d'intervalle, donne une mesure plus fiable de votre niveau réel que n'importe quel score isolé.",
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'Erreur à éviter',
        text: "Ne pas confondre s'entraîner et mémoriser les questions d'un examen blanc précis. Si les questions changent à l'examen réel — ce qui est le cas — les avoir apprises par cœur ne remplace pas la compréhension des règles.",
      },
    ],
    faqs: [
      {
        question: "Combien d'examens blancs faut-il faire avant l'examen réel ?",
        answer:
          "Il n'y a pas de nombre fixe. L'objectif est d'obtenir un score stable au-dessus de 80 % sur plusieurs tentatives différentes, pas de multiplier les passages sans progression.",
      },
      {
        question: "L'examen blanc est-il identique à l'examen officiel ?",
        answer:
          "Il reproduit le format (temps limité, questions mélangées) pour s'entraîner dans des conditions proches, mais les questions et le déroulement exact de l'examen officiel dépendent des services compétents de l'État du Sénégal.",
      },
    ],
  },
  {
    slug: 'comprendre-priorites-circulation-senegal',
    title: 'Tout comprendre sur les priorités de circulation',
    description:
      "Priorité à droite, cédez le passage, STOP : les règles de priorité sont l'un des thèmes les plus piégeux du Code. Voici comment les distinguer clairement.",
    category: 'Code de la route',
    publishedAt: '2026-09-12',
    updatedAt: '2026-09-12',
    readingMinutes: 6,
    directAnswer:
      "Les règles de priorité déterminent qui doit céder le passage à une intersection. Elles reposent sur trois cas : la priorité à droite par défaut en l'absence de signalisation, le panneau Cédez le passage qui impose de ralentir et de laisser passer les véhicules de la voie prioritaire, et le panneau STOP qui impose un arrêt total avant de repartir. Bien les distinguer est l'un des points les plus rentables à réviser avant l'examen.",
    blocks: [
      {
        type: 'h2',
        text: 'La priorité à droite, la règle par défaut',
      },
      {
        type: 'p',
        text: "En l'absence de tout panneau à une intersection, la règle par défaut est la priorité à droite : le véhicule arrivant par la droite est prioritaire. C'est une règle qui s'applique par défaut, mais qui disparaît dès qu'un panneau de priorité, un feu, ou un agent de circulation vient la remplacer.",
      },
      {
        type: 'h2',
        text: 'Le panneau Cédez le passage',
      },
      {
        type: 'p',
        text: "Le panneau Cédez le passage impose de ralentir à l'approche de l'intersection et de laisser passer les véhicules circulant sur la voie prioritaire, sans obligation d'arrêt complet si la voie est déjà dégagée. C'est la différence essentielle avec le panneau STOP : ici, un simple ralentissement suffit si la voie est libre.",
      },
      {
        type: 'h2',
        text: 'Le panneau STOP',
      },
      {
        type: 'p',
        text: "Le panneau STOP impose un arrêt complet du véhicule, même si la voie semble dégagée, avant de repartir en cédant le passage aux véhicules prioritaires. C'est une des erreurs les plus fréquentes à l'examen pratique : marquer un ralentissement au lieu d'un arrêt total et immobile.",
      },
      {
        type: 'links',
        items: [
          { href: '/traffic-signs/stop-arret-obligatoire', label: 'Fiche complète du panneau STOP' },
          { href: '/traffic-signs/cedez-le-passage', label: 'Fiche complète Cédez le passage' },
          {
            href: '/traffic-signs/intersection-priorite-a-droite',
            label: 'Fiche complète Priorité à droite',
          },
        ],
      },
      {
        type: 'h2',
        text: 'Les ronds-points : un cas particulier',
      },
      {
        type: 'p',
        text: "Dans un rond-point signalé comme tel, la règle générale est l'inverse de la priorité à droite classique : ce sont les véhicules déjà engagés dans le rond-point qui sont prioritaires sur ceux qui souhaitent y entrer. C'est une source fréquente de confusion pour les candidats habitués au réflexe de priorité à droite.",
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Méthode pour ne plus se tromper',
        text: "Face à une question de priorité, posez-vous les questions dans cet ordre : y a-t-il un panneau ou un feu ? Sinon, qui arrive par la droite ? C'est cette hiérarchie de raisonnement, plus que la mémorisation de cas isolés, qui permet de répondre correctement même à des situations inédites.",
      },
    ],
    faqs: [
      {
        question: 'Un panneau de priorité annule-t-il toujours la priorité à droite ?',
        answer:
          "Oui — dès qu'un panneau, un feu ou un agent de circulation régule une intersection, la règle de priorité à droite par défaut ne s'applique plus à cet endroit précis.",
      },
      {
        question: 'Faut-il s\'arrêter complètement à un Cédez le passage si la voie est libre ?',
        answer:
          "Non, contrairement au STOP qui impose un arrêt total dans tous les cas, le Cédez le passage impose seulement de ralentir et de céder le passage si un véhicule est présent sur la voie prioritaire.",
      },
    ],
  },
  {
    slug: 'reforme-code-route-senegal-permis-a-points',
    title: 'Réforme du Code de la route au Sénégal',
    description:
      "Permis à points, vidéo-verbalisation, paiements numériques : où en est la réforme du Code de la route sénégalais, et que dit le texte actuellement en vigueur.",
    category: 'Code de la route',
    publishedAt: '2026-09-20',
    updatedAt: '2026-09-20',
    readingMinutes: 5,
    directAnswer:
      "Le Code de la route actuellement en vigueur au Sénégal est la loi n°2022-04 du 15 avril 2022 (partie législative). Le gouvernement travaille depuis à une réforme de sa partie réglementaire — permis à points, vidéo-verbalisation, paiements numériques, formation obligatoire en auto-école — annoncée pour une application progressive à partir de 2026, mais dont l'entrée en vigueur définitive n'était pas confirmée à la date de publication de cet article.",
    blocks: [
      {
        type: 'h2',
        text: 'Le Code de la route actuellement en vigueur',
      },
      {
        type: 'p',
        text: "Le texte de référence est la loi n°2022-04 du 15 avril 2022 portant Code de la route (partie législative), publiée au Journal Officiel n°7520 du 27 avril 2022. C'est ce texte qui fixe aujourd'hui les règles de circulation, les catégories de permis et les sanctions applicables au Sénégal.",
      },
      {
        type: 'links',
        items: [
          {
            href: 'https://www.vie-publique.sn/documents/8335/loi-n-2022-04-du-15-avril-2022-portant-code-de-la-route-partie-legislative',
            label: 'Loi n°2022-04 sur Vie-Publique.sn (plateforme officielle)',
            external: true,
          },
        ],
      },
      {
        type: 'h2',
        text: 'Une réforme en cours de finalisation',
      },
      {
        type: 'p',
        text: "Depuis 2025, le gouvernement sénégalais travaille sur une réforme de la partie réglementaire du Code de la route, portée notamment par le ministère des Infrastructures et des Transports terrestres. D'après les annonces relayées par la presse économique début 2026, le chantier technique était alors évalué à environ 80 % d'avancement, avec un objectif d'application progressive avant la fin du premier semestre 2026 — sans date d'entrée en vigueur définitive confirmée à ce jour.",
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Ce que cette page peut confirmer',
        text: "PERMIS2.0 n'est pas une administration et ne peut pas confirmer une date d'entrée en vigueur. Cette page cite les sources disponibles à la date de publication et sera mise à jour si un texte réglementaire officiel est publié. Vérifiez toujours l'information auprès des services compétents de l'État avant toute démarche administrative.",
      },
      {
        type: 'h2',
        text: 'Les mesures annoncées',
      },
      {
        type: 'ul',
        items: [
          "Permis à points : un système de points associé au permis de conduire, avec retrait progressif en cas d'infractions répétées.",
          "Vidéo-verbalisation : des infractions constatées et sanctionnées à distance par caméra, sans interception systématique du véhicule.",
          "Paiements numériques : dématérialisation du paiement des amendes et de certaines démarches liées au contrôle technique.",
          "Formation renforcée en auto-école : un passage en auto-école rendu obligatoire pour l'obtention du permis, avec une professionnalisation accrue de la formation, en particulier pour les conducteurs de transport en commun.",
        ],
      },
      {
        type: 'p',
        text: "Ces mesures sont celles rapportées par la presse au sujet des annonces gouvernementales — elles décrivent un projet en cours de finalisation, pas un texte déjà promulgué. Tant qu'aucun décret d'application n'est officiellement publié, le Code actuellement en vigueur reste la loi n°2022-04 citée plus haut.",
      },
      {
        type: 'links',
        items: [
          {
            href: 'https://www.socialnetlink.org/2026/03/11/permis-a-points-videoverbalisation-paiements-digitaux-le-senegal-accelere-la-digitalisation-du-code-de-la-route/',
            label: 'SocialNetLink — le point sur la réforme (mars 2026)',
            external: true,
          },
          {
            href: 'https://fr.apanews.net/security/senegal-vers-une-mise-en-oeuvre-acceleree-du-nouveau-code-de-la-route/',
            label: 'APAnews — mise en œuvre accélérée du nouveau Code',
            external: true,
          },
        ],
      },
      {
        type: 'h2',
        text: "Se préparer dès maintenant, sans attendre la réforme",
      },
      {
        type: 'p',
        text: "Quelle que soit la date d'entrée en vigueur de la réforme, les bases du Code de la route — panneaux, priorités, règles de circulation — resteront le socle de l'examen. Réviser sérieusement dès aujourd'hui reste la meilleure préparation, quelle que soit la version du texte en vigueur le jour de l'examen.",
      },
      {
        type: 'links',
        items: [
          { href: '/code-route-senegal', label: 'Le guide complet du Code de la route' },
          { href: '/traffic-signs', label: 'Réviser les panneaux par catégorie' },
        ],
      },
    ],
    faqs: [
      {
        question: 'Le permis à points est-il déjà en vigueur au Sénégal ?',
        answer:
          "Non, pas à la date de publication de cet article. La réforme est annoncée et en cours de finalisation par le gouvernement, mais aucun texte réglementaire officiel confirmant son entrée en vigueur n'était disponible sur les sources publiques consultées.",
      },
      {
        question: 'Où trouver le texte officiel du Code de la route sénégalais ?',
        answer:
          "La loi n°2022-04 du 15 avril 2022 portant Code de la route (partie législative) est publiée sur Vie-Publique.sn, qui diffuse les documents des institutions officielles du Sénégal.",
      },
      {
        question: "Cette réforme va-t-elle changer le contenu de l'examen du Code ?",
        answer:
          "Le contenu précis d'un futur examen dépendra des textes d'application, non encore publiés. Les règles de circulation, priorités et panneaux qui forment le socle du Code de la route ne devraient pas être bouleversés — se préparer sur ces bases reste pertinent quelle que soit l'issue de la réforme.",
      },
    ],
  },
  {
    slug: 'nouvelle-demande-permis-conduire-apres-examen-senegal',
    title: 'Après l\'examen : comment obtenir son permis de conduire au Sénégal',
    description:
      "Réussir le Code et la conduite n'est que la première étape. Voici comment se déroule ensuite la demande officielle du permis biométrique auprès de Capp Karangë.",
    category: 'Permis de conduire',
    publishedAt: '2026-09-22',
    updatedAt: '2026-09-22',
    readingMinutes: 6,
    directAnswer:
      "Une fois le Code de la route et l'épreuve pratique réussis en auto-école, l'obtention du permis biométrique passe par une « nouvelle demande » déposée auprès de Capp Karangë, l'organisme chargé de la production des permis de conduire au Sénégal — notamment à la Direction des Transports Routiers de Hann à Dakar. Le dossier est ensuite instruit, et le permis doit être retiré en personne une fois prêt. La liste exacte des pièces à fournir et les délais doivent être vérifiés directement auprès de Capp Karangë ou de votre auto-école, ces informations pouvant évoluer.",
    blocks: [
      {
        type: 'h2',
        text: "Réussir l'examen n'est que la première étape",
      },
      {
        type: 'p',
        text: "Obtenir son permis de conduire au Sénégal suit un parcours en plusieurs temps : formation en auto-école, réussite de l'examen du Code, puis de l'épreuve pratique de conduite. Mais réussir ces épreuves ne délivre pas automatiquement le titre physique — il reste une démarche administrative à accomplir pour obtenir le permis biométrique lui-même, celle-ci étant gérée par un organisme distinct de l'auto-école.",
      },
      {
        type: 'links',
        items: [{ href: '/permis-conduire-senegal', label: 'Revoir les étapes pour préparer son permis' }],
      },
      {
        type: 'h2',
        text: 'La « nouvelle demande » auprès de Capp Karangë',
      },
      {
        type: 'p',
        text: "Au Sénégal, la production des permis de conduire biométriques est assurée par Capp Karangë, un projet de modernisation et de numérisation des titres de transport. Sur son site, l'opération correspondant à un premier permis s'appelle « nouvelle demande d'obtention du permis de conduire », et se distingue des demandes de remplacement (ancien permis) ou de duplicata (permis perdu ou volé). D'après les informations publiées par Capp Karangë, le site de la Direction des Transports Routiers, à Hann (route de front de terre, ex TP Som) à Dakar, est le point de dépôt indiqué pour ce type de demande — d'autres sites régionaux existent en dehors de Dakar.",
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'PERMIS 2.0 ne gère pas cette démarche',
        text: "PERMIS 2.0 prépare à l'examen du Code de la route et met en relation avec des auto-écoles partenaires — la délivrance du titre officiel dépend uniquement de Capp Karangë et des services compétents de l'État. Cette page explique le principe de la démarche, pas la liste exacte des pièces à fournir : vérifiez-la directement auprès de Capp Karangë ou de votre auto-école avant de vous déplacer.",
      },
      {
        type: 'h2',
        text: 'Ce que votre auto-école transmet, ce que vous apportez vous-même',
      },
      {
        type: 'p',
        text: "Dans la pratique, une partie du dossier (résultats d'examen, attestations de formation) transite via l'auto-école où vous vous êtes formé, tandis que d'autres pièces (état civil, justificatifs personnels) restent à votre charge. Le partage exact des responsabilités peut varier — demandez à votre auto-école, au moment de votre inscription, ce qu'elle prend en charge une fois l'examen réussi et ce qui reste de votre ressort.",
      },
      {
        type: 'links',
        items: [{ href: '/auto-ecoles-senegal', label: 'Comparer les auto-écoles partenaires' }],
      },
      {
        type: 'h2',
        text: 'Suivre l\'avancement de son dossier',
      },
      {
        type: 'p',
        text: "Capp Karangë propose un outil de suivi de dossier en ligne, utile pour savoir où en est le traitement de sa demande sans avoir à se déplacer ou à appeler. C'est le réflexe à avoir avant de retourner sur place, plutôt que de se présenter au site de dépôt sans visibilité sur l'état du dossier.",
      },
      {
        type: 'links',
        items: [
          {
            href: 'https://cappkarange.sn/suivi/',
            label: 'Suivre son dossier sur cappkarange.sn',
            external: true,
          },
          {
            href: 'https://cappkarange.sn/nouvelle-demande-dobtention-du-permis-de-conduire/',
            label: 'Page officielle « Nouvelle demande » — cappkarange.sn',
            external: true,
          },
        ],
      },
      {
        type: 'h2',
        text: 'Le retrait du permis : une étape en personne',
      },
      {
        type: 'p',
        text: "Une fois le titre prêt, le retrait du permis biométrique se fait en personne : une tierce personne — même un proche muni d'une procuration informelle — ne peut pas retirer le titre à votre place. C'est un point qui surprend souvent les candidats pressés ou éloignés du site de dépôt ; mieux vaut l'anticiper dans son organisation plutôt que de le découvrir sur place.",
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'À anticiper',
        text: "Prévoyez de vous déplacer vous-même le jour du retrait. Si un empêchement sérieux vous en empêche, seul Capp Karangë peut indiquer la marche à suivre applicable à votre situation.",
      },
    ],
    faqs: [
      {
        question: 'Mon auto-école dépose-t-elle la demande à ma place après mon examen ?',
        answer:
          "Le partage exact des tâches entre l'auto-école et le candidat peut varier. Dans la plupart des cas, une partie du dossier passe par l'auto-école mais le dépôt final et le retrait du titre restent à la charge du candidat — à confirmer avec votre auto-école.",
      },
      {
        question: 'Où déposer sa demande en dehors de Dakar ?',
        answer:
          "Capp Karangë indique disposer de sites régionaux en plus des sites principaux de Dakar. Le site officiel cappkarange.sn ou le contact indiqué sur ses pages permettent de connaître le site le plus proche de chez vous.",
      },
      {
        question: 'Puis-je me faire représenter pour retirer mon permis une fois prêt ?',
        answer:
          "Non — d'après les informations publiées par Capp Karangë, le retrait se fait en personne et une tierce personne ne peut pas retirer le titre à votre place.",
      },
    ],
  },
  {
    slug: 'duplicata-permis-conduire-perdu-vole-senegal',
    title: 'Permis de conduire perdu ou volé au Sénégal : comment obtenir un duplicata',
    description:
      "Permis perdu, volé ou détérioré : la marche à suivre pour obtenir un duplicata de son permis de conduire auprès de Capp Karangë, sans repartir de zéro.",
    category: 'Permis de conduire',
    publishedAt: '2026-09-22',
    updatedAt: '2026-09-22',
    readingMinutes: 5,
    directAnswer:
      "En cas de perte, de vol ou de détérioration de son permis de conduire au Sénégal, il faut déposer une demande de duplicata auprès de Capp Karangë, l'organisme chargé de la production des permis biométriques — c'est une opération distincte d'une nouvelle demande, puisque le permis existe déjà administrativement. La liste précise des pièces à fournir (dont, selon les cas, une déclaration de perte ou de vol) et les délais doivent être vérifiés directement auprès de Capp Karangë, ces informations pouvant évoluer.",
    blocks: [
      {
        type: 'h2',
        text: "Perte ou vol : la première chose à faire",
      },
      {
        type: 'p',
        text: "Avant toute démarche auprès de Capp Karangë, un permis volé — ou perdu dans des circonstances qui le justifient — fait généralement l'objet d'une déclaration auprès des services de police ou de gendarmerie. Cette déclaration fait partie des pièces que l'on peut vous demander pour constituer un dossier de duplicata ; gardez-en une copie.",
      },
      {
        type: 'h2',
        text: 'La demande de duplicata, une opération à part',
      },
      {
        type: 'p',
        text: "Sur le site de Capp Karangë, la demande de duplicata est une opération distincte de la « nouvelle demande » (premier permis) et du « remplacement » (mise à jour de l'ancien format vers le nouveau permis biométrique). Le duplicata reprend en principe les informations de votre permis existant — catégories obtenues, date d'obtention — sans repasser les épreuves. Le détail exact du dossier à constituer doit être confirmé sur place ou via le site officiel, car il peut varier selon que le permis a été perdu, volé ou détérioré.",
      },
      {
        type: 'links',
        items: [
          {
            href: 'https://cappkarange.sn/demande-de-duplicata-de-permis-de-conduire/',
            label: 'Page officielle « Demande de duplicata » — cappkarange.sn',
            external: true,
          },
        ],
      },
      {
        type: 'h2',
        text: "Un changement d'adresse en même temps ? Le certificat de résidence",
      },
      {
        type: 'p',
        text: "Si votre adresse a changé depuis l'émission de votre permis d'origine et que vous souhaitez la mettre à jour à l'occasion du duplicata, un certificat de résidence peut vous être demandé. Ce n'est pas systématique — uniquement si vous demandez explicitement la mise à jour de votre adresse sur le nouveau titre.",
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'Le retrait se fait en personne',
        text: "Comme pour toute demande auprès de Capp Karangë, le duplicata doit être retiré par le titulaire lui-même — une tierce personne ne peut pas venir le chercher à votre place, même avec une autorisation écrite.",
      },
      {
        type: 'h2',
        text: 'Suivre sa demande et vérifier les informations à jour',
      },
      {
        type: 'p',
        text: "Le suivi de dossier en ligne de Capp Karangë permet de vérifier l'avancement de sa demande de duplicata sans se déplacer. Les tarifs, délais et pièces exactes évoluant, il vaut mieux les confirmer sur le site officiel ou par téléphone juste avant de se déplacer plutôt que de se fier à une information ancienne.",
      },
      {
        type: 'links',
        items: [
          {
            href: 'https://cappkarange.sn/suivi/',
            label: 'Suivre son dossier sur cappkarange.sn',
            external: true,
          },
          { href: '/permis-conduire-senegal', label: 'Le guide complet du permis au Sénégal' },
        ],
      },
    ],
    faqs: [
      {
        question: 'Dois-je repasser un examen pour obtenir un duplicata ?',
        answer:
          "Non, le duplicata reprend en principe les catégories et informations de votre permis existant — c'est une réédition du titre, pas une nouvelle obtention.",
      },
      {
        question: 'Puis-je envoyer quelqu\'un retirer mon duplicata à ma place ?',
        answer:
          "Non, d'après les informations publiées par Capp Karangë, le retrait d'un titre se fait en personne, y compris pour un duplicata.",
      },
      {
        question: 'Que faire si mon adresse a changé depuis mon premier permis ?',
        answer:
          "Vous pouvez en principe la mettre à jour à l'occasion de votre duplicata, généralement en fournissant un certificat de résidence — à confirmer selon votre situation auprès de Capp Karangë.",
      },
    ],
  },
  {
    slug: 'remplacement-ancien-permis-biometrique-senegal',
    title: "Remplacer son ancien permis « rose » par le nouveau permis biométrique",
    description:
      "De nombreux conducteurs sénégalais détiennent encore l'ancien permis au format carnet. Voici le principe du remplacement par le nouveau titre biométrique.",
    category: 'Permis de conduire',
    publishedAt: '2026-09-22',
    updatedAt: '2026-09-22',
    readingMinutes: 5,
    directAnswer:
      "Le Sénégal a modernisé ses titres de transport avec un permis de conduire biométrique sécurisé, qui remplace progressivement l'ancien format « carnet rose ». Les détenteurs de l'ancien permis peuvent demander son remplacement auprès de Capp Karangë, l'organisme chargé de cette production — une opération distincte d'un duplicata (permis perdu) ou d'une nouvelle demande (premier permis). Les pièces exactes à fournir doivent être vérifiées directement auprès de Capp Karangë.",
    blocks: [
      {
        type: 'h2',
        text: 'Pourquoi un nouveau format de permis',
      },
      {
        type: 'p',
        text: "Capp Karangë se présente comme un projet de modernisation et de numérisation des titres de transport sénégalais, reposant sur des supports sécurisés et infalsifiables — par opposition à l'ancien permis au format carnet, communément appelé « permis rose », plus facilement falsifiable. Le remplacement permet à un détenteur de l'ancien format d'obtenir le nouveau titre biométrique sans repasser d'examen.",
      },
      {
        type: 'h2',
        text: 'Des pièces qui peuvent varier selon votre situation',
      },
      {
        type: 'p',
        text: "D'après les informations publiées par Capp Karangë, certains cas particuliers demandent des pièces supplémentaires au dossier de remplacement standard — notamment si votre permis a été perdu ou volé entretemps (ce qui relève alors d'une demande de duplicata), ou si vous souhaitez mettre à jour votre adresse sur le nouveau titre, auquel cas un certificat de résidence est demandé.",
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Le groupe sanguin, une information demandée sur le nouveau permis',
        text: "Le nouveau permis biométrique sénégalais comporte le groupe sanguin de son titulaire. D'après Capp Karangë, cette recherche peut être nécessaire en amont si vous ne connaissez pas déjà votre groupe sanguin — mieux vaut vous renseigner sur la marche à suivre avant de déposer votre dossier de remplacement.",
      },
      {
        type: 'h2',
        text: 'Où faire sa demande',
      },
      {
        type: 'p',
        text: "Le site de CICES – Foire de Dakar est indiqué par Capp Karangë comme site pour les demandes de remplacement de permis de conduire à Dakar. Des sites régionaux existent également en dehors de la capitale — le site officiel ou le numéro d'information de Capp Karangë permettent de trouver le point le plus proche de chez vous.",
      },
      {
        type: 'links',
        items: [
          {
            href: 'https://cappkarange.sn/remplacement-permis/',
            label: 'Page officielle « Remplacement Permis » — cappkarange.sn',
            external: true,
          },
        ],
      },
      {
        type: 'h2',
        text: 'Le retrait, comme pour toute demande, se fait en personne',
      },
      {
        type: 'p',
        text: "Une fois le nouveau permis biométrique prêt, il doit être retiré par son titulaire en personne — une tierce personne, même un proche, ne peut pas le retirer à votre place. Anticipez cette contrainte dans votre organisation, surtout si le site de dépôt n'est pas proche de votre lieu de résidence habituel.",
      },
      {
        type: 'links',
        items: [
          {
            href: 'https://cappkarange.sn/suivi/',
            label: 'Suivre son dossier sur cappkarange.sn',
            external: true,
          },
          { href: '/permis-conduire-senegal', label: 'Le guide complet du permis au Sénégal' },
        ],
      },
    ],
    faqs: [
      {
        question: 'Le remplacement change-t-il mes catégories de permis ?',
        answer:
          "Non a priori — le remplacement reprend les catégories et informations de votre permis existant sur le nouveau format biométrique, sans repasser d'examen.",
      },
      {
        question: 'Le groupe sanguin est-il vraiment obligatoire sur le nouveau permis ?',
        answer:
          "D'après les informations publiées par Capp Karangë, le nouveau permis biométrique comporte cette information — renseignez-vous en amont sur la marche à suivre si vous ne connaissez pas déjà votre groupe sanguin.",
      },
      {
        question: 'Combien de temps faut-il pour recevoir son nouveau permis ?',
        answer:
          "Le délai varie et n'est pas garanti à l'avance. Le suivi de dossier en ligne de Capp Karangë permet de vérifier l'état d'avancement sans avoir à se déplacer.",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getBlogPostsSorted(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
