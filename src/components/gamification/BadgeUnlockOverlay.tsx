import { useEffect } from 'react'
import { Crown, Sparkles, Star, Trophy } from 'lucide-react'

import { BadgeArt } from '@/components/gamification/BadgeArt'
import { BadgeUnlockStat } from '@/components/gamification/BadgeUnlockStat'
import { Button } from '@/components/ui/button'
import type { BadgeDefinition, BadgeTier } from '@/lib/gamification/badges'
import { hasBadgeAsset } from '@/lib/gamification/badge-assets'
import { cn } from '@/lib/utils'

type BadgeUnlockOverlayProps = {
  badges: BadgeDefinition[]
  open: boolean
  onClose: () => void
}

type CelebrationTheme = {
  bg: string
  blob: string
  glow: string
  ring: string
  orbit: string
  spark: string
  ray: string
  title: string
  subtitle: string
  body: string
  buttonBorder: string
  buttonText: string
}

const TIER_THEME: Record<BadgeTier, CelebrationTheme> = {
  bronze: {
    bg: '#FFF7ED',
    blob: '#FCD34D',
    glow: '#F59E0B',
    ring: '#D97706',
    orbit: '#FBBF24',
    spark: '#EA580C',
    ray: '#FDBA74',
    title: '#92400E',
    subtitle: '#78350F',
    body: '#57534E',
    buttonBorder: '#FCD34D',
    buttonText: '#92400E',
  },
  silver: {
    bg: '#F8FAFC',
    blob: '#CBD5E1',
    glow: '#94A3B8',
    ring: '#64748B',
    orbit: '#94A3B8',
    spark: '#475569',
    ray: '#CBD5E1',
    title: '#1E293B',
    subtitle: '#334155',
    body: '#64748B',
    buttonBorder: '#CBD5E1',
    buttonText: '#1E293B',
  },
  gold: {
    bg: '#FFFBEB',
    blob: '#FDE68A',
    glow: '#FBBF24',
    ring: '#F59E0B',
    orbit: '#FCD34D',
    spark: '#D97706',
    ray: '#FDE047',
    title: '#854D0E',
    subtitle: '#A16207',
    body: '#78716C',
    buttonBorder: '#FDE68A',
    buttonText: '#854D0E',
  },
}

const BLOBS = [
  { size: 280, top: '-10%', left: '-12%', delay: 0, duration: 14 },
  { size: 220, top: '14%', left: '66%', delay: 0.8, duration: 16 },
  { size: 190, top: '56%', left: '4%', delay: 0.4, duration: 13 },
  { size: 150, top: '70%', left: '56%', delay: 1.2, duration: 12 },
]

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

const PARTICLE_ANGLES = [20, 60, 100, 140, 200, 240, 300, 340]

function VictoryRays({ color }: { color: string }) {
  return (
    <>
      {RAY_ANGLES.map((angle) => (
        <span
          key={angle}
          className="absolute left-1/2 top-1/2 h-28 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full animate-badge-unlock-ray"
          style={{
            background: `linear-gradient(to top, transparent, ${color})`,
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-72px)`,
            animationDelay: `${(angle / 360) * 0.8}s`,
          }}
          aria-hidden
        />
      ))}
    </>
  )
}

function VictoryParticles({ color }: { color: string }) {
  return (
    <>
      {PARTICLE_ANGLES.map((angle, index) => (
        <span
          key={angle}
          className="absolute left-1/2 top-1/2 animate-badge-unlock-particle"
          style={{
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-104px)`,
            animationDelay: `${index * 0.12}s`,
          }}
          aria-hidden
        >
          {index % 3 === 0 ? (
            <Star className="size-4 fill-current" style={{ color }} />
          ) : index % 3 === 1 ? (
            <Sparkles className="size-4" style={{ color }} />
          ) : (
            <Trophy className="size-4" style={{ color }} />
          )}
        </span>
      ))}
    </>
  )
}

