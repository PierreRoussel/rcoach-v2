import type { NutritionHintMetrics } from '@/lib/nutrition/nutrition-hint-metrics'
import { toDateKey } from '@/lib/nutrition/dates'

export type NutritionHintRule = {
  id: string
  priority: number
  when: (metrics: NutritionHintMetrics) => boolean
  message: (metrics: NutritionHintMetrics) => string
}

export const NUTRITION_HINT_FALLBACK =
  'Continue à journaliser tes repas : plus tu notes, plus les conseils deviendront précis et utiles.'

/** Conseils invitant surtout à journaliser — l'ampoule reste masquée pour ceux-ci. */
export const NUTRITION_HINT_META_IDS = [
  'no-entries',
  'very-few-entries',
  'single-day-logged',
  'anchor-day-empty',
  'fallback',
  'general-encouragement',
  'keep-logging',
] as const

export type NutritionHintMetaId = (typeof NUTRITION_HINT_META_IDS)[number]

export function isActionableNutritionHint(hintId: string) {
  return !(NUTRITION_HINT_META_IDS as readonly string[]).includes(hintId)
}

/** Part minimale de l'objectif journalier avant d'afficher un conseil sur aujourd'hui. */
export const ANCHOR_DAY_MIN_CALORIES_RATIO = 0.35

export function getAnchorDayMinCaloriesForHint(dailyCalorieTarget: number) {
  return Math.max(400, Math.round(dailyCalorieTarget * ANCHOR_DAY_MIN_CALORIES_RATIO))
}

export function hasEnoughAnchorDayCaloriesForHint(metrics: NutritionHintMetrics) {
  if (metrics.anchorDate !== toDateKey(new Date())) {
    return true
  }

  const anchorDay = metrics.days.find((day) => day.date === metrics.anchorDate)
  const anchorCalories = anchorDay?.entryCount ? anchorDay.totals.calories : 0

  return anchorCalories >= getAnchorDayMinCaloriesForHint(metrics.dailyCalorieTarget)
}

export function isNutritionHintVisible(metrics: NutritionHintMetrics, hintId: string) {
  if (!isActionableNutritionHint(hintId)) {
    return false
  }

  if (hintId === 'calories-very-low' || hintId === 'calories-low') {
    return true
  }

  return hasEnoughAnchorDayCaloriesForHint(metrics)
}

function isAnchorDayLogged(metrics: NutritionHintMetrics) {
  return metrics.days.some(
    (day) => day.date === metrics.anchorDate && day.entryCount > 0,
  )
}

function getPreviousLoggedDays(metrics: NutritionHintMetrics) {
  return metrics.days.filter(
    (day) => day.date !== metrics.anchorDate && day.entryCount > 0,
  )
}

function getPreviousDaysAverageCalories(metrics: NutritionHintMetrics) {
  const previous = getPreviousLoggedDays(metrics)
  if (previous.length === 0) {
    return null
  }

  const total = previous.reduce((sum, day) => sum + day.totals.calories, 0)
  return total / previous.length
}

function hasChronicLowCalories(metrics: NutritionHintMetrics, maxRatio: number) {
  const previous = getPreviousLoggedDays(metrics)
  if (previous.length < 2) {
    return false
  }

  const average = getPreviousDaysAverageCalories(metrics)
  if (average == null) {
    return false
  }

  return average / metrics.dailyCalorieTarget < maxRatio
}

