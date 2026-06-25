import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Mail, UserCheck, UserX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader, Pill } from '@/design-system'
import {
  useCoachClients,
  useInviteCoachClient,
  useUpdateCoachClientStatus,
} from '@/hooks/useCoach'

export const Route = createFileRoute('/coach/clients/')({
  component: CoachClientsPage,
})

function CoachClientsPage() {
  const { data: clients, isLoading, error } = useCoachClients()
  const inviteClient = useInviteCoachClient()
  const updateStatus = useUpdateCoachClientStatus()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function handleInvite() {
    setMessage(null)
    if (!email.trim()) {
      setMessage('Indiquez une adresse email.')
      return
    }

    try {
      await inviteClient.mutateAsync(email)
      setEmail('')
      setMessage('Invitation envoyée (statut pending).')
    } catch (inviteError) {
      setMessage(
        inviteError instanceof Error
          ? inviteError.message
          : "Impossible d'inviter ce client.",
      )
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Coach"
        title="Clients"
        description="Invitez des athlètes et suivez le statut de la relation coach-client."
      />

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">
            Inviter un client
          </CardTitle>
          <CardDescription>
            L'athlète pourra accepter l'invitation une fois connecté (Phase 2).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              placeholder="athlète@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button
            variant="pill"
            onClick={() => void handleInvite()}
            disabled={inviteClient.isPending}
          >
            {inviteClient.isPending ? 'Envoi...' : 'Inviter'}
          </Button>
          {message ? <FormMessage>{message}</FormMessage> : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Liste</CardTitle>
          <CardDescription>
            {clients?.length ?? 0} relation(s) coach-client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Erreur'}
            </p>
          ) : null}
          {clients?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun client pour le moment.
            </p>
          ) : null}
          {clients?.map((client) => (
            <div
              key={client.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="space-y-1">
                <p className="font-display font-bold">
                  {client.athlète?.display_name ??
                    client.invited_email ??
                    'Client'}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="size-3" />
                  {client.invited_email ?? '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Pill
                  tone={
                    client.status === 'active'
                      ? 'primary'
                      : client.status === 'pending'
                        ? 'accent'
                        : 'default'
                  }
                >
                  {client.status}
                </Pill>
                {client.status !== 'active' ? (
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() =>
                      void updateStatus.mutateAsync({
                        id: client.id,
                        status: 'active',
                      })
                    }
                  >
                    <UserCheck className="size-4" />
                    Activer
                  </Button>
                ) : null}
                {client.status !== 'archived' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void updateStatus.mutateAsync({
                        id: client.id,
                        status: 'archived',
                      })
                    }
                  >
                    <UserX className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
