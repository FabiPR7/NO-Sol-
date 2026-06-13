import type { AppUser } from './types/user'
import './AppHome.css'

type AppHomeProps = {
  user: AppUser
  onLogout: () => void
}

function AppHome({ user, onLogout }: AppHomeProps) {
  const firstName = user.name?.split(' ')[0] ?? 'amigo'

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
            alt={user.name ?? user.email}
          />
        )}
        <h1>Hola, {firstName} 👋</h1>
        <p>Ya estás dentro. Pronto podrás elegir tu perfil y encontrar tu match.</p>
        <div className="app-home__chips">
          <span>🌧️ Necesito apoyo</span>
          <span>🌤️ Quiero ayudar</span>
        </div>
      </main>
    </div>
  )
}

export default AppHome
