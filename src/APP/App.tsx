import { isFirebaseConfigured } from '../firebase'
import LoginScreen from './auth/LoginScreen'
import RegisterScreen from './auth/RegisterScreen'
import { useAuth } from './auth/useAuth'
import MainApp from './main/MainApp'
import InterestsSetupScreen from './onboarding/InterestsSetupScreen'
import LanguagesSetupScreen from './onboarding/LanguagesSetupScreen'
import ProfileSetupScreen from './onboarding/ProfileSetupScreen'
import type { AuthMode } from './types/user'
import './App.css'

type AppZoneProps = {
  authMode: AuthMode
  onBack: () => void
  onSwitchMode: (mode: AuthMode) => void
}

function AppContent({ authMode, onBack, onSwitchMode }: AppZoneProps) {
  const {
    user,
    profile,
    loading,
    profileLoading,
    needsProfileSetup,
    needsInterestsSetup,
    needsLanguagesSetup,
    loginWithGoogle,
    completeProfile,
    completeInterests,
    completeLanguages,
    reloadProfile,
    logout,
  } = useAuth()

  if (loading || (user && profileLoading && !profile)) {
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

  if (needsProfileSetup) {
    return <ProfileSetupScreen user={user} onSubmit={completeProfile} />
  }

  if (needsInterestsSetup) {
    return <InterestsSetupScreen onSubmit={completeInterests} />
  }

  if (needsLanguagesSetup) {
    return <LanguagesSetupScreen onSubmit={completeLanguages} />
  }

  return (
    <MainApp
      user={user}
      profile={profile}
      onLogout={logout}
      onProfileUpdated={reloadProfile}
    />
  )
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
