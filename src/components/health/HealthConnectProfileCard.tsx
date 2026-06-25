import { Capacitor } from '@capacitor/core'
import { Activity, ExternalLink, Link2, Unlink } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Pill } from '@/design-system'
import type { HealthConnectAvailability } from '@rcoach/capacitor-health-connect'
import {
  getHealthConnectAvailability,
  getHealthConnectPermissionStatus,
  openHealthConnectSettings,
  requestHealthConnectPermissions,
} from '@/lib/health/health-connect-bridge'
import {
  isHealthConnectSyncEnabled,
  setHealthConnectSyncEnabled,
} from '@/lib/health/health-connect-preferences'

const HEALTH_CONNECT_PLAY_STORE_URL =
  'https://play.google.com/store/apps/détails?id=com.google.android.apps.healthdata'

type ConnectionState =
  | 'unsupported'
  | 'not_installed'
  | 'not_supported'
  | 'disconnected'
  | 'permissions_missing'
  | 'connected'

function resolveConnectionState(
  availability: HealthConnectAvailability | null,
  syncEnabled: boolean,
  permissionsGranted: boolean,
): ConnectionState {
  if (availability === null) {
    return 'unsupported'
  }

  if (availability === 'NotInstalled') {
    return 'not_installed'
  }

  if (availability !== 'Available') {
    return 'not_supported'
  }

  if (syncEnabled && permissionsGranted) {
    return 'connected'
  }

  if (syncEnabled && !permissionsGranted) {
    return 'permissions_missing'
  }

  return 'disconnected'
}

function statusPill(state: ConnectionState) {
  switch (state) {
    case 'connected':
      return (
        <Pill tone="secondary">
          <Link2 className="size-3" />
          Compte lié
        </Pill>
      )
    case 'permissions_missing':
      return (
        <Pill tone="accent">
          <Link2 className="size-3" />
          Autorisations requises
        </Pill>
      )
    case 'not_installed':
      return <Pill tone="accent">A installer</Pill>
    case 'not_supported':
      return <Pill tone="default">Indisponible</Pill>
    case 'unsupported':
      return <Pill tone="default">Android uniquement</Pill>
    default:
      return <Pill tone="default">Non connecté</Pill>
  }
}

function statusDescription(state: ConnectionState) {
  switch (state) {
    case 'connected':
      return 'Vos séances terminées sont envoyées automatiquement vers Health Connect (Google Fit, Samsung Health, etc.).'
    case 'permissions_missing':
      return "La synchronisation est activée mais Health Connect n'a pas les autorisations nécessaires."
    case 'not_installed':
      return 'Installez Health Connect depuis le Play Store pour lier votre compte et synchroniser vos séances.'
    case 'not_supported':
      return "Health Connect n'est pas disponible sur cet appareil."
    case 'unsupported':
      return "Disponible sur l'application Android. Installez l'APK pour connecter Health Connect."
    default:
      return 'Liez Health Connect pour enregistrer vos séances de musculation dans votre écosystème santé Google.'
  }
}

export function HealthConnectProfileCard() {
  const isAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

  const [syncEnabled, setSyncEnabled] = useState(() => isHealthConnectSyncEnabled())
  const [connectionState, setConnectionState] = useState<ConnectionState>('unsupported')
  const [isLoading, setIsLoading] = useState(isAndroid)
  const [isConnecting, setIsConnecting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refreshStatus = useCallback(async () => {
    if (!isAndroid) {
      setConnectionState('unsupported')
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const availability = await getHealthConnectAvailability()
      const permissions = await getHealthConnectPermissionStatus()
      const enabled = isHealthConnectSyncEnabled()
      setSyncEnabled(enabled)
      setConnectionState(
        resolveConnectionState(
          availability,
          enabled,
          permissions.granted,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [isAndroid])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  async function handleConnect() {
    setMessage(null)
    setIsConnecting(true)

    try {
      const availability = await getHealthConnectAvailability()

      if (availability === 'NotInstalled') {
        window.open(HEALTH_CONNECT_PLAY_STORE_URL, '_blank')
        setMessage('Installez Health Connect, puis revenez ici pour connecter.')
        return
      }

      if (availability !== 'Available') {
        setMessage("Health Connect n'est pas disponible sur cet appareil.")
        return
      }

      const permissionResult = await requestHealthConnectPermissions()
      if (!permissionResult.granted) {
        setMessage('Autorisations refusées. Vous pouvez les modifier dans Health Connect.')
        setHealthConnectSyncEnabled(false)
        setSyncEnabled(false)
        await refreshStatus()
        return
      }

      setHealthConnectSyncEnabled(true)
      setSyncEnabled(true)
      setMessage('Compte Health Connect lié avec succès.')
      await refreshStatus()
    } catch (connectError) {
      setMessage(
        connectError instanceof Error
          ? connectError.message
          : 'Impossible de connecter Health Connect.',
      )
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleDisconnect() {
    setMessage(null)
    setHealthConnectSyncEnabled(false)
    setSyncEnabled(false)
    setMessage('Synchronisation Health Connect désactivée.')
    await refreshStatus()
  }

  async function handleSyncToggle(checked: boolean) {
    setMessage(null)

    if (!checked) {
      await handleDisconnect()
      return
    }

    await handleConnect()
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border">
      <CardHeader className="bg-gradient-to-br from-soft-secondary/40 via-card to-soft-purple/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-soft-secondary text-secondary-foreground">
              <Activity className="size-5" />
            </div>
            <div>
              <CardTitle className="font-display font-black">Santé Connect</CardTitle>
              <CardDescription className="mt-1">
                Synchronisez vos séances avec Health Connect (Google).
              </CardDescription>
            </div>
          </div>
          {!isLoading ? statusPill(connectionState) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Vérification de la connexion...</p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {statusDescription(connectionState)}
          </p>
        )}

        {message ? <FormMessage>{message}</FormMessage> : null}

        {connectionState === 'connected' ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="healthConnectSync" className="text-sm font-semibold">
                Synchroniser les séances
              </Label>
              <p className="text-xs text-muted-foreground">
                Envoi automatique à la fin de chaque séance.
              </p>
            </div>
            <Switch
              id="healthConnectSync"
              checked={syncEnabled}
              onCheckedChange={(checked) => void handleSyncToggle(checked)}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          {connectionState !== 'connected' ? (
            <Button
              type="button"
              variant="pill"
              className="flex-1"
              disabled={isLoading || isConnecting || connectionState === 'unsupported'}
              onClick={() => void handleConnect()}
            >
              <Link2 className="size-4" />
              {isConnecting ? 'Connexion...' : 'Connecter Health Connect'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => void handleDisconnect()}
            >
              <Unlink className="size-4" />
              Déconnecter
            </Button>
          )}

          {isAndroid && connectionState !== 'unsupported' ? (
            <Button
              type="button"
              variant="soft"
              className="flex-1 rounded-full"
              onClick={() => void openHealthConnectSettings()}
            >
              <ExternalLink className="size-4" />
              Gérer les autorisations
            </Button>
          ) : null}
        </div>

        {connectionState === 'not_installed' ? (
          <Button
            type="button"
            variant="soft"
            className="w-full rounded-full"
            onClick={() => window.open(HEALTH_CONNECT_PLAY_STORE_URL, '_blank')}
          >
            Installer Health Connect
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
