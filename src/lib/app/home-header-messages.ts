import { formatTodayReminderMessage, type TodayReminder } from '@/lib/schedule/today-reminders'
import { formatValidatedWorkoutMessage } from '@/lib/workout/format-validated-workout-message'

export type HomeHeaderSubtitle =
  | { mode: 'fun'; text: string }
  | { mode: 'today_reminder'; text: string; reminder: TodayReminder }
  | { mode: 'recent_workout'; text: string }
  | { mode: 'first_workout'; text: string }

type HomeHeaderSubtitleInput = {
  userId?: string | null
  firstName?: string | null
  todayReminders: TodayReminder[]
  lastWorkout?: { title: string; startedAt: string } | null
}

const FUN_SUBTITLE_RATIO = 0.38

const GREETING_WITH_NAME = [
  'Bonjour {name} 👋',
  'Salut {name} 💪',
  'Hey {name} !',
  'Content de te revoir {name}',
] as const

const GREETING_GENERIC = ['Bonjour 👋', 'Salut !', 'Bienvenue'] as const

const FUN_MESSAGES_GENERAL = [
  'La sueur, c’est du gras qui pleure.',
  'Tes muscles attendent un signe de vie.',
  'Petit effort, gros ego. On valide ?',
  'Mode beast : activable en un clic.',
  'Aujourd’hui on compte les reps, pas les excuses.',
  'Le canapé peut attendre.',
  'Une séance de plus, une excuse de moins.',
] as const

const FUN_MESSAGES_WITH_NAME = [
  '{name}, prêt à faire des miracles ?',
  '{name}, la chaise t’a presque oublié.',
  '{name}, on envoie du lourd aujourd’hui ?',
] as const

const FUN_MESSAGES_TODAY = [
  'Le planning dit qu’il est l’heure de briller.',
  'Ta séance t’attend comme un bon café.',
  'Les haltères sont passifs. Toi, moins.',
  'C’est le moment de transformer la théorie en reps.',
] as const

const FUN_MESSAGES_RECENT = [
  'Belle séance ! On enchaîne quand tu veux.',
  'Tes stats te remercient déjà.',
  'La prochaine va faire mal (dans le bon sens).',
  'Tu progresses. Le miroir le saura bientôt.',
] as const

const FUN_MESSAGES_FIRST = [
  'La première est la plus dure. Spoiler : faux.',
  'Zéro séance enregistrée. On corrige ça ?',
  'Le meilleur moment, c’était hier. Le deuxième, c’est maintenant.',
  'Ta première séance t’attend. Sans jugement.',
] as const

function hashString(value: string): number {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function pickFrom<T>(items: readonly T[], seed: string): T {
  return items[hashString(seed) % items.length]!
}

function formatDailySeed(userId: string | null | undefined, now: Date): string {
  const day = now.toISOString().slice(0, 10)
  return `${userId?.trim() || 'guest'}:${day}`
}

function interpolateName(template: string, firstName?: string | null): string {
  if (!firstName?.trim()) {
    return template.replace(/\{name\}/g, '').replace(/\s+/g, ' ').trim()
  }

  return template.replace(/\{name\}/g, firstName.trim())
}

function shouldUseFunSubtitle(dailySeed: string): boolean {
  return hashString(`${dailySeed}:fun`) % 100 < FUN_SUBTITLE_RATIO * 100
}

function pickFunSubtitle(
  dailySeed: string,
  context: 'general' | 'today' | 'recent' | 'first',
  firstName?: string | null,
): string {
  const usePersonal =
    Boolean(firstName?.trim()) && hashString(`${dailySeed}:personal`) % 2 === 0

  if (usePersonal) {
    const pool =
      context === 'today'
        ? [...FUN_MESSAGES_TODAY, ...FUN_MESSAGES_WITH_NAME]
        : context === 'recent'
          ? [...FUN_MESSAGES_RECENT, ...FUN_MESSAGES_WITH_NAME]
          : context === 'first'
            ? [...FUN_MESSAGES_FIRST, ...FUN_MESSAGES_WITH_NAME]
            : [...FUN_MESSAGES_GENERAL, ...FUN_MESSAGES_WITH_NAME]

    return interpolateName(pickFrom(pool, `${dailySeed}:quip`), firstName)
  }

  const pool =
    context === 'today'
      ? FUN_MESSAGES_TODAY
      : context === 'recent'
        ? FUN_MESSAGES_RECENT
        : context === 'first'
          ? FUN_MESSAGES_FIRST
          : FUN_MESSAGES_GENERAL

  return pickFrom(pool, `${dailySeed}:quip`)
}

export function resolveHomeHeaderGreeting(
  firstName: string | null | undefined,
  userId: string | null | undefined,
  now = new Date(),
): string {
  const dailySeed = formatDailySeed(userId, now)

  if (firstName?.trim()) {
    return interpolateName(
      pickFrom(GREETING_WITH_NAME, `${dailySeed}:greeting`),
      firstName,
    )
  }

  return pickFrom(GREETING_GENERIC, `${dailySeed}:greeting`)
}

export function resolveHomeHeaderSubtitle(
  input: HomeHeaderSubtitleInput,
  now = new Date(),
): HomeHeaderSubtitle {
  const dailySeed = formatDailySeed(input.userId, now)
  const useFun = shouldUseFunSubtitle(dailySeed)
  const primaryReminder = input.todayReminders[0]

  if (primaryReminder) {
    const reminderText = formatTodayReminderMessage(input.todayReminders)

    if (useFun && reminderText) {
      return {
        mode: 'fun',
        text: pickFunSubtitle(dailySeed, 'today', input.firstName),
      }
    }

    return {
      mode: 'today_reminder',
      text: reminderText ?? `Séance prévue : ${primaryReminder.title}`,
      reminder: primaryReminder,
    }
  }

  if (input.lastWorkout) {
    const recap = formatValidatedWorkoutMessage(
      input.lastWorkout.title,
      input.lastWorkout.startedAt,
      now,
    )

    if (useFun) {
      return {
        mode: 'fun',
        text: pickFunSubtitle(dailySeed, 'recent', input.firstName),
      }
    }

    return { mode: 'recent_workout', text: recap }
  }

  if (useFun) {
    return {
      mode: 'fun',
      text: pickFunSubtitle(dailySeed, 'first', input.firstName),
    }
  }

  return { mode: 'first_workout', text: 'Prêt pour votre première séance ?' }
}
