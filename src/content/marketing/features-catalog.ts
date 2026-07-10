export type MarketingFeatureCategory =
  | 'musculation'
  | 'nutrition'
  | 'objectifs'
  | 'social'
  | 'plateforme'
  | 'premium'
  | 'coach'

export type MarketingFeatureTier = 'free' | 'premium'

export type CatalogFeature = {
  id: string
  title: string
  description: string
  longDescription: string
  tier: MarketingFeatureTier
  category: MarketingFeatureCategory
  bullets: string[]
  imageSrc?: string
}

export const MARKETING_CATEGORY_LABELS: Record<MarketingFeatureCategory, string> = {
  musculation: 'Musculation',
  nutrition: 'Nutrition',
  objectifs: 'Objectifs',
  social: 'Communauté',
  plateforme: 'Plateforme',
  premium: 'Premium',
  coach: 'Espace coach',
}

export const MARKETING_CATEGORY_DESCRIPTIONS: Record<MarketingFeatureCategory, string> = {
  musculation:
    'Planifiez, enregistrez et analysez chaque séance avec un carnet d’entraînement pensé pour la salle.',
  nutrition:
    'Journal alimentaire, macros et scan pour aligner votre alimentation sur vos objectifs sportifs.',
  objectifs:
    'Poids cible, progression et accompagnement pour garder le cap sur la durée.',
  social:
    'Streaks, médailles et amis pour transformer la régularité en habitude collective.',
  plateforme:
    'Une application accessible partout, installable et pensée pour le quotidien.',
  premium:
    'Les outils avancés pour accélérer votre progression quand vous êtes prêt à aller plus loin.',
  coach:
    'Un espace dédié aux professionnels qui accompagnent leurs athlètes au quotidien.',
}

