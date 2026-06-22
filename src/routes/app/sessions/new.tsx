import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/sessions/new')({
  beforeLoad: () => {
    throw redirect({ to: '/app/sessions' })
  },
})
