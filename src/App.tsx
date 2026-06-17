import { useEffect, useState } from 'react'
import Web from './WEB/Web'
import AppZone from './APP/App'
import {
  getAuthBootstrapResult,
  shouldEnterAppAfterRedirect,
} from './APP/services/usuario/authBootstrap'
import {
  clearAppRouteFromUrl,
  persistAppRoute,
  readAuthModeFromUrl,
  shouldOpenAppFromUrl,
} from './APP/services/usuario/appRoute'
import {
  consumeReturnToAppFlag,
  readPendingAuthMode,
  clearReturnToAppFlag,
} from './APP/services/usuario/signInWithGoogle'
import { auth } from './firebase'
import type { AuthMode } from './APP/types/user'

type Zone = 'web' | 'app'

function readInitialZone(): Zone {
  if (typeof window === 'undefined') {
    return 'web'
  }

  if (shouldOpenAppFromUrl()) {
    return 'app'
  }

  if (getAuthBootstrapResult() || shouldEnterAppAfterRedirect()) {
    return 'app'
  }

  if (consumeReturnToAppFlag()) {
    return 'app'
  }

  return 'web'
}

function readInitialAuthMode(): AuthMode {
  const urlMode = readAuthModeFromUrl()
  if (urlMode) {
    return urlMode
  }

  const bootstrap = getAuthBootstrapResult()
  if (bootstrap) {
    return bootstrap.mode
  }

  const pendingMode = readPendingAuthMode()
  return pendingMode ?? 'login'
}

function App() {
  const [zone, setZone] = useState<Zone>(readInitialZone)
  const [authMode, setAuthMode] = useState<AuthMode>(readInitialAuthMode)

  useEffect(() => {
    const openApp =
      shouldOpenAppFromUrl() ||
      Boolean(getAuthBootstrapResult()) ||
      shouldEnterAppAfterRedirect() ||
      consumeReturnToAppFlag()

    if (openApp) {
      setZone('app')

      const urlMode = readAuthModeFromUrl()
      const bootstrap = getAuthBootstrapResult()

      if (urlMode) {
        setAuthMode(urlMode)
      } else if (bootstrap) {
        setAuthMode(bootstrap.mode)
      } else {
        const pendingMode = readPendingAuthMode()
        if (pendingMode) {
          setAuthMode(pendingMode)
        }
      }

      clearReturnToAppFlag()
      return
    }

    void auth.authStateReady().then(() => {
      if (auth.currentUser) {
        setZone('app')
      }
    })
  }, [])

  const enterApp = (mode: AuthMode) => {
    persistAppRoute(mode)
    setAuthMode(mode)
    setZone('app')
  }

  const backToWeb = () => {
    clearAppRouteFromUrl()
    clearReturnToAppFlag()
    setZone('web')
  }

  const switchAuthMode = (mode: AuthMode) => {
    persistAppRoute(mode)
    setAuthMode(mode)
  }

  if (zone === 'app') {
    return (
      <AppZone authMode={authMode} onBack={backToWeb} onSwitchMode={switchAuthMode} />
    )
  }

  return <Web onEnterApp={enterApp} />
}

export default App