export const MARKETING_FEATURES_CATALOG: CatalogFeature[] = [
  // —— Musculation (gratuit) ——
  {
    id: 'workout-tracking',
    title: 'Suivi des séances',
    description: 'Enregistrez chaque entraînement avec charges, répétitions et repos.',
    longDescription:
      'RCoach remplace le carnet papier : chaque séance est historisée, structurée par exercice et accessible depuis votre téléphone ou navigateur.',
    tier: 'free',
    category: 'musculation',
    bullets: [
      'Saisie des séries en temps réel',
      'Timer de repos intégré',
      'Historique consultable sur 4 semaines (Gratuit)',
    ],
    imageSrc: '/onboarding/sessions.png',
  },
  {
    id: 'active-workout',
    title: 'Séance active',
    description: 'Mode entraînement immersif avec chronomètre et validation des séries.',
    longDescription:
      'Lancez une séance depuis un modèle ou un programme : l’interface se concentre sur l’essentiel pour ne rien oublier entre deux exercices.',
    tier: 'free',
    category: 'musculation',
    bullets: ['Circuits et enchaînements', 'Repos automatique', 'Reprise de séance interrompue'],
    imageSrc: '/onboarding/sessions.png',
  },
  {
    id: 'templates-limited',
    title: 'Modèles de séance',
    description: '6 modèles inclus pour démarrer vite, illimités en Premium.',
    longDescription:
      'Créez des gabarits réutilisables (exercices, séries, repos) et relancez-les en un tap. La version gratuite inclut 6 modèles actifs.',
    tier: 'free',
    category: 'musculation',
    bullets: ['Bibliothèque d’exercices', '6 modèles (Gratuit)', 'Modèles illimités (Premium)'],
  },
  {
    id: 'planning-limited',
    title: 'Programmes & planning',
    description: '1 programme actif en gratuit, planning hebdomadaire visuel.',
    longDescription:
      'Organisez votre semaine d’entraînement et assignez des séances aux jours. Premium débloque un nombre illimité de programmes actifs.',
    tier: 'free',
    category: 'musculation',
    bullets: ['Calendrier hebdomadaire', '1 programme actif (Gratuit)', 'Programmes illimités (Premium)'],
  },
  {
    id: 'overload-limited',
    title: 'Ajustement des charges',
    description: '1 suggestion de charge par jour en gratuit, illimité en Premium.',
    longDescription:
      'RCoach analyse votre historique pour proposer une progression de charge adaptée. La formule gratuite inclut une suggestion par jour.',
    tier: 'free',
    category: 'musculation',
    bullets: ['Suggestion basée sur vos dernières séances', '1/jour (Gratuit)', 'Illimité (Premium)'],
  },
  {
    id: 'history-limited',
    title: 'Historique des séances',
    description: '4 semaines d’historique en gratuit, illimité en Premium.',
    longDescription:
      'Retrouvez vos anciennes séances, comparez vos performances et observez votre régularité sur le mois écoulé.',
    tier: 'free',
    category: 'musculation',
    bullets: ['Détail par exercice et par séance', '4 semaines (Gratuit)', 'Historique illimité (Premium)'],
  },
  {
    id: 'pr-records',
    title: 'Records personnels',
    description: 'Détection automatique de vos nouveaux PR et célébration des progrès.',
    longDescription:
      'Chaque record sur un exercice est repéré et mis en avant. Les médailles de volume et de PR complètent cette vue progression.',
    tier: 'free',
    category: 'musculation',
    bullets: ['PR par exercice', 'Médailles de records', 'Volume cumulé suivi'],
  },
  {
    id: 'exercise-library',
    title: 'Bibliothèque d’exercices',
    description: 'Exercices intégrés et possibilité d’en créer pour votre pratique.',
    longDescription:
      'Parcourez une base d’exercices, ajoutez les vôtres et personnalisez vos modèles selon votre matériel et vos préférences.',
    tier: 'free',
    category: 'musculation',
    bullets: ['Recherche rapide', 'Exercices personnalisés', 'Groupes musculaires'],
  },
  // —— Musculation (premium) ——
  {
    id: 'advanced-stats',
    title: 'Statistiques avancées',
    description: 'Graphiques détaillés par exercice, volume et fréquence d’entraînement.',
    longDescription:
      'Visualisez l’évolution de vos charges, votre volume hebdomadaire et vos tendances sur plusieurs semaines pour ajuster votre programme.',
    tier: 'premium',
    category: 'musculation',
    bullets: ['Courbes par exercice', 'Volume et fréquence', 'Comparaisons sur la durée'],
  },
  {
    id: 'overload-unlimited',
    title: 'Ajustement illimité des charges',
    description: 'Suggestions de progression sans limite quotidienne.',
    longDescription:
      'Premium supprime la limite d’une suggestion par jour : adaptez vos charges séance après séance avec un coaching de surcharge intégré.',
    tier: 'premium',
    category: 'premium',
    bullets: ['Suggestions à chaque séance', 'Progression méthodique', 'Moins de stagnation'],
  },
  {
    id: 'history-unlimited',
    title: 'Historique illimité',
    description: 'Retrouvez toutes vos séances, sans limite de durée.',
    longDescription:
      'Consultez l’intégralité de votre parcours d’entraînement pour analyser les cycles passés et mesurer votre progression long terme.',
    tier: 'premium',
    category: 'premium',
    bullets: ['Archives complètes', 'Analyse multi-mois', 'Repères historiques'],
  },
  {
    id: 'templates-unlimited',
    title: 'Modèles de séance illimités',
    description: 'Créez autant de gabarits que nécessaire pour vos splits et phases.',
    longDescription:
      'Idéal si vous alternez plusieurs types de séances ou si vous programmez des cycles de préparation spécifiques.',
    tier: 'premium',
    category: 'premium',
    bullets: ['Splits multiples', 'Phases d’entraînement', 'Zéro plafond'],
  },
  {
    id: 'planning-unlimited',
    title: 'Programmes personnalisés illimités',
    description: 'Plusieurs programmes actifs pour structurer votre année sportive.',
    longDescription:
      'Passez d’un cycle force à un cycle hypertrophie sans sacrifier vos anciens programmes : tout reste accessible.',
    tier: 'premium',
    category: 'premium',
    bullets: ['Multi-programmes', 'Planification longue durée', 'Flexibilité totale'],
  },
  // —— Nutrition (gratuit) ——
  {
    id: 'nutrition-journal',
    title: 'Journal nutrition',
    description: 'Petit-déjeuner, déjeuner, dîner et collations — sans coaching en gratuit.',
    longDescription:
      'Notez vos repas au fil de la journée et visualisez votre bilan. Le journal est inclus dans l’offre gratuite ; les conseils personnalisés sont Premium.',
    tier: 'free',
    category: 'nutrition',
    bullets: ['Repas structurés', 'Aliments favoris', 'Suivi quotidien'],
    imageSrc: '/onboarding/diet.png',
  },
  {
    id: 'macros-tracking',
    title: 'Macros & calories',
    description: 'Protéines, glucides, lipides et apport calorique journalier.',
    longDescription:
      'Définissez vos objectifs nutritionnels et suivez votre progression repas après repas pour rester aligné avec votre objectif sportif.',
    tier: 'free',
    category: 'nutrition',
    bullets: ['Objectifs personnalisables', 'Bilan journalier', 'Vue par repas'],
    imageSrc: '/onboarding/diet.png',
  },
  {
    id: 'barcode-scan',
    title: 'Scan code-barres',
    description: 'Ajoutez des produits du commerce via Open Food Facts.',
    longDescription:
      'Scannez un code-barres, ajustez la portion et enregistrez l’aliment en quelques secondes pour un journal plus fidèle.',
    tier: 'free',
    category: 'nutrition',
    bullets: ['Base Open Food Facts', 'Portions ajustables', 'Aliments personnalisés'],
  },
  {
    id: 'nutrition-streak',
    title: 'Streak nutrition',
    description: 'Séries de jours consécutifs pour ancrer l’habitude alimentaire.',
    longDescription:
      'Le streak nutrition récompense la régularité du journal alimentaire, au même titre que le streak d’entraînement hebdomadaire.',
    tier: 'free',
    category: 'nutrition',
    bullets: ['Suivi de régularité', 'Visible sur le profil', 'Partageable avec vos amis'],
  },
  // —— Nutrition (premium) ——
  {
    id: 'nutrition-advice',
    title: 'Conseils nutrition personnalisés',
    description: 'Accompagnement nutrition intelligent, illimité en Premium.',
    longDescription:
      'Recevez des conseils adaptés à votre journal et vos objectifs pour ajuster vos apports sans repartir de zéro chaque semaine.',
    tier: 'premium',
    category: 'premium',
    bullets: ['Conseils contextuels', 'Illimité (Premium)', 'Aligné sur vos repas réels'],
  },
  // —— Objectifs ——
  {
    id: 'goals-basic',
    title: 'Objectif de poids',
    description: 'Fixez un poids cible et suivez votre progression au quotidien.',
    longDescription:
      'La version gratuite permet de définir un objectif et de suivre votre évolution. Premium ajoute une projection de date d’atteinte.',
    tier: 'free',
    category: 'objectifs',
    bullets: ['Poids cible', 'Suivi de progression', 'Sans date prévisionnelle (Gratuit)'],
    imageSrc: '/onboarding/goals.png',
  },
  {
    id: 'goal-projection',
    title: 'Projection de fin d’objectif',
    description: 'Estimation de la date d’atteinte selon votre rythme réel.',
    longDescription:
      'Premium calcule une trajectoire basée sur vos pesées et votre régularité pour visualiser quand vous pourriez atteindre votre objectif.',
    tier: 'premium',
    category: 'premium',
    bullets: ['Date prévisionnelle', 'Ajustement dynamique', 'Motivation long terme'],
    imageSrc: '/onboarding/goals.png',
  },
  {
    id: 'goal-coaching',
    title: 'Coach dynamique anti-stagnation',
    description: 'Alertes et pistes quand votre progression stagne.',
    longDescription:
      'Si votre poids ou vos performances plafonnent, RCoach Premium propose des axes d’ajustement pour relancer la progression.',
    tier: 'premium',
    category: 'premium',
    bullets: ['Détection de plateau', 'Pistes d’action', 'Accompagnement objectif poids'],
  },
  // —— Social & gamification ——
  {
    id: 'workout-streak',
    title: 'Streak d’entraînement',
    description: 'Série de semaines avec au moins une séance réalisée.',
    longDescription:
      'Le streak hebdomadaire mesure votre régularité en salle et s’affiche sur votre profil et celui de vos amis.',
    tier: 'free',
    category: 'social',
    bullets: ['Compteur de semaines', 'Profil et amis', 'Motivation continue'],
  },
  {
    id: 'badges',
    title: 'Médailles & accomplissements',
    description: 'Badges discipline, records, volume et streaks à débloquer.',
    longDescription:
      'Chaque palier franchi — nutrition, séances, PR, volume — débloque une médaille visible sur votre profil.',
    tier: 'free',
    category: 'social',
    bullets: ['16 médailles', 'Catégories variées', 'Catalogue consultable'],
  },
  {
    id: 'friends-motivation',
    title: 'Amis & encouragements',
    description: 'Suivez les streaks de vos proches et envoyez des motivations.',
    longDescription:
      'Ajoutez des amis, consultez leur activité récente et envoyez des emojis de motivation pour rester connectés à votre cercle sportif.',
    tier: 'free',
    category: 'social',
    bullets: ['Liste d’amis', 'Streaks partagés', 'Messages de motivation'],
  },
  // —— Plateforme ——
  {
    id: 'pwa-android',
    title: 'Web & Android installable',
    description: 'PWA accessible depuis le navigateur et installable sur Android.',
    longDescription:
      'Utilisez RCoach sur ordinateur ou installez l’application sur votre téléphone Android — un seul compte, les mêmes données.',
    tier: 'free',
    category: 'plateforme',
    bullets: ['Aucune installation obligatoire', 'Ajout à l’écran d’accueil', 'Interface en français'],
  },
  // —— Premium identité ——
  {
    id: 'pro-theme-badge',
    title: 'Thème Pro & badge avatar',
    description: 'Personnalisation visuelle Premium sur votre profil.',
    longDescription:
      'Débloquez le thème Pro sombre et affichez un badge distinctif sur votre avatar pour soutenir le projet.',
    tier: 'premium',
    category: 'premium',
    bullets: ['Thème Pro exclusif', 'Badge sur l’avatar', 'Soutien au développement'],
  },
  // —— Coach ——
  {
    id: 'coach-clients',
    title: 'Gestion clients',
    description: 'Vue d’ensemble de vos athlètes et de leur activité récente.',
    longDescription:
      'L’espace coach centralise la liste de vos clients, leurs streaks et leur dernière séance pour un suivi rapide.',
    tier: 'free',
    category: 'coach',
    bullets: ['Liste clients', 'Activité récente', 'Profils consultables'],
  },
  {
    id: 'coach-programs',
    title: 'Programmes coach',
    description: 'Création et assignation de programmes structurés.',
    longDescription:
      'Construisez des programmes d’entraînement et distribuez-les à vos athlètes depuis l’ERP coach.',
    tier: 'free',
    category: 'coach',
    bullets: ['Éditeur de programmes', 'Assignation clients', 'Bibliothèque partagée'],
  },
  {
    id: 'coach-analytics',
    title: 'Analytics coach',
    description: 'Indicateurs de suivi pour piloter votre activité.',
    longDescription:
      'Visualisez les métriques clés de votre portefeuille clients pour identifier qui a besoin d’un relance ou d’un ajustement.',
    tier: 'free',
    category: 'coach',
    bullets: ['Tableaux de bord', 'Tendances clients', 'Aide à la décision'],
  },
]

