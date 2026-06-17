import type { AuthMode } from '../../types/user'

const ZONE_PARAM = 'z'
const MODE_PARAM = 'm'

export function persistAppRoute(mode: AuthMode): void {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  url.searchParams.set(ZONE_PARAM, 'app')
  url.searchParams.set(MODE_PARAM, mode)
  window.history.replaceState(null, '', url.toString())
}

export function readZoneFromUrl(): 'app' | null {
  if (typeof window === 'undefined') {
    return null
  }

  return new URLSearchParams(window.location.search).get(ZONE_PARAM) === 'app'
    ? 'app'
    : null
}

export function readAuthModeFromUrl(): AuthMode | null {
  if (typeof window === 'undefined') {
    return null
  }

  const mode = new URLSearchParams(window.location.search).get(MODE_PARAM)
  return mode === 'login' || mode === 'register' ? mode : null
}

export function clearAppRouteFromUrl(): void {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  if (!url.searchParams.has(ZONE_PARAM) && !url.searchParams.has(MODE_PARAM)) {
    return
  }

  url.searchParams.delete(ZONE_PARAM)
  url.searchParams.delete(MODE_PARAM)
  window.history.replaceState(null, '', url.toString())
}

export function shouldOpenAppFromUrl(): boolean {
  return readZoneFromUrl() === 'app'
}
