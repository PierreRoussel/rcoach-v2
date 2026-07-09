import { createFileRoute, Link, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/confidentialite')({
  beforeLoad: () => {
    throw redirect({ to: '/legal/privacy' })
  },
})
