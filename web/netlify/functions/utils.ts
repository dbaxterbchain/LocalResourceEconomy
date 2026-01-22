type NetlifyEvent = {
  queryStringParameters?: Record<string, string> | null
  rawQueryString?: string
  rawQuery?: string
  rawUrl?: string
  rawPath?: string
  path?: string
  url?: string
  headers?: Record<string, string> | null
}

export const getEnv = (name: string) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export const getHeader = (headers: Record<string, string> | null | undefined, key: string) => {
  if (!headers) {
    return undefined
  }
  return headers[key] || headers[key.toLowerCase()] || headers[key.toUpperCase()]
}

export const parseBearer = (value?: string) => {
  if (!value) {
    return undefined
  }
  const trimmed = value.trim()
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    return trimmed.slice(7).trim()
  }
  return trimmed
}

export const getQueryParams = (event: NetlifyEvent) => {
  if (event.queryStringParameters) {
    return event.queryStringParameters
  }

  const rawQuery = event.rawQueryString || event.rawQuery
  if (rawQuery) {
    return Object.fromEntries(new URLSearchParams(rawQuery))
  }

  const rawUrl = event.rawUrl || event.rawPath || event.path || event.url
  if (rawUrl && rawUrl.includes('?')) {
    const url = new URL(rawUrl, 'http://localhost')
    return Object.fromEntries(url.searchParams.entries())
  }

  return {}
}

const isDevMode = (headers?: Record<string, string> | null) => {
  const envDev =
    process.env.NETLIFY_DEV === 'true' ||
    process.env.NETLIFY_LOCAL === 'true' ||
    process.env.NODE_ENV === 'development'

  const host = headers?.host || headers?.Host || ''
  const forwardedFor = headers?.['x-forwarded-for'] || headers?.['client-ip'] || ''
  const localHost =
    host.includes('localhost') || host.includes('127.0.0.1') || forwardedFor.includes('::1')

  return envDev || localHost
}

export const authorizeAdmin = (event: NetlifyEvent) => {
  const adminToken = getEnv('ADMIN_API_TOKEN').trim()
  const headerToken =
    getHeader(event.headers, 'x-admin-token') || getHeader(event.headers, 'authorization')
  const queryParams = getQueryParams(event)
  const devMode = isDevMode(event.headers ?? undefined)
  const requestTokenRaw =
    parseBearer(headerToken) || (devMode ? queryParams.token : undefined)
  const requestToken = requestTokenRaw?.trim()
  return Boolean(requestToken && requestToken === adminToken)
}
