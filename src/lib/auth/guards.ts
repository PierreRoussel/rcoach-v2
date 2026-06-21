import { redirect } from '@tanstack/react-router'

import { nhost } from '@/lib/nhost/AuthProvider'

export function requireAuth() {
  if (!nhost.getUserSession()) {
    throw redirect({ to: '/auth/login' })
  }
}

export function redirectIfAuthenticated() {
  if (nhost.getUserSession()) {
    throw redirect({ to: '/app' })
  }
}
