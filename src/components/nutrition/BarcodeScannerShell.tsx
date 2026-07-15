import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type BarcodeScannerShellProps = {
  open: boolean
  onClose: () => void
  status: 'idle' | 'starting' | 'scanning' | 'error'
  errorMessage: string | null
  video?: ReactNode
  frameTransparent?: boolean
}

export function BarcodeScannerShell({
  open,
  onClose,
  status,
  errorMessage,
  video,
  frameTransparent = false,
}: BarcodeScannerShellProps) {
  if (!open) {
    return null
  }

  return createPortal(
    <div
      className={cn(
        'barcode-scanner-modal fixed inset-0 z-[100] flex flex-col',
        frameTransparent ? 'bg-transparent' : 'bg-black',
      )}
    >
      {video}

      <div className="barcode-scanner-modal__chrome relative z-10 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full border-white/20 bg-black/40 text-white hover:bg-black/60"
            onClick={onClose}
            aria-label="Fermer le scanner"
          >
            <X className="size-5" />
          </Button>
          <p className="font-display text-sm font-bold text-white">Scanner un code-barres</p>
          <div className="size-10" />
        </div>

        <div className="flex flex-1 items-center justify-center px-8">
          <div
            className={cn(
              'relative aspect-[4/3] w-full max-w-sm rounded-2xl border-2 border-white/70',
              frameTransparent ? 'bg-transparent' : 'bg-black/20',
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-y border-white/20" />
          </div>
        </div>

        <div className="space-y-2 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
          {status === 'starting' ? (
            <p className="text-sm text-white/80">Ouverture de la camera...</p>
          ) : status === 'error' ? (
            <p className="text-sm text-red-300">{errorMessage}</p>
          ) : (
            <p className="text-sm text-white/80">
              Placez le code-barres dans le cadre. La detection est automatique.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
