import { useState } from 'react'
import type { Usuario } from '../../models'
import { getProfilePhotoUrl } from '../utils/profilePhoto'
import type { AppUser } from '../types/user'
import ChatsTab from './tabs/ChatsTab'
import ProfileTab from './tabs/ProfileTab'
import SearchTab from './tabs/SearchTab'
import './MainApp.css'

export type MainTab = 'search' | 'chats' | 'profile'

type MainAppProps = {
  user: AppUser
  profile: Partial<Usuario> | null
  onLogout: () => void
  onProfileUpdated: () => Promise<void>
}

function MainApp({ user, profile, onLogout, onProfileUpdated }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('search')
  const displayName = profile?.alias ?? user.name?.split(' ')[0] ?? 'amigo'
  const avatarUrl = getProfilePhotoUrl(profile, user)

  return (
    <div className="main-app">
      <header className="main-app__header">
        <div className="main-app__header-left">
          <span className="main-app__logo">No+Sol@</span>
          <p>Hola, {displayName} 👋</p>
        </div>

        <div className="main-app__header-right">
          {avatarUrl ? (
            <img
              className="main-app__avatar"
              src={avatarUrl}
              alt={displayName}
            />
          ) : (
            <div className="main-app__avatar main-app__avatar--fallback">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <button type="button" className="main-app__logout" onClick={onLogout}>
            Salir
          </button>
        </div>
      </header>

      <main className="main-app__content">
        {activeTab === 'search' && <SearchTab profile={profile} />}
        {activeTab === 'chats' && <ChatsTab />}
        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            profile={profile}
            onProfileUpdated={onProfileUpdated}
          />
        )}
      </main>

      <nav className="main-app__tabs" aria-label="Menú principal">
        <button
          type="button"
          className={`main-app__tab${
            activeTab === 'search' ? ' main-app__tab--active' : ''
          }`}
          onClick={() => setActiveTab('search')}
        >
          <span className="main-app__tab-icon" aria-hidden="true">
            🔍
          </span>
          <span>Buscar</span>
        </button>

        <button
          type="button"
          className={`main-app__tab${
            activeTab === 'chats' ? ' main-app__tab--active' : ''
          }`}
          onClick={() => setActiveTab('chats')}
        >
          <span className="main-app__tab-icon" aria-hidden="true">
            💬
          </span>
          <span>Chats</span>
        </button>

        <button
          type="button"
          className={`main-app__tab${
            activeTab === 'profile' ? ' main-app__tab--active' : ''
          }`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="main-app__tab-icon" aria-hidden="true">
            👤
          </span>
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  )
}

export default MainApp
