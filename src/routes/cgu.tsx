import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/cgu')({
  beforeLoad: () => {
    throw redirect({ to: '/legal/terms' })
  },
})
