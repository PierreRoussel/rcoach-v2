import { format, formatDistanceStrict } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Dumbbell, Flame, Trophy, Zap } from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'

import { DisplayExercise } from '@/components/workout/DisplayExerciseName'
import { BrandLogo } from '@/design-system'
import { Pill } from '@/design-system'
import type { WorkoutSummary } from '@/lib/graphql/operations'
import {
  computeWorkoutVolume,
  countWorkoutPersonalRecords,
  formatWorkoutVolume,
} from '@/lib/stats/workout-metrics'
import { cn } from '@/lib/utils'

const TOP_EXERCISES = 4

type WorkoutShareCardProps = {
  workout: WorkoutSummary
  authorName?: string | null
  weeklyStreak?: number
  allWorkouts?: WorkoutSummary[]
  className?: string
}

export const WorkoutShareCard = forwardRef<HTMLDivElement, WorkoutShareCardProps>(
  function WorkoutShareCard(
    { workout, authorName, weeklyStreak = 0, allWorkouts = [], className },
    ref,
  ) {
    const volumeKg = computeWorkoutVolume(workout)
    const recordsCount = countWorkoutPersonalRecords(workout, allWorkouts)
    const duration =
      workout.ended_at != null
        ? formatDistanceStrict(
            new Date(workout.started_at),
            new Date(workout.ended_at),
            { locale: fr },
          )
        : null
    const dateLabel = format(new Date(workout.started_at), "EEEE d MMMM yyyy", {
      locale: fr,
    })
    const topExercises = [...workout.workout_exercises]
      .sort((left, right) => right.sets.length - left.sets.length)
      .slice(0, TOP_EXERCISES)

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex aspect-[9/16] w-[270px] flex-col overflow-hidden rounded-3xl',
          'bg-gradient-to-br from-[#18143A] via-[#2A1F5E] to-[#3D2D8A] text-white shadow-2xl',
          className,
        )}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 size-36 rounded-full bg-accent/25 blur-3xl" />

        <div className="relative flex flex-1 flex-col p-5">
          <div className="flex items-center justify-between gap-2">
            <BrandLogo compact className="[&_div]:text-white [&_svg]:text-white" />
            {weeklyStreak > 0 ? (
              <Pill tone="solid-purple" className="gap-1 py-0.5 text-[10px]">
                <Flame className="size-3 fill-current" />
                {weeklyStreak} sem.
              </Pill>
            ) : null}
          </div>

          <div className="mt-6 space-y-1">
            {authorName ? (
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                {authorName}
              </p>
            ) : null}
            <h2 className="font-display text-2xl font-black leading-tight">{workout.title}</h2>
            <p className="text-sm capitalize text-white/75">{dateLabel}</p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <ShareStat label="Durée" value={duration ?? '—'} />
            <ShareStat label="Volume" value={formatWorkoutVolume(volumeKg)} />
            <ShareStat
              label="Records"
              value={
                <span className="inline-flex items-center gap-0.5">
                  <Trophy className="size-3.5 text-amber-300" />
                  {recordsCount}
                </span>
              }
            />
          </div>

          {topExercises.length > 0 ? (
            <div className="mt-5 flex-1 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Exercices
              </p>
              {topExercises.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm"
                >
                  <p className="min-w-0 truncate text-sm font-semibold">
                    <DisplayExercise exercise={entry.exercise} />
                  </p>
                  <Pill tone="secondary" className="shrink-0 gap-1 py-0.5 text-[10px]">
                    <Dumbbell className="size-3" />
                    {entry.sets.length}
                  </Pill>
                </div>
              ))}
              {workout.workout_exercises.length > TOP_EXERCISES ? (
                <p className="text-center text-xs text-white/60">
                  +{workout.workout_exercises.length - TOP_EXERCISES} exercice(s)
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-auto flex items-center justify-center gap-1.5 pt-4 text-xs text-white/70">
            <Zap className="size-3.5 fill-current text-amber-300" />
            <span>rcoach.app</span>
          </div>
        </div>
      </div>
    )
  },
)

function ShareStat({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-xl bg-white/10 px-2 py-2 text-center backdrop-blur-sm">
      <p className="text-[10px] font-medium text-white/65">{label}</p>
      <p className="mt-0.5 font-display text-sm font-black">{value}</p>
    </div>
  )
}
