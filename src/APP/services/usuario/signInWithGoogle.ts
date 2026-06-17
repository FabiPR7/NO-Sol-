import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { auth } from '../../../firebase'
import type { AuthMode } from '../../types/user'
import {
  clearAppRouteFromUrl,
  persistAppRoute,
  readAuthModeFromUrl,
  shouldOpenAppFromUrl,
} from './appRoute'

const AUTH_MODE_KEY = 'nosolo_auth_mode'
const RETURN_TO_APP_KEY = 'nosolo_return_to_app'
const LAST_AUTH_MODE_KEY = 'nosolo_last_auth_mode'

function createGoogleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

function setAuthFlag(key: string, value: string): void {
  sessionStorage.setItem(key, value)

  try {
    localStorage.setItem(key, value)
  } catch {
    /* Modo privado u otros límites de almacenamiento */
  }
}

function getAuthFlag(key: string): string | null {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key)
}

function removeAuthFlag(key: string): void {
  sessionStorage.removeItem(key)

  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

function clearRedirectFlags(): void {
  removeAuthFlag(AUTH_MODE_KEY)
  removeAuthFlag(RETURN_TO_APP_KEY)
  removeAuthFlag(LAST_AUTH_MODE_KEY)
}

export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  )
}

let redirectResultPromise: Promise<UserCredential | null> | null = null

async function getRedirectResultOnce(): Promise<UserCredential | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = (async () => {
      await auth.authStateReady()
      return getRedirectResult(auth)
    })()
  }

  return redirectResultPromise
}

function storeRedirectIntent(mode: AuthMode): void {
  persistAppRoute(mode)
  setAuthFlag(AUTH_MODE_KEY, mode)
  setAuthFlag(RETURN_TO_APP_KEY, '1')
}

function readRedirectModeFromStorage(): AuthMode | null {
  const mode = getAuthFlag(AUTH_MODE_KEY) ?? getAuthFlag(LAST_AUTH_MODE_KEY)
  return mode === 'login' || mode === 'register' ? mode : null
}

function hadRedirectIntent(): boolean {
  return Boolean(
    shouldOpenAppFromUrl() ||
      readAuthModeFromUrl() ||
      getAuthFlag(AUTH_MODE_KEY) ||
      getAuthFlag(RETURN_TO_APP_KEY) === '1',
  )
}

function resolveRedirectMode(): AuthMode {
  const urlMode = readAuthModeFromUrl()
  if (urlMode) {
    return urlMode
  }

  const pendingMode = readRedirectModeFromStorage()
  return pendingMode === 'register' ? 'register' : 'login'
}

function isPopupFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false
  }

  const code = String((error as { code: string }).code)
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/popup-blocked' ||
    code === 'auth/cancelled-popup-request'
  )
}

function assertUserEmail(user: User): User {
  if (!user.email) {
    throw new Error('Google no devolvió un correo electrónico válido.')
  }

  return user
}

export async function signInWithGoogle(mode: AuthMode): Promise<User> {
  const provider = createGoogleProvider()

  if (isMobileBrowser()) {
    storeRedirectIntent(mode)

    try {
      const result = await signInWithPopup(auth, provider)
      clearRedirectFlags()
      return assertUserEmail(result.user)
    } catch (error) {
      if (!isPopupFailure(error)) {
        throw error
      }

      await signInWithRedirect(auth, provider)
      return new Promise(() => {
        /* La página redirige a Google */
      })
    }
  }

  const result = await signInWithPopup(auth, provider)
  return assertUserEmail(result.user)
}

export async function resolvePendingGoogleAuth(): Promise<{
  user: User
  mode: AuthMode
} | null> {
  const redirectIntent = hadRedirectIntent()

  if (!redirectIntent && !isMobileBrowser()) {
    return null
  }

  const result = await getRedirectResultOnce()
  let user = result?.user ?? null

  if (!user?.email && redirectIntent) {
    user = auth.currentUser
  }

  if (!user?.email) {
    return null
  }

  const mode = resolveRedirectMode()

  markPostRedirectAppEntry(mode)
  removeAuthFlag(AUTH_MODE_KEY)
  clearAppRouteFromUrl()

  return { user, mode }
}

export function markPostRedirectAppEntry(mode: AuthMode): void {
  setAuthFlag(RETURN_TO_APP_KEY, '1')
  setAuthFlag(LAST_AUTH_MODE_KEY, mode)
}

export function consumeReturnToAppFlag(): boolean {
  return getAuthFlag(RETURN_TO_APP_KEY) === '1'
}

export function readPendingAuthMode(): AuthMode | null {
  return readAuthModeFromUrl() ?? readRedirectModeFromStorage()
}

export function clearReturnToAppFlag(): void {
  removeAuthFlag(RETURN_TO_APP_KEY)
  removeAuthFlag(LAST_AUTH_MODE_KEY)
}
