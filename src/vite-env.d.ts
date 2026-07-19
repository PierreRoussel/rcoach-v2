/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  import type { BlogPostMeta } from '@/lib/seo/blog'

  export const meta: BlogPostMeta
  const MDXComponent: ComponentType
  export default MDXComponent
}

interface ImportMetaEnv {
  readonly VITE_NHOST_SUBDOMAIN: string
  readonly VITE_NHOST_REGION: string
  /** Override OAuth redirect origin when window.location.origin differs from Nhost allowlist */
  readonly VITE_OAUTH_REDIRECT_ORIGIN?: string
  /**
   * Public HTTPS origin for share links (PWA / web).
   * Required on Capacitor Android where window.location.origin is https://localhost.
   */
  readonly VITE_PUBLIC_APP_URL?: string

  readonly VITE_PLAY_PRODUCT_MONTHLY?: string
  readonly VITE_PLAY_PRODUCT_ANNUAL?: string
  readonly VITE_BILLING_FUNCTION_BASE?: string
  /** Set in `.env.android` for the Capacitor shell build (no marketing routes). */
  readonly VITE_BUILD_TARGET?: 'android'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