const catalogById = new Map(MARKETING_FEATURES_CATALOG.map((feature) => [feature.id, feature]))

export function getCatalogFeature(id: string): CatalogFeature | undefined {
  return catalogById.get(id)
}

export function getFeaturesByCategory(category: MarketingFeatureCategory): CatalogFeature[] {
  return MARKETING_FEATURES_CATALOG.filter((feature) => feature.category === category)
}

export function getFeaturesByTier(tier: MarketingFeatureTier): CatalogFeature[] {
  return MARKETING_FEATURES_CATALOG.filter((feature) => feature.tier === tier)
}

export function getFeaturesByIds(ids: string[]): CatalogFeature[] {
  return ids
    .map((id) => catalogById.get(id))
    .filter((feature): feature is CatalogFeature => feature != null)
}

export const MARKETING_CATEGORY_ORDER: MarketingFeatureCategory[] = [
  'musculation',
  'nutrition',
  'objectifs',
  'social',
  'plateforme',
  'premium',
  'coach',
]

/** IDs regroupés pour les pages thématiques */
export const PAGE_FEATURE_IDS = {
  home: [
    'workout-tracking',
    'nutrition-journal',
    'goals-basic',
    'friends-motivation',
    'badges',
    'overload-unlimited',
    'advanced-stats',
    'nutrition-advice',
  ],
  musculation: [
    'workout-tracking',
    'active-workout',
    'templates-limited',
    'planning-limited',
    'overload-limited',
    'history-limited',
    'pr-records',
    'exercise-library',
    'advanced-stats',
    'overload-unlimited',
    'history-unlimited',
    'templates-unlimited',
    'planning-unlimited',
  ],
  nutrition: [
    'nutrition-journal',
    'macros-tracking',
    'barcode-scan',
    'nutrition-streak',
    'nutrition-advice',
    'goals-basic',
    'goal-projection',
  ],
  coach: ['coach-clients', 'coach-programs', 'coach-analytics'],
  premium: [
    'overload-unlimited',
    'advanced-stats',
    'history-unlimited',
    'templates-unlimited',
    'planning-unlimited',
    'goal-projection',
    'goal-coaching',
    'nutrition-advice',
    'pro-theme-badge',
  ],
} as const

export const PAGE_FEATURE_GROUPS = {
  musculation: {
    free: [
      'workout-tracking',
      'active-workout',
      'templates-limited',
      'planning-limited',
      'overload-limited',
      'history-limited',
      'pr-records',
      'exercise-library',
    ],
    premium: [
      'advanced-stats',
      'overload-unlimited',
      'history-unlimited',
      'templates-unlimited',
      'planning-unlimited',
    ],
  },
  nutrition: {
    free: ['nutrition-journal', 'macros-tracking', 'barcode-scan', 'nutrition-streak', 'goals-basic'],
    premium: ['nutrition-advice', 'goal-projection', 'goal-coaching'],
  },
} as const
