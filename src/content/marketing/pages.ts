export type MarketingFeature = {
  id: string
  title: string
  description: string
  imageSrc?: string
}

export type MarketingFaqItem = {
  question: string
  answer: string
}

export type MarketingPageContent = {
  path: string
  title: string
  metaDescription: string
  eyebrow: string
  badge?: string
  headline: string
  headlineHighlight?: string
  headlineAfter?: string
  description: string
  features?: MarketingFeature[]
  faq?: MarketingFaqItem[]
  ctaLabel?: string
}

export const HOME_PAGE: MarketingPageContent = {
  path: '/',
  title: 'Application musculation et nutrition',
  metaDescription:
    'RCoach réunit séances de musculation, suivi nutrition, macros, objectifs et communauté. L’app sportive tout-en-un pour progresser sereinement.',
  eyebrow: 'Sport & nutrition',
  badge: 'Nouveau • Conseils nutrition Premium dans l’app',
  headline: 'L’app sport & nutrition ',
  headlineHighlight: 'qui transforme',
  headlineAfter: ' vraiment.',
  description:
    'Suivi d’entraînement, nutrition et objectifs réunis dans une seule application. Planifiez vos séances, notez vos repas et progressez au quotidien avec RCoach.',
  ctaLabel: 'Démarrer gratuitement',
  features: [
    {
      id: 'sessions',
      title: 'Séances guidées',
      description: 'Chronomètre, séries, repos et records personnels en temps réel.',
      imageSrc: '/onboarding/sessions.png',
    },
    {
      id: 'diet',
      title: 'Diète & macros',
      description: 'Journal alimentaire, scan code-barres et suivi des apports quotidiens.',
      imageSrc: '/onboarding/diet.png',
    },
    {
      id: 'goals',
      title: 'Objectifs',
      description: 'Poids cible, streaks et médailles pour rester constant.',
      imageSrc: '/onboarding/goals.png',
    },
    {
      id: 'friends',
      title: 'Communauté',
      description: 'Streaks entre amis et encouragements pour garder la motivation.',
    },
    {
      id: 'badges',
      title: 'Médailles',
      description: 'Débloquez des accomplissements sur la discipline, le volume et les PR.',
    },
    {
      id: 'coach',
      title: 'Espace coach',
      description: 'Pour les professionnels qui suivent leurs athlètes au quotidien.',
    },
  ],
  faq: [
    {
      question: 'RCoach est-il gratuit ?',
      answer:
        'Oui, l’essentiel est gratuit : séances, nutrition, streaks, médailles et suivi de base. Premium débloque stats avancées, historique illimité et coaching nutrition.',
    },
    {
      question: 'Quelle différence entre gratuit et Premium ?',
      answer:
        'Le gratuit couvre le suivi quotidien avec quelques limites (historique 4 semaines, 6 modèles, 1 programme). Premium lève ces plafonds et ajoute stats, projection objectif et conseils nutrition.',
    },
    {
      question: 'RCoach convient-il aux débutants ?',
      answer:
        'Oui. L’interface guide vos séances et votre alimentation sans jargon inutile, avec des objectifs progressifs.',
    },
    {
      question: 'Puis-je utiliser RCoach sur Android ?',
      answer:
        'Oui, RCoach est une PWA installable sur Android et accessible depuis le navigateur sur ordinateur.',
    },
  ],
}