export function BadgeUnlockOverlay({ badges, open, onClose }: BadgeUnlockOverlayProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || badges.length === 0) {
    return null
  }

  const primary = badges[0]
  const theme = TIER_THEME[primary.tier]
  const usesCustomArt = hasBadgeAsset(primary.key)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-6 animate-badge-unlock-enter"
      style={{ backgroundColor: theme.bg }}
      role="dialog"
      aria-modal="true"
      aria-label="Nouvelle médaille débloquée"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {BLOBS.map((blob, index) => (
          <span
            key={index}
            className="absolute rounded-full blur-3xl animate-badge-unlock-blob"
            style={{
              width: blob.size,
              height: blob.size,
              top: blob.top,
              left: blob.left,
              backgroundColor: `${theme.blob}88`,
              animationDelay: `${blob.delay}s`,
              animationDuration: `${blob.duration}s`,
            }}
            aria-hidden
          />
        ))}
      </div>

      <div
        className="pointer-events-auto relative flex w-full max-w-md flex-col items-center text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-8 flex size-52 items-center justify-center animate-badge-unlock-pop">
          <VictoryRays color={theme.ray} />
          <VictoryParticles color={theme.spark} />

          <span
            className="absolute inset-0 animate-badge-unlock-glow rounded-full blur-2xl"
            style={{ backgroundColor: `${theme.glow}55` }}
            aria-hidden
          />
          <span
            className="absolute inset-4 animate-badge-unlock-ring rounded-full border bg-white/45"
            style={{ borderColor: `${theme.ring}44` }}
            aria-hidden
          />
          <span
            className="absolute inset-0 animate-badge-unlock-orbit rounded-full border border-dashed"
            style={{ borderColor: `${theme.orbit}66` }}
            aria-hidden
          />

          <div
            className={cn(
              'relative flex items-center justify-center animate-badge-unlock-float',
              usesCustomArt
                ? 'size-40'
                : 'size-36 rounded-full border-2 bg-white/80 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-sm',
            )}
            style={usesCustomArt ? undefined : { borderColor: `${theme.ring}55` }}
          >
            <BadgeArt
              badgeKey={primary.key}
              icon={primary.icon}
              imageClassName="size-40"
              iconClassName="size-16"
            />
          </div>

          <Sparkles
            className="absolute -right-1 top-3 size-6 animate-badge-unlock-spark"
            style={{ color: theme.spark }}
            aria-hidden
          />
          <Crown
            className="absolute -left-2 bottom-4 size-6 animate-badge-unlock-spark"
            style={{ color: theme.spark, animationDelay: '0.6s' }}
            aria-hidden
          />
        </div>

        <div className="animate-badge-unlock-pop-delay space-y-2">
          <p className="font-display text-3xl font-black" style={{ color: theme.title }}>
            Nouvelle médaille !
          </p>
          <p className="font-display text-lg font-bold" style={{ color: theme.subtitle }}>
            {badges.length > 1
              ? `${badges.length} médailles débloquées`
              : primary.label}
          </p>
        </div>

        <p
          className="mt-4 max-w-sm animate-badge-unlock-pop-delay text-sm leading-relaxed"
          style={{ color: theme.body }}
        >
          {primary.description}
        </p>

        <BadgeUnlockStat
          percent={primary.unlock_percent ?? 0}
          centered
          className="mt-3 animate-badge-unlock-pop-delay"
        />

        {badges.length > 1 ? (
          <ul
            className="mt-4 w-full max-w-xs animate-badge-unlock-pop-delay space-y-1.5 text-left text-sm"
            style={{ color: theme.body }}
          >
            {badges.slice(1, 5).map((badge) => (
              <li key={badge.key} className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/70">
                  <BadgeArt
                    badgeKey={badge.key}
                    icon={badge.icon}
                    imageClassName="size-7"
                    iconClassName="size-3.5"
                  />
                </span>
                {badge.label}
              </li>
            ))}
            {badges.length > 5 ? <li>+{badges.length - 5} autre(s)</li> : null}
          </ul>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className="mt-8 rounded-full border bg-white/80 px-10 shadow-sm backdrop-blur-sm animate-badge-unlock-pop-delay hover:bg-white"
          style={{
            borderColor: theme.buttonBorder,
            color: theme.buttonText,
          }}
          onClick={onClose}
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}
