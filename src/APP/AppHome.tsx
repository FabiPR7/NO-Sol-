import type { Usuario } from '../models'
import type { AppUser } from './types/user'
import './AppHome.css'

type AppHomeProps = {
  user: AppUser
  profile: Partial<Usuario> | null
  onLogout: () => void
}

function AppHome({ user, profile, onLogout }: AppHomeProps) {
  const displayName = profile?.alias ?? user.name?.split(' ')[0] ?? 'amigo'
  const rolLabel =
    profile?.rol_enum === 'ayudador' ? '🌤️ Quiero ayudar' : '🌧️ Necesito apoyo'

  return (
    <div className="app-home">
      <header className="app-home__header">
        <span className="app-home__logo">No+Sol@</span>
        <button type="button" className="app-home__logout" onClick={onLogout}>
          Cerrar sesión
        </button>
      </header>

      <main className="app-home__main">
        {user.picture && (
          <img
            className="app-home__avatar"
            src={user.picture}
            alt={displayName}
          />
        )}
        <h1>Hola, {displayName} 👋</h1>
        <p>Ya estás dentro. Pronto te conectaremos con tu match.</p>
        <div className="app-home__chips">
          <span>{rolLabel}</span>
          {profile?.pais && <span>📍 {profile.pais}</span>}
          {profile?.idioma && <span>🗣️ {profile.idioma}</span>}
        </div>
      </main>
    </div>
  )
}

export default AppHome
