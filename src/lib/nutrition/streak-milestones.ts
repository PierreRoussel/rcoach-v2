export type StreakMilestone = {
  streak: number
  message: string
}

const MILESTONES: StreakMilestone[] = [
  { streak: 3, message: "3 jours d'affilée — vous créez l'habitude !" },
  { streak: 5, message: '5 jours de suite — 15 % des gens auraient déjà abandonné !' },
  { streak: 7, message: 'Une semaine complète — vous êtes dans le top 25 % !' },
  { streak: 14, message: '2 semaines — votre discipline fait la différence !' },
  { streak: 21, message: '21 jours — une habitude solide se forme !' },
  { streak: 30, message: 'Un mois complet — bravo pour cette régularité !' },
  { streak: 60, message: '60 jours — vous êtes inarrêtable !' },
  { streak: 100, message: '100 jours — une performance exceptionnelle !' },
]

export function getMilestoneForStreak(streak: number): StreakMilestone | null {
  return MILESTONES.find((milestone) => milestone.streak === streak) ?? null
}

export function getHighestMilestone(streak: number): StreakMilestone | null {
  let highest: StreakMilestone | null = null

  for (const milestone of MILESTONES) {
    if (milestone.streak <= streak) {
      highest = milestone
    }
  }

  return highest
}
