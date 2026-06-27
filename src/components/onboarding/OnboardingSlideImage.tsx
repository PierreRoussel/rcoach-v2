import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/** ~iPhone portrait — matches onboarding screenshot proportions */
const PHONE_FRAME_CLASS =
  'block h-[min(54svh,600px,calc(100svh-14.5rem))] w-auto max-w-[min(88vw,330px)] rounded-[2rem] object-contain object-top'

const PHONE_SHELL_CLASS =
  'inline-block rounded-[2rem] shadow-[0_16px_32px_-10px_rgba(44,37,69,0.42),0_6px_16px_-8px_rgba(44,37,69,0.24)] ring-1 ring-black/8'

const PHONE_CLIP_CLASS = 'overflow-hidden rounded-[2rem]'

type OnboardingSlideImageProps = {
  slideId: string
  imageSrc: string
  alt: string
  imageTilt: string
  isActive: boolean
  selectedIndex: number
  onError: () => void
  fallbackIcon: LucideIcon
  imageFailed: boolean
}

export function OnboardingSlideImage({
  slideId,
  imageSrc,
  alt,
  imageTilt,
  isActive,
  selectedIndex,
  onError,
  fallbackIcon: Icon,
  imageFailed,
}: OnboardingSlideImageProps) {
  return (
    <div className="flex justify-center px-8 pb-9 pt-0 sm:px-10 sm:pb-10">
      <div
        key={isActive ? `${slideId}-frame-${selectedIndex}` : slideId}
        className={cn(isActive && 'onboarding-image-enter')}
      >
        <div className="perspective-[900px] [transform-style:preserve-3d]">
          <div
            className="origin-[50%_65%] transition-transform duration-500 ease-out [transform-style:preserve-3d]"
            style={{ transform: imageTilt }}
          >
            <div className={cn(isActive && 'onboarding-image-idle')}>
              <div className={PHONE_SHELL_CLASS}>
                <div className={PHONE_CLIP_CLASS}>
                  {imageFailed ? (
                    <div
                      className={cn(
                        PHONE_FRAME_CLASS,
                        'flex aspect-[9/19.5] w-[min(88vw,330px)] items-center justify-center bg-card',
                      )}
                    >
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-soft-primary">
                        <Icon className="size-8 text-primary" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={imageSrc}
                      alt={alt}
                      className={PHONE_FRAME_CLASS}
                      onError={onError}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