const rules: NutritionHintRule[] = [
  {
    id: 'no-entries',
    priority: 100,
    when: (m) => m.totalEntries === 0,
    message: () =>
      'Commence par noter au moins un repas sur les prochains jours pour recevoir un conseil personnalisé.',
  },
  {
    id: 'very-few-entries',
    priority: 95,
    when: (m) => m.totalEntries > 0 && m.totalEntries < 3,
    message: () =>
      "Peu de repas sur 3 jours. Note encore un repas ou deux pour affiner l'analyse.",
  },
  {
    id: 'single-day-logged',
    priority: 92,
    when: (m) => m.daysLogged === 1 && m.totalEntries >= 3,
    message: () =>
      "Tu n'as journalisé qu'un seul jour sur trois. Essaie de noter tes repas sur plusieurs jours pour mieux voir tes habitudes.",
  },
  {
    id: 'protein-very-low',
    priority: 90,
    when: (m) => m.primaryVsTarget.proteinPct < 0.6 && m.primaryDaily.proteinG > 0,
    message: (m) =>
      `Tes protéines sont très basses (~${Math.round(m.primaryDaily.proteinG)} g${isAnchorDayLogged(m) ? '' : '/j en moyenne'}). Vise ${m.macroTargets.proteinG} g : ajoute œufs, légumineuses, poisson ou viande maigre à un repas.`,
  },
  {
    id: 'protein-low-per-kg',
    priority: 88,
    when: (m) =>
      m.proteinGramsPerKgTarget != null &&
      m.primaryDaily.proteinG < m.proteinGramsPerKgTarget.min * 0.85,
    message: (m) =>
      `Avec ton poids, vise environ ${Math.round(m.proteinGramsPerKgTarget!.min)}–${Math.round(m.proteinGramsPerKgTarget!.max)} g de protéines par jour. Tu es en dessous : pense à en ajouter à chaque repas principal.`,
  },
  {
    id: 'protein-low',
    priority: 86,
    when: (m) => m.primaryVsTarget.proteinPct >= 0.6 && m.primaryVsTarget.proteinPct < 0.85,
    message: (m) =>
      `Tu es un peu bas en protéines (${Math.round(m.primaryDaily.proteinG)} g${isAnchorDayLogged(m) ? '' : '/j'} vs ${m.macroTargets.proteinG} g visés). Un yaourt grec, des lentilles ou du tofu peuvent combler l'écart facilement.`,
  },
  {
    id: 'protein-high',
    priority: 72,
    when: (m) =>
      m.primaryVsTarget.proteinPct > 1.25 ||
      (m.proteinGramsPerKgTarget != null &&
        m.primaryDaily.proteinG > m.proteinGramsPerKgTarget.max * 1.15),
    message: (m) =>
      `Tes apports protéiques sont élevés (~${Math.round(m.primaryDaily.proteinG)} g${isAnchorDayLogged(m) ? '' : '/j'}). Assure-toi de bien t'hydrater et de garder assez de glucides et lipides pour l'énergie.`,
  },
  {
    id: 'protein-unbalanced-low-carbs',
    priority: 70,
    when: (m) => m.primaryVsTarget.proteinPct > 1.1 && m.primaryVsTarget.carbsPct < 0.75,
    message: () =>
      "Tu manges beaucoup de protéines mais peu de glucides. Pour l'entraînement et la récup, ajoute riz, patate douce ou fruits autour de tes séances.",
  },
  {
    id: 'protein-good',
    priority: 12,
    when: (m) =>
      m.avgVsTarget.proteinPct >= 0.9 &&
      m.avgVsTarget.proteinPct <= 1.15 &&
      m.daysLogged >= 2,
    message: (m) =>
      `Belle régularité côté protéines (~${Math.round(m.avgDaily.proteinG)} g/j). Continue sur cette lancée pour soutenir ta masse musculaire.`,
  },
  {
    id: 'protein-even-distribution',
    priority: 54,
    when: (m) =>
      m.avgVsTarget.proteinPct < 0.85 &&
      m.days.some((d) => d.entryCount > 0 && d.totals.proteinG < 15),
    message: () =>
      'Certaines journées manquent de protéines au global. Répartis-les sur petit-déjeuner, déjeuner et dîner plutôt que tout au même repas.',
  },
  {
    id: 'salt-very-high',
    priority: 89,
    when: (m) => m.hasSaltData && m.avgDaily.saltG != null && m.avgDaily.saltG > 8,
    message: (m) =>
      `Ton sel moyen est très élevé (~${m.avgDaily.saltG} g/j, recommandation ~5–6 g). Réduis charcuterie, plats préparés et sauces industrielles.`,
  },
  {
    id: 'salt-high',
    priority: 84,
    when: (m) =>
      m.hasSaltData &&
      m.avgDaily.saltG != null &&
      m.avgDaily.saltG > 6 &&
      m.avgDaily.saltG <= 8,
    message: (m) =>
      `Tu dépasses un peu la cible de sel (~${m.avgDaily.saltG} g/j). Assaisonne avec herbes, épices et citron plutôt qu'avec du sel ajouté.`,
  },
  {
    id: 'salt-moderate-high',
    priority: 78,
    when: (m) =>
      m.hasSaltData &&
      m.avgDaily.saltG != null &&
      m.avgDaily.saltG > 5 &&
      m.avgDaily.saltG <= 6,
    message: () =>
      'Tu es proche du plafond de sel recommandé. Surveille les aliments transformés, souvent très salés même sans goût très prononcé.',
  },
  {
    id: 'salt-low-hydration',
    priority: 55,
    when: (m) => m.hasSaltData && m.avgDaily.saltG != null && m.avgDaily.saltG < 2,
    message: () =>
      'Ton sel journalier semble très bas — pense à une hydratation régulière et à des aliments naturellement minéraux (fruits, légumes, produits laitiers).',
  },
  {
    id: 'salt-balanced',
    priority: 11,
    when: (m) =>
      m.hasSaltData &&
      m.avgDaily.saltG != null &&
      m.avgDaily.saltG >= 3 &&
      m.avgDaily.saltG <= 5,
    message: () =>
      'Ton apport en sel reste dans une zone raisonnable. Continue à privilégier les repas faits maison quand tu peux.',
  },
  {
    id: 'sugar-very-high',
    priority: 87,
    when: (m) => m.sugarEnergyPct != null && m.sugarEnergyPct > 0.15,
    message: () =>
      'Tes sucres représentent une part élevée de tes calories. Limite sodas, jus, viennoiseries et desserts quotidiens.',
  },
  {
    id: 'sugar-high',
    priority: 82,
    when: (m) => m.sugarEnergyPct != null && m.sugarEnergyPct > 0.1 && m.sugarEnergyPct <= 0.15,
    message: () =>
      "Tu dépasses l'idéal de ~10 % de calories en sucres. Remplace une collation sucrée par un fruit ou un yaourt nature.",
  },
  {
    id: 'sugar-moderate',
    priority: 68,
    when: (m) => m.sugarEnergyPct != null && m.sugarEnergyPct > 0.08 && m.sugarEnergyPct <= 0.1,
    message: () =>
      "Tes sucres frôlent le seuil recommandé. Vérifie les boissons et encas du goûter : c'est souvent là que ça s'accumule.",
  },
  {
    id: 'sugar-low',
    priority: 10,
    when: (m) => m.sugarEnergyPct != null && m.sugarEnergyPct <= 0.08 && m.daysLogged >= 2,
    message: () =>
      'Bonne maîtrise des sucres sur ces derniers jours. Les fruits entiers restent un excellent choix pour le goûter.',
  },
  {
    id: 'sat-fat-very-high',
    priority: 85,
    when: (m) => m.saturatedFatEnergyPct != null && m.saturatedFatEnergyPct > 0.14,
    message: () =>
      "Tes acides gras saturés sont élevés. Réduis fromages gras, fritures et produits très gras au profit d'huile d'olive et poissons gras.",
  },
  {
    id: 'sat-fat-high',
    priority: 80,
    when: (m) =>
      m.saturatedFatEnergyPct != null &&
      m.saturatedFatEnergyPct > 0.1 &&
      m.saturatedFatEnergyPct <= 0.14,
    message: () =>
      'Tu dépasses ~10 % de calories en graisses saturées. Alterne avec volaille, légumineuses et produits laitiers allégés.',
  },
  {
    id: 'sat-fat-balanced',
    priority: 10,
    when: (m) =>
      m.saturatedFatEnergyPct != null &&
      m.saturatedFatEnergyPct <= 0.1 &&
      m.daysLogged >= 2,
    message: () =>
      'Tes graisses saturées restent bien maîtrisées. Continue à varier tes sources de lipides.',
  },
  {
    id: 'carbs-very-low',
    priority: 83,
    when: (m) => m.primaryVsTarget.carbsPct < 0.65 && m.primaryDaily.calories > 800,
    message: (m) =>
      `Tes glucides sont bas (~${Math.round(m.primaryDaily.carbsG)} g${isAnchorDayLogged(m) ? '' : '/j'}). Sauf régime spécifique, ajoute céréales complètes ou légumes féculents pour l'énergie.`,
  },
  {
    id: 'carbs-low',
    priority: 76,
    when: (m) => m.primaryVsTarget.carbsPct >= 0.65 && m.primaryVsTarget.carbsPct < 0.85,
    message: (m) =>
      `Tu es un peu bas en glucides (${Math.round(m.primaryDaily.carbsG)} g${isAnchorDayLogged(m) ? '' : '/j'} vs ${m.macroTargets.carbsG} g). Un repas avec féculents complets peut rééquilibrer.`,
  },
  {
    id: 'carbs-high',
    priority: 74,
    when: (m) => m.primaryVsTarget.carbsPct > 1.2,
    message: (m) =>
      `Tes glucides dépassent ta cible (~${Math.round(m.primaryDaily.carbsG)} g${isAnchorDayLogged(m) ? '' : '/j'}). Vérifie les portions de pain, pâtes et encas sucrés.`,
  },
  {
    id: 'carbs-protein-low-combo',
    priority: 77,
    when: (m) => m.primaryVsTarget.carbsPct > 1.15 && m.primaryVsTarget.proteinPct < 0.85,
    message: () =>
      "Beaucoup de glucides, peu de protéines : équilibre en ajoutant une source protéinée à chaque repas plutôt qu'en grignotant.",
  },
  {
    id: 'fat-very-low',
    priority: 75,
    when: (m) => m.primaryVsTarget.fatPct < 0.65 && m.primaryDaily.calories > 800,
    message: () =>
      "Tes lipides sont bas. Un filet d'huile, des oléagineux ou de l'avocat t'aideront à absorber les vitamines et rester rassasié.",
  },
  {
    id: 'fat-high',
    priority: 73,
    when: (m) => m.primaryVsTarget.fatPct > 1.25,
    message: (m) =>
      `Tes lipides dépassent la cible (~${Math.round(m.primaryDaily.fatG)} g${isAnchorDayLogged(m) ? '' : '/j'}). Surveille fromages, sauces et cuissons très grasses.`,
  },
  {
    id: 'fat-low',
    priority: 65,
    when: (m) => m.primaryVsTarget.fatPct >= 0.65 && m.primaryVsTarget.fatPct < 0.85,
    message: () =>
      'Tu es légèrement bas en lipides. De bons gras (poisson, noix, huile de colza) améliorent satiété et équilibre hormonal.',
  },
  {
    id: 'calories-very-low',
    priority: 91,
    when: (m) => hasChronicLowCalories(m, 0.7),
    message: (m) => {
      const average = Math.round(getPreviousDaysAverageCalories(m)!)
      return `Tes jours précédents sont bien en dessous de ton objectif (~${average} kcal/j vs ${m.dailyCalorieTarget}). Assure-toi de manger assez pour récupérer et performer.`
    },
  },
  {
    id: 'calories-low',
    priority: 81,
    when: (m) => hasChronicLowCalories(m, 0.85) && !hasChronicLowCalories(m, 0.7),
    message: (m) => {
      const average = Math.round(getPreviousDaysAverageCalories(m)!)
      return `Tes jours précédents sont sous ta cible calorique (~${average} kcal/j vs ${m.dailyCalorieTarget}). Un encas nutritif en plus peut aider sans forcer.`
    },
  },
  {
    id: 'calories-high',
    priority: 79,
    when: (m) =>
      m.primaryVsTarget.caloriesPct > 1.15 &&
      (m.daysLogged >= 2 || isAnchorDayLogged(m)),
    message: (m) =>
      `Tu dépasses ton objectif (~${Math.round(m.primaryDaily.calories)} kcal${isAnchorDayLogged(m) ? '' : '/j'}). Repère les grignotages ou boissons caloriques faciles à réduire.`,
  },
  {
    id: 'calories-very-high',
    priority: 85,
    when: (m) =>
      m.primaryVsTarget.caloriesPct > 1.3 &&
      (m.daysLogged >= 2 || isAnchorDayLogged(m)),
    message: (m) =>
      `Excédent calorique marqué (~${Math.round(m.primaryDaily.calories)} kcal${isAnchorDayLogged(m) ? '' : '/j'}). Priorise les aliments rassasiants : légumes, protéines maigres, eau.`,
  },
  {
    id: 'calories-balanced',
    priority: 13,
    when: (m) =>
      m.primaryVsTarget.caloriesPct >= 0.9 &&
      m.primaryVsTarget.caloriesPct <= 1.1 &&
      (m.daysLogged >= 2 || isAnchorDayLogged(m)),
    message: () =>
      'Tes calories moyennes collent bien à ton objectif. Bravo pour la régularité du journal.',
  },
  {
    id: 'breakfast-skipped-often',
    priority: 79,
    when: (m) => m.daysWithoutBreakfast >= 2 && m.daysLogged >= 2,
    message: () =>
      'Tu sautes souvent le petit-déjeuner. Un repas le matin (même léger) peut stabiliser ta faim et ton énergie dans la journée.',
  },
  {
    id: 'breakfast-skipped-once',
    priority: 58,
    when: (m) => m.daysWithoutBreakfast === 1 && m.daysLogged >= 2,
    message: () =>
      'Un jour sans petit-déjeuner sur trois : prépare quelque chose de simple la veille (yaourt, flocons, fruit) pour faciliter le geste.',
  },
  {
    id: 'snack-heavy',
    priority: 67,
    when: (m) => m.daysSnackHeavy >= 2,
    message: () =>
      "Le goûter pèse lourd dans tes calories certains jours. Essaie de le rendre plus protéiné (fromage blanc, poignée d'amandes) pour tenir jusqu'au dîner.",
  },
  {
    id: 'snack-heavy-once',
    priority: 52,
    when: (m) => m.daysSnackHeavy === 1 && m.daysLogged >= 2,
    message: () =>
      "Un jour, le goûter représente une grosse part de tes calories. Planifie-le comme un vrai mini-repas plutôt qu'une série de grignotages.",
  },
  {
    id: 'dinner-heavy',
    priority: 64,
    when: (m) => m.daysDinnerHeavy >= 2,
    message: () =>
      'Tu concentres beaucoup de calories au dîner. Répartir un peu plus sur le déjeuner peut améliorer digestion et sommeil.',
  },
  {
    id: 'dinner-heavy-once',
    priority: 50,
    when: (m) => m.daysDinnerHeavy === 1 && m.daysLogged >= 2,
    message: () =>
      'Un dîner très copieux récemment : un déjeuner un peu plus consistant le lendemain peut rééquilibrer sans te priver.',
  },
  {
    id: 'lunch-missing',
    priority: 62,
    when: (m) =>
      m.days.filter((d) => d.entryCount > 0 && d.mealsMissing.includes('lunch')).length >= 2,
    message: () =>
      "Tu notes peu ou pas de déjeuner. C'est souvent le repas clé pour éviter la fringale de l'après-midi.",
  },
  {
    id: 'unbalanced-meals',
    priority: 60,
    when: (m) =>
      m.days.filter((d) => d.entryCount > 0 && d.mealsWithEntries.length <= 2).length >= 2,
    message: () =>
      "Plusieurs jours avec seulement 1–2 repas notés. Structurer 3 repas + éventuel goûter aide à l'équilibre énergétique.",
  },
  {
    id: 'mostly-quick-entries',
    priority: 71,
    when: (m) => m.quickEntryRatio >= 0.6 && m.totalEntries >= 4,
    message: () =>
      "Beaucoup d'ajouts rapides sans fiche aliment. Cherche tes aliments habituels pour des infos plus complètes (sel, sucres, AG saturés).",
  },
  {
    id: 'some-quick-entries',
    priority: 48,
    when: (m) => m.quickEntryRatio >= 0.35 && m.quickEntryRatio < 0.6,
    message: () =>
      "Tu utilises souvent l'ajout rapide. Quand tu as le temps, lie tes entrées à un aliment référencé pour de meilleurs conseils.",
  },
  {
    id: 'no-salt-data',
    priority: 45,
    when: (m) => !m.hasSaltData && m.totalEntries >= 5 && m.quickEntryRatio > 0.3,
    message: () =>
      "Sans aliments référencés, on ne peut pas estimer le sel. Ajoute des produits du catalogue pour des conseils sur l'hydratation et le sodium.",
  },
  {
    id: 'logging-streak-good',
    priority: 14,
    when: (m) => m.daysLogged === 3 && m.totalEntries >= 6,
    message: () =>
      "Super régularité : trois jours journalisés d'affilée. C'est la base pour ajuster finement ton alimentation.",
  },
  {
    id: 'logging-improving',
    priority: 15,
    when: (m) => m.daysLogged === 2 && m.totalEntries >= 4,
    message: () =>
      'Deux jours bien remplis sur trois — continue comme ça pour affiner tes objectifs.',
  },
  {
    id: 'macros-balanced',
    priority: 16,
    when: (m) =>
      m.daysLogged >= 2 &&
      m.avgVsTarget.proteinPct >= 0.85 &&
      m.avgVsTarget.proteinPct <= 1.15 &&
      m.avgVsTarget.carbsPct >= 0.85 &&
      m.avgVsTarget.carbsPct <= 1.15 &&
      m.avgVsTarget.fatPct >= 0.85 &&
      m.avgVsTarget.fatPct <= 1.15,
    message: () =>
      'Tes macros sont bien équilibrées sur la période. Continue à varier les sources pour couvrir vitamines et minéraux.',
  },
  {
    id: 'quality-balanced',
    priority: 17,
    when: (m) =>
      m.daysLogged >= 2 &&
      m.sugarEnergyPct != null &&
      m.sugarEnergyPct <= 0.1 &&
      m.saturatedFatEnergyPct != null &&
      m.saturatedFatEnergyPct <= 0.1 &&
      m.hasSaltData &&
      m.avgDaily.saltG != null &&
      m.avgDaily.saltG <= 6,
    message: () =>
      'Profil nutritionnel solide : sucres, graisses saturées et sel sous contrôle. Garde cette dynamique.',
  },
  {
    id: 'protein-carbs-balance-good',
    priority: 18,
    when: (m) =>
      m.proteinPerKcal >= 0.06 &&
      m.carbsPerKcal >= 0.08 &&
      m.primaryVsTarget.caloriesPct >= 0.85 &&
      m.primaryVsTarget.caloriesPct <= 1.15,
    message: () =>
      "Bon ratio protéines/glucides pour l'énergie et la récupération. Tu es sur une voie cohérente avec ton entraînement.",
  },
  {
    id: 'hydration-reminder-salt-ok',
    priority: 19,
    when: (m) =>
      m.hasSaltData &&
      m.avgDaily.saltG != null &&
      m.avgDaily.saltG >= 4 &&
      m.avgDaily.saltG <= 6 &&
      m.avgDaily.calories >= m.dailyCalorieTarget * 0.85,
    message: () =>
      "Profil sel correct — pense à boire régulièrement, surtout les jours d'entraînement ou de chaleur.",
  },
  {
    id: 'weekend-vs-weekday-gap',
    priority: 47,
    when: (m) => {
      const logged = m.days.filter((d) => d.entryCount > 0)
      if (logged.length < 2) {
        return false
      }

      const maxKcal = Math.max(...logged.map((d) => d.totals.calories))
      const minKcal = Math.min(...logged.map((d) => d.totals.calories))
      return maxKcal > 0 && minKcal / maxKcal < 0.55
    },
    message: () =>
      'Gros écart entre tes journées les plus légères et les plus copieuses. Viser une régularité modérée aide à stabiliser énergie et progression.',
  },
  {
    id: 'anchor-day-empty',
    priority: 93,
    when: (m) => {
      const anchorDay = m.days.find((d) => d.date === m.anchorDate)
      return anchorDay != null && anchorDay.entryCount === 0 && m.totalEntries > 0
    },
    message: () =>
      "Aujourd'hui n'est pas encore journalisé. Note tes repas pour que le conseil reflète aussi ta journée en cours.",
  },
  {
    id: 'keep-logging',
    priority: 8,
    when: (m) => m.totalEntries >= 3 && !m.insufficientData,
    message: () =>
      'Tu construis une bonne habitude de journal. Chaque repas noté rend tes statistiques plus fiables.',
  },
  {
    id: 'general-encouragement',
    priority: 5,
    when: (m) => m.totalEntries >= 1,
    message: () =>
      "Chaque entrée compte. Note tes repas avec honnêteté : c'est le meilleur outil pour progresser sans restriction extrême.",
  },
]

export function pickNutritionHint(metrics: NutritionHintMetrics) {
  const matches = rules.filter((rule) => rule.when(metrics))

  if (matches.length === 0) {
    return { id: 'fallback', message: NUTRITION_HINT_FALLBACK }
  }

  matches.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority
    }

    return a.id.localeCompare(b.id)
  })

  const best = matches[0]!

  return { id: best.id, message: best.message(metrics) }
}

export function getNutritionHintRules() {
  return rules
}
