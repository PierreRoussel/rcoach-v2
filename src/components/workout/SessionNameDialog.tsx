import { useEffect, useState } from 'react'

import { SessionModeSelector } from '@/components/workout/SessionModeSelector'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DEFAULT_EMOM_INTERVAL_SECONDS,
  DEFAULT_SESSION_MODE,
  type SessionMode,
} from '@/lib/workout/session-mode'

export type SessionNameDialogSessionConfig = {
  sessionMode: SessionMode
  emomIntervalSeconds: number
  emomTotalMinutes: number
}

type SessionNameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string, sessionConfig?: SessionNameDialogSessionConfig) => Promise<void>
  isPending?: boolean
  title?: string
  description?: string
  placeholder?: string
  confirmLabel?: string
  defaultName?: string
  /** Choix circuit / EMOM à la création (non modifiable ensuite). */
  showSessionMode?: boolean
  /** Récap quota modèles (plan Gratuit). */
  quotaRecap?: { current: number; max: number }
}

export function SessionNameDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  title = 'Nouvelle séance',
  description = 'Donnez un nom à votre modèle avant de choisir les exercices.',
  placeholder = 'Push A, Upper, Legs...',
  confirmLabel = 'Continuer',
  defaultName = '',
  showSessionMode = false,
  quotaRecap,
}: SessionNameDialogProps) {
  const [name, setName] = useState(defaultName)
  const [sessionMode, setSessionMode] = useState<SessionMode>(DEFAULT_SESSION_MODE)
  const [emomTotalMinutes, setEmomTotalMinutes] = useState('12')
  const [emomIntervalSeconds, setEmomIntervalSeconds] = useState(
    String(DEFAULT_EMOM_INTERVAL_SECONDS),
  )
  const [error, setError] = useState<string | null>(null)
  const isEmom = sessionMode === 'emom'

  useEffect(() => {
    if (open) {
      setName(defaultName)
      setSessionMode(DEFAULT_SESSION_MODE)
      setEmomTotalMinutes('12')
      setEmomIntervalSeconds(String(DEFAULT_EMOM_INTERVAL_SECONDS))
      setError(null)
    }
  }, [open, defaultName])

  async function handleConfirm() {
    const trimmed = name.trim() || defaultName.trim()
    if (!trimmed) {
      setError('Indiquez un nom pour la séance.')
      return
    }

    let sessionConfig: SessionNameDialogSessionConfig | undefined

    if (showSessionMode) {
      const totalMinutes = Number.parseInt(emomTotalMinutes, 10)
      const intervalSeconds = Number.parseInt(emomIntervalSeconds, 10)

      if (sessionMode === 'emom') {
        if (!Number.isFinite(totalMinutes) || totalMinutes < 1) {
          setError('Indiquez une durée EMOM valide (au moins 1 minute).')
          return
        }

        if (!Number.isFinite(intervalSeconds) || intervalSeconds < 1) {
          setError('Indiquez un intervalle EMOM valide (au moins 1 seconde).')
          return
        }
      }

      sessionConfig = {
        sessionMode,
        emomIntervalSeconds: intervalSeconds || DEFAULT_EMOM_INTERVAL_SECONDS,
        emomTotalMinutes: totalMinutes || 12,
      }
    }

    setError(null)
    onOpenChange(false)
    try {
      await onConfirm(trimmed, sessionConfig)
      setName('')
    } catch (confirmError) {
      onOpenChange(true)
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'Impossible de créer la séance.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-black">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {quotaRecap ? (
          <p className="rounded-xl bg-muted/50 px-3 py-2 text-center text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {quotaRecap.current}/{quotaRecap.max}
            </span>{' '}
            modèles utilisés
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="sessionName">Nom</Label>
          <Input
            id="sessionName"
            placeholder={placeholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleConfirm()
              }
            }}
            autoFocus
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        {showSessionMode ? (
          <>
            <SessionModeSelector
              value={sessionMode}
              onChange={setSessionMode}
              disabled={isPending}
            />
            {isEmom ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="createEmomTotalMinutes">Durée totale (minutes)</Label>
                  <Input
                    id="createEmomTotalMinutes"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={emomTotalMinutes}
                    onChange={(event) => setEmomTotalMinutes(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createEmomIntervalSeconds">Intervalle (secondes)</Label>
                  <Input
                    id="createEmomIntervalSeconds"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={emomIntervalSeconds}
                    onChange={(event) => setEmomIntervalSeconds(event.target.value)}
                  />
                </div>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Le type de séance ne pourra pas être modifié par la suite.
            </p>
          </>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="pill" onClick={() => void handleConfirm()} disabled={isPending}>
            {isPending ? 'Enregistrement...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
