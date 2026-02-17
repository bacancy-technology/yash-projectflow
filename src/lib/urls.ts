export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'

  return raw.replace(/\/$/, '')
}

export function sanitizeNextPath(
  next: unknown,
  fallback: string = '/dashboard'
): string {
  if (typeof next !== 'string') return fallback
  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//')) return fallback
  if (next.includes('\\')) return fallback
  return next
}