export const FEATURES_PAGE: MarketingPageContent = {
  path: '/fonctionnalites',
  title: 'Fonctionnalités',
  metaDescription:
    'Découvrez toutes les fonctionnalités RCoach : planning musculation, journal nutrition, stats, badges, amis et espace coach.',
  eyebrow: 'Tout-en-un',
  headline: 'Une app complète pour votre progression',
  description:
    'De la salle à l’assiette, RCoach centralise ce dont vous avez besoin pour performer et rester régulier — en gratuit ou en Premium.',
  faq: [
    {
      question: 'Quelles fonctionnalités sont gratuites ?',
      answer:
        'Séances, journal nutrition, macros, scan code-barres, streaks, médailles, amis, 6 modèles de séance, 1 programme actif, historique 4 semaines et 1 suggestion de charge par jour.',
    },
    {
      question: 'Que débloque Premium ?',
      answer:
        'Historique illimité, stats avancées, modèles et programmes sans limite, suggestions de charge illimitées, projection objectif poids, coach anti-stagnation, conseils nutrition et thème Pro.',
    },
    {
      question: 'RCoach convient-il aux débutants ?',
      answer:
        'Oui. L’interface guide vos séances et votre alimentation sans jargon inutile, avec des objectifs progressifs.',
    },
    {
      question: 'Puis-je utiliser RCoach sur Android ?',
      answer:
        'Oui, RCoach est une PWA installable sur Android et accessible depuis le navigateur sur ordinateur.',
    },
  ],
}

export const MUSCULATION_PAGE: MarketingPageContent = {
  path: '/application-musculation',
  title: 'Application musculation',
  metaDescription:
    'Application de suivi musculation : programmes, séries, charges, records personnels, volume et statistiques d’entraînement.',
  eyebrow: 'Musculation',
  headline: 'Votre carnet d’entraînement intelligent',
  description:
    'Planifiez, enregistrez et analysez chaque séance. RCoach suit vos séries, votre volume et vos records pour progresser méthodiquement.',
  features: [
    {
      id: 'planning',
      title: 'Planning hebdomadaire',
      description: 'Organisez vos séances et visualisez votre semaine d’entraînement.',
    },
    {
      id: 'active',
      title: 'Séance active',
      description: 'Timer de repos, saisie des charges et validation des séries en direct.',
    },
    {
      id: 'pr',
      title: 'Records personnels',
      description: 'Détectez automatiquement vos nouveaux PR et célébrez vos progrès.',
    },
    {
      id: 'stats',
      title: 'Statistiques',
      description: 'Volume, fréquence et évolution par exercice sur plusieurs semaines.',
    },
  ],
  faq: [
    {
      question: 'Puis-je créer mes propres exercices ?',
      answer: 'Oui, vous pouvez personnaliser votre bibliothèque d’exercices et vos modèles de séance.',
    },
    {
      question: 'RCoach gère-t-il les supersets et circuits ?',
      answer: 'Oui, les séances actives supportent les enchaînements et le repos entre séries.',
    },
    {
      question: 'Combien de modèles de séance en gratuit ?',
      answer: 'La formule gratuite inclut 6 modèles actifs. Premium permet d’en créer sans limite.',
    },
    {
      question: 'Les stats avancées sont-elles incluses ?',
      answer: 'Les graphiques détaillés par exercice et le volume long terme sont réservés à Premium.',
    },
  ],
}

export const NUTRITION_PAGE: MarketingPageContent = {
  path: '/application-nutrition',
  title: 'Application nutrition et macros',
  metaDescription:
    'Application nutrition sportive : suivi des calories, macros, scan code-barres, journal alimentaire et conseils pour atteindre vos objectifs.',
  eyebrow: 'Nutrition',
  headline: 'Mangez en accord avec vos objectifs',
  description:
    'Suivez vos repas, vos macros et votre hydratation. RCoach simplifie le journal alimentaire au quotidien.',
  features: [
    {
      id: 'journal',
      title: 'Journal alimentaire',
      description: 'Petit-déjeuner, déjeuner, dîner et collations en un clin d’œil.',
    },
    {
      id: 'macros',
      title: 'Macros & calories',
      description: 'Protéines, glucides, lipides et apport calorique journalier.',
    },
    {
      id: 'scan',
      title: 'Scan code-barres',
      description: 'Ajoutez des aliments rapidement via la base Open Food Facts.',
    },
    {
      id: 'streak',
      title: 'Streak nutrition',
      description: 'Gardez le rythme grâce aux séries de jours consécutifs.',
    },
  ],
  faq: [
    {
      question: 'RCoach calcule-t-il automatiquement mes macros ?',
      answer:
        'Vous définissez vos objectifs et RCoach agrège les apports de chaque repas pour suivre votre progression.',
    },
    {
      question: 'La base alimentaire est-elle complète ?',
      answer:
        'RCoach s’appuie sur Open Food Facts et permet d’ajouter vos aliments personnalisés.',
    },
    {
      question: 'Les conseils nutrition sont-ils inclus ?',
      answer:
        'Le journal et les macros sont gratuits. Les conseils nutrition personnalisés illimités sont une fonctionnalité Premium.',
    },
    {
      question: 'Puis-je scanner des produits du commerce ?',
      answer: 'Oui, le scan code-barres est inclus dans l’offre gratuite via Open Food Facts.',
    },
  ],
}

