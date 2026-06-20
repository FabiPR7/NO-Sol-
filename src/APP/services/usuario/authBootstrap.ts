import type { AuthMode } from '../../types/user'
import { finishLoginUser } from './loginUser'
import { finishRegisterUser } from './registerUser'
import {
  markPostRedirectAppEntry,
  resolvePendingGoogleAuth,
  consumeReturnToAppFlag,
} from './signInWithGoogle'
import { shouldOpenAppFromUrl } from './appRoute'

let bootstrapPromise: Promise<{ mode: AuthMode } | null> | null = null
let bootstrapResult: { mode: AuthMode } | null = null
let bootstrapError: string | null = null

export function bootstrapGoogleAuth(): Promise<{ mode: AuthMode } | null> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const pending = await resolvePendingGoogleAuth()

      if (!pending) {
        return null
      }

      try {
        if (pending.mode === 'register') {
          await finishRegisterUser(pending.user)
        } else {
          await finishLoginUser(pending.user)
        }
      } catch (error) {
        bootstrapError =
          error instanceof Error
            ? error.message
            : 'No se pudo completar el inicio de sesión con Google.'
        markPostRedirectAppEntry(pending.mode)
        bootstrapResult = { mode: pending.mode }
        return bootstrapResult
      }

      markPostRedirectAppEntry(pending.mode)
      bootstrapResult = { mode: pending.mode }
      return bootstrapResult
    })()
  }

  return bootstrapPromise
}

export function consumeAuthBootstrapResult(): Promise<{ mode: AuthMode } | null> | null {
  return bootstrapPromise
}

export function getAuthBootstrapResult(): { mode: AuthMode } | null {
  return bootstrapResult
}

export function getAuthBootstrapError(): string | null {
  return bootstrapError
}

export function shouldEnterAppAfterRedirect(): boolean {
  return Boolean(
    bootstrapResult ||
      consumeReturnToAppFlag() ||
      shouldOpenAppFromUrl(),
  )
}
