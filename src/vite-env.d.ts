/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NHOST_SUBDOMAIN: string
  readonly VITE_NHOST_REGION: string
  /** Override OAuth redirect origin when window.location.origin differs from Nhost allowlist */
  readonly VITE_OAUTH_REDIRECT_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