export const COACH_PAGE: MarketingPageContent = {
  path: '/pour-les-coachs',
  title: 'Solution pour coachs sportifs',
  metaDescription:
    'RCoach pour les coachs : suivez vos clients, programmes, analytics et accompagnement nutrition depuis un espace dédié.',
  eyebrow: 'Professionnels',
  headline: 'Pilotez vos athlètes depuis un seul outil',
  description:
    'L’espace coach RCoach centralise le suivi de vos clients, leurs séances et leur progression pour un accompagnement plus efficace.',
  features: [
    {
      id: 'clients',
      title: 'Gestion clients',
      description: 'Vue d’ensemble de vos athlètes et de leur activité récente.',
    },
    {
      id: 'programs',
      title: 'Programmes',
      description: 'Créez et assignez des programmes d’entraînement structurés.',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Indicateurs de suivi pour ajuster l’accompagnement.',
    },
  ],
  faq: [
    {
      question: 'Comment accéder à l’espace coach ?',
      answer:
        'Créez un compte puis contactez le support pour activer le rôle coach sur votre profil.',
    },
    {
      question: 'Puis-je suivre la nutrition de mes clients ?',
      answer:
        'Vous consultez l’activité et les séances de vos athlètes. Le détail nutrition dépend des données qu’ils renseignent dans leur app.',
    },
    {
      question: 'L’espace coach est-il payant ?',
      answer:
        'Contactez le support pour connaître les conditions d’accès à l’ERP coach selon votre activité.',
    },
  ],
}

export const PRICING_PAGE: MarketingPageContent = {
  path: '/tarifs',
  title: 'Tarifs Premium',
  metaDescription:
    'Tarifs RCoach Premium : essai gratuit, abonnement mensuel ou annuel. Comparez Gratuit et Premium pour la musculation et la nutrition.',
  eyebrow: 'Tarifs',
  headline: 'Choisissez la formule adaptée',
  description:
    'Commencez gratuitement. Passez Premium quand vous voulez débloquer stats avancées, historique illimité et coaching nutrition.',
  faq: [
    {
      question: 'Y a-t-il un essai Premium ?',
      answer: 'Oui, jusqu’à 14 jours d’essai selon l’offre en cours au moment de l’abonnement.',
    },
    {
      question: 'Puis-je annuler à tout moment ?',
      answer: 'Oui, la gestion de l’abonnement se fait depuis votre profil ou la plateforme de paiement.',
    },
    {
      question: 'Que garde-t-on en restant gratuit ?',
      answer:
        'Séances, journal nutrition, macros, scan, streaks, médailles, amis — seules les limites (historique, modèles, programmes, conseils) restent en place.',
    },
    {
      question: 'Premium vaut-il le coup si je débute ?',
      answer:
        'Commencez gratuitement. Premium devient pertinent quand vous voulez un historique long, des stats détaillées et un accompagnement nutrition.',
    },
  ],
}

export const BLOG_INDEX_PAGE = {
  path: '/blog',
  title: 'Blog musculation & nutrition',
  metaDescription:
    'Conseils musculation, nutrition sportive, macros et entraînement : le blog RCoach pour progresser avec méthode.',
  eyebrow: 'Blog',
  headline: 'Conseils pour progresser',
  description:
    'Guides pratiques sur la musculation, la nutrition et la régularité pour tirer le meilleur de RCoach.',
}
