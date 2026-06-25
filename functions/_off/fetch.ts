const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504])
const MAX_FETCH_RETRIES = 3
const RETRY_BASE_DELAY_MS = 500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt < MAX_FETCH_RETRIES; attempt += 1) {
    const response = await fetch(url, init)

    if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === MAX_FETCH_RETRIES - 1) {
      return response
    }

    lastResponse = response
    await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt)
  }

  return lastResponse!
}
