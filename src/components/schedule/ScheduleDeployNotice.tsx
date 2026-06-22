import { ExternalLink } from 'lucide-react'

import { SCHEDULE_NOT_DEPLOYED_MESSAGE } from '@/lib/graphql/schema-errors'

const NHOST_SUBDOMAIN = import.meta.env.VITE_NHOST_SUBDOMAIN ?? 'knnxqdyuwqvdrupkbvgr'

export function ScheduleDeployNotice() {
  return (
    <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
      <p className="font-medium">{SCHEDULE_NOT_DEPLOYED_MESSAGE}</p>
      <p className="text-muted-foreground">
        Le calendrier affiche deja vos seances realisees. Pour planifier des
        seances, deployez les migrations et metadonnees Nhost du depot (
        <code className="text-xs">nhost/migrations</code>, dont{' '}
        <code className="text-xs">1740700000000_scheduled_sessions</code>).
      </p>
      <ol className="list-decimal space-y-1.5 pl-4 text-muted-foreground">
        <li>
          Creez un token sur{' '}
          <a
            href="https://app.nhost.io/account/tokens"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-primary underline-offset-2 hover:underline"
          >
            app.nhost.io
            <ExternalLink className="size-3" />
          </a>
        </li>
        <li>
          Depuis la racine du projet :{' '}
          <code className="block whitespace-pre-wrap rounded-md bg-muted/40 px-2 py-1 text-xs text-foreground">
            NHOST_PAT=votre_token bash scripts/deploy-nhost.sh
          </code>
        </li>
        <li>
          Verifiez avec{' '}
          <code className="text-xs text-foreground">npm run verify:graphql</code>
        </li>
      </ol>
      <p className="text-xs text-muted-foreground">
        Projet Nhost :{' '}
        <a
          href={`https://app.nhost.io/project/${NHOST_SUBDOMAIN}/deployments`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-primary underline-offset-2 hover:underline"
        >
          {NHOST_SUBDOMAIN}
          <ExternalLink className="size-3" />
        </a>
        . Vous pouvez aussi configurer le secret{' '}
        <code className="text-xs">NHOST_PAT</code> sur GitHub pour l&apos;action
        Deploy Nhost.
      </p>
    </div>
  )
}
