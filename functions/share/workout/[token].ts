const CRAWLER_PATTERN =
  /bot|crawler|spider|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegram|slack|discord/i

const GET_SHARED_WORKOUT = `
  query GetSharedWorkoutOg($token: uuid!) {
    workouts(where: { share_token: { _eq: $token } }, limit: 1) {
      title
      started_at
      user {
        display_name
      }
    }
  }
`

type SharedWorkoutOg = {
  title: string
  started_at: string
  user: { display_name: string } | null
}

type Env = Record<string, string | undefined>

type PagesContext = {
  request: Request
  params: Record<string, string | undefined>
  env: Env
  next: () => Promise<Response>
}

type PagesFunction<E = Env> = (context: PagesContext & { env: E }) => Promise<Response>

async function fetchSharedWorkout(
  env: Env,
  token: string,
): Promise<SharedWorkoutOg | null> {
  const subdomain = env.VITE_NHOST_SUBDOMAIN ?? env.NHOST_SUBDOMAIN
  const region = env.VITE_NHOST_REGION ?? env.NHOST_REGION

  if (!subdomain || !region) {
    return null
  }

  const response = await fetch(`https://${subdomain}.graphql.${region}.nhost.run/v1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_SHARED_WORKOUT,
      variables: { token },
    }),
  })

  const payload = (await response.json()) as {
    data?: { workouts: SharedWorkoutOg[] }
  }

  return payload.data?.workouts[0] ?? null
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildOgHtml(options: {
  title: string
  description: string
  url: string
  imageUrl: string
  spaHtml: string
}) {
  const { title, description, url, imageUrl, spaHtml } = options

  return spaHtml.replace(
    '</head>',
    `  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="RCoach" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
</head>`,
  )
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const userAgent = context.request.headers.get('user-agent') ?? ''
  const token = context.params.token

  if (!token || typeof token !== 'string' || !CRAWLER_PATTERN.test(userAgent)) {
    return context.next()
  }

  const spaResponse = await context.next()
  const spaHtml = await spaResponse.text()
  const requestUrl = new URL(context.request.url)
  const imageUrl = new URL('/og-share-default.svg', requestUrl.origin).toString()

  const workout = await fetchSharedWorkout(context.env, token)
  const author = workout?.user?.display_name
  const title = workout?.title ?? 'Séance RCoach'
  const description = author
    ? `${author} partage sa séance « ${workout?.title ?? 'entraînement'} » sur RCoach.`
    : 'Découvrez une séance d’entraînement partagée sur RCoach.'

  const html = buildOgHtml({
    title,
    description,
    url: requestUrl.toString(),
    imageUrl,
    spaHtml,
  })

  return new Response(html, {
    status: spaResponse.status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  })
}
