import { useRef, useState } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Button } from '@/components/ui/button'
import { useUpdateProfile } from '@/hooks/useProfile'
import {
  removeStoredAvatar,
  replaceStoredAvatar,
} from '@/lib/storage/upload-avatar'
import { getProfileInitials } from '@/lib/stats/workout-metrics'
import { useAuth } from '@/lib/nhost/AuthProvider'

type AvatarEditorProps = {
  profileId: string
  displayName: string
  avatarUrl: string | null
}

export function AvatarEditor({ profileId, displayName, avatarUrl }: AvatarEditorProps) {
  const { nhost } = useAuth()
  const updateProfile = useUpdateProfile()
  const inputRef = useRef<HTMLInputElement>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    setSuccessMessage(null)
    setError(null)
    setIsUploading(true)

    try {
      const userId = nhost.getUserSession()?.user?.id
      if (!userId) {
        throw new Error('Session expirée.')
      }

      await replaceStoredAvatar(nhost, userId, file, avatarUrl, async (nextUrl) => {
        await updateProfile.mutateAsync({
          profileId,
          changes: { avatar_url: nextUrl },
        })
      })
      setSuccessMessage('Photo de profil mise à jour.')
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Impossible de mettre à jour la photo.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemove() {
    setSuccessMessage(null)
    setError(null)
    setIsUploading(true)

    try {
      await removeStoredAvatar(nhost, avatarUrl, async () => {
        await updateProfile.mutateAsync({
          profileId,
          changes: { avatar_url: null },
        })
      })
      setSuccessMessage('Photo de profil retirée.')
    } catch (removeError) {
      setError(
        removeError instanceof Error ? removeError.message : 'Impossible de retirer la photo.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16 border border-border">
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="font-display text-lg font-black">
          {getProfileInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            Changer la photo
          </Button>
          {avatarUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={isUploading}
              onClick={() => void handleRemove()}
            >
              <Trash2 className="size-4" />
              Retirer
            </Button>
          ) : null}
        </div>
        {successMessage ? (
          <FeedbackMessage variant="success" className="text-xs">
            {successMessage}
          </FeedbackMessage>
        ) : null}
        {error ? (
          <FeedbackMessage variant="error" className="text-xs">
            {error}
          </FeedbackMessage>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />
    </div>
  )
}
