import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form'
import { LegalLinksRow } from '@/components/legal/LegalLinksRow'
import { clearAuthSession } from '@/lib/auth/clear-auth-session'
import { deleteMyAccount } from '@/lib/legal/delete-my-account'
import { LEGAL_PATHS, supportMailto } from '@/lib/legal/config'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function AccountLegalSupportSection() {
  const { nhost } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDeleteAccount() {
    setError(null)
    setIsDeleting(true)

    try {
      await deleteMyAccount(nhost)
      await clearAuthSession(nhost)
      await navigate({ to: '/auth/login' })
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Impossible de supprimer le compte. Réessayez ou contactez le support.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="soft" size="sm" asChild>
          <Link to={LEGAL_PATHS.help}>Centre d&apos;aide</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={supportMailto('Support RCoach')}>Contacter le support</a>
        </Button>
      </div>

      <LegalLinksRow includeCgv className="justify-start" />

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <h3 className="text-sm font-semibold text-destructive">Supprimer mon compte</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Action définitive. Vos données seront supprimées sous 30 jours, sauf obligation légale
          contraire.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="mt-3" disabled={isDeleting}>
              Supprimer mon compte
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Vos séances, nutrition, amis et abonnement seront
                perdus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDeleteAccount()
                }}
              >
                {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {error ? <FormMessage className="mt-2">{error}</FormMessage> : null}
      </div>
    </div>
  )
}
