import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/workouts/')({
  beforeLoad: () => {
    throw redirect({ to: '/app/sessions', search: { tab: 'history' } })
  },
})
