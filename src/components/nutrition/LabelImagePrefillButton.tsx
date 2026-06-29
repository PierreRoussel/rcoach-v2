import { Camera, ImageUp, Images } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type LabelImagePrefillButtonProps = {
  pending?: boolean
  onFileSelected: (file: File) => void
  variant?: 'default' | 'outline'
  className?: string
}

export function LabelImagePrefillButton({
  pending = false,
  onFileSelected,
  variant = 'outline',
  className,
}: LabelImagePrefillButtonProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) {
      onFileSelected(file)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={variant}
            className={className}
            disabled={pending}
          >
            <ImageUp className="size-4" />
            {pending ? 'Lecture en cours…' : 'Pré-remplir avec une image'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              window.setTimeout(() => cameraInputRef.current?.click(), 0)
            }}
          >
            <Camera className="size-4" />
            Prendre une photo
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              window.setTimeout(() => galleryInputRef.current?.click(), 0)
            }}
          >
            <Images className="size-4" />
            Choisir une image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
    </>
  )
}
