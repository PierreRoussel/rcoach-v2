import { Watch } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWearWatchSetup } from '@/hooks/useWearWatchSetup'

export function WearWatchSetupCard() {
  const {
    isSupported,
    statusLabel,
    needsWearInstall,
    isPromptingInstall,
    installMessage,
    installOnWatch,
    status,
  } = useWearWatchSetup()

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Watch className="size-5" aria-hidden />
            Montre Wear OS
          </CardTitle>
          <CardDescription>
            Disponible dans l’application Android. Contrôlez vos séances depuis la montre.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Installez RCoach depuis le Play Store sur votre téléphone Android pour activer la
          montre.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Watch className="size-5" aria-hidden />
          Montre Wear OS
        </CardTitle>
        <CardDescription>
          Installez RCoach sur la montre appairée pour suivre la séance au poignet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium text-foreground">{statusLabel}</p>

        {needsWearInstall ? (
          <Button
            type="button"
            variant="pill"
            disabled={isPromptingInstall}
            onClick={() => void installOnWatch()}
          >
            {isPromptingInstall ? 'Ouverture…' : 'Installer sur la montre'}
          </Button>
        ) : null}

        {!status.paired ? (
          <p className="text-sm text-muted-foreground">
            Ouvrez l’app <strong>Wear OS</strong> sur le téléphone et connectez votre montre via
            Bluetooth.
          </p>
        ) : null}

        {status.hasRcoachWear ? (
          <p className="text-sm text-muted-foreground">
            Au démarrage d’une séance, l’app montre s’ouvre automatiquement.
          </p>
        ) : null}

        {installMessage ? (
          <p className="text-sm text-muted-foreground" role="status">
            {installMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
