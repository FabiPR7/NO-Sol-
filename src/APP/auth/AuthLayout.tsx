import { useState } from 'react'
import AppLogo from '../../components/AppLogo'
import type { AuthMode } from '../types/user'
import './AuthScreen.css'

type AuthLayoutProps = {
  variant: AuthMode
  badge: string
  title: string
  text: string
  image: string
  perks: string[]
  switchLabel: string
  switchAction: string
  onBack: () => void
  onSwitch: () => void
  onGoogleSignIn: (mode: AuthMode) => Promise<void>
}

function AuthLayout({
  variant,
  badge,
  title,
  text,
  image,
  perks,
  switchLabel,
  switchAction,
  onBack,
  onSwitch,
  onGoogleSignIn,
}: AuthLayoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      await onGoogleSignIn(variant)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`auth auth--${variant}`}>
      <aside
        className="auth__visual"
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="auth__visual-shade" />
        <div className="auth__visual-content">
          <AppLogo size="auth" className="auth__visual-logo" />
          <p className="auth__visual-quote">
            Gente de verdad.
            <em> Conversaciones de verdad.</em>
          </p>
          <ul className="auth__visual-list">
            {perks.map((perk) => (
              <li key={perk}>{perk}</li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="auth__panel">
        <button type="button" className="auth__back" onClick={onBack}>
          ← Volver
        </button>

        <div className="auth__panel-inner">
          <span className="auth__badge">{badge}</span>
          <h1>{title}</h1>
          <p className="auth__lead">{text}</p>

          <div className="auth__google-wrap">
            <button
              type="button"
              className="auth__google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <span className="auth__google-icon" aria-hidden="true">G</span>
              {loading
                ? 'Conectando...'
                : variant === 'login'
                  ? 'Iniciar sesión con Google'
                  : 'Registrarse con Google'}
            </button>
          </div>

          {error && <p className="auth__error">{error}</p>}

          <p className="auth__privacy">
            Solo usamos Google para identificarte. Nada de postureo, nada de juicios.
          </p>

          <div className="auth__switch">
            <span>{switchLabel}</span>
            <button type="button" onClick={onSwitch}>
              {switchAction}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
