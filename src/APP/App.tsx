import { isFirebaseConfigured } from '../firebase'
import LoginScreen from './auth/LoginScreen'
import RegisterScreen from './auth/RegisterScreen'
import { useAuth } from './auth/useAuth'
import AppHome from './AppHome'
import type { AuthMode } from './types/user'
import './App.css'

type AppZoneProps = {
  authMode: AuthMode
  onBack: () => void
  onSwitchMode: (mode: AuthMode) => void
}

function AppContent({ authMode, onBack, onSwitchMode }: AppZoneProps) {
  const { user, loading, loginWithGoogle, logout } = useAuth()

  if (loading) {
    return (
      <div className="app-zone app-zone--loading">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!user) {
    if (authMode === 'login') {
      return (
        <LoginScreen
          onBack={onBack}
          onGoRegister={() => onSwitchMode('register')}
          onGoogleSignIn={loginWithGoogle}
        />
      )
    }

    return (
      <RegisterScreen
        onBack={onBack}
        onGoLogin={() => onSwitchMode('login')}
        onGoogleSignIn={loginWithGoogle}
      />
    )
  }

  return <AppHome user={user} onLogout={logout} />
}

function AppZone({ authMode, onBack, onSwitchMode }: AppZoneProps) {
  if (!isFirebaseConfigured()) {
    return (
      <div className="app-zone app-zone--missing">
        <div className="app-zone__missing-card">
          <h1>Falta configurar Firebase</h1>
          <p>
            Revisa las variables <code>VITE_FIREBASE_*</code> en tu archivo{' '}
            <code>.env</code>.
          </p>
          <button type="button" onClick={onBack}>
            Volver a la web
          </button>
        </div>
      </div>
    )
  }

  return <AppContent authMode={authMode} onBack={onBack} onSwitchMode={onSwitchMode} />
}

export default AppZone
