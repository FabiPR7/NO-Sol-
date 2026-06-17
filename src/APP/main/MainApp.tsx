import { useCallback, useEffect, useState } from 'react'
import AppLogo from '../../components/AppLogo'
import type { Usuario } from '../../models'
import { formatUnreadCount, subscribeToUserUnreadCounts } from '../services/chat'
import { getProfilePhotoUrl } from '../utils/profilePhoto'
import type { AppUser } from '../types/user'
import ChatView from './chat/ChatView'
import VideoCallView from './video/VideoCallView'
import ChatsTab from './tabs/ChatsTab'
import ProfileTab from './tabs/ProfileTab'
import SearchTab from './tabs/SearchTab'
import SettingsTab from './tabs/SettingsTab'
import './MainApp.css'

export type MainTab = 'settings' | 'search' | 'chats' | 'profile'

type MainAppProps = {
  user: AppUser
  profile: Partial<Usuario> | null
  onLogout: () => void
  onProfileUpdated: () => Promise<void>
}

function MainApp({ user, profile, onLogout, onProfileUpdated }: MainAppProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('search')
  const [openChatId, setOpenChatId] = useState<string | null>(null)
  const [openVideoSessionId, setOpenVideoSessionId] = useState<string | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [totalUnread, setTotalUnread] = useState(0)
  const displayName = profile?.alias ?? user.name?.split(' ')[0] ?? 'amigo'
  const avatarUrl = getProfilePhotoUrl(profile, user)

  useEffect(() => {
    return subscribeToUserUnreadCounts(user.uid, (counts, total) => {
      setUnreadCounts(counts)
      setTotalUnread(total)
    })
  }, [user.uid])

  const openChat = useCallback((chatId: string) => {
    setOpenChatId(chatId)
    setActiveTab('chats')
  }, [])

  const closeChat = useCallback(() => {
    setOpenChatId(null)
  }, [])

  const closeVideoCall = useCallback(() => {
    setOpenVideoSessionId(null)
  }, [])

  const handleMatchFound = useCallback(
    (chatId: string) => {
      openChat(chatId)
    },
    [openChat],
  )

  const handleVideoMatchFound = useCallback((sessionId: string) => {
    setOpenVideoSessionId(sessionId)
    setActiveTab('search')
  }, [])

  if (openVideoSessionId) {
    return (
      <div className="main-app main-app--chat-open">
        <VideoCallView
          userId={user.uid}
          sessionId={openVideoSessionId}
          onBack={closeVideoCall}
        />
      </div>
    )
  }

  if (openChatId) {
    return (
      <div className="main-app main-app--chat-open">
        <ChatView userId={user.uid} chatId={openChatId} onBack={closeChat} />
      </div>
    )
  }

  return (
    <div className="main-app">
      <header className="main-app__header">
        <div className="main-app__header-left">
          <AppLogo size="lg" className="main-app__logo" />
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
        {activeTab === 'settings' && (
          <SettingsTab
            user={user}
            profile={profile}
            onFiltersUpdated={onProfileUpdated}
          />
        )}
        {activeTab === 'search' && (
          <SearchTab
            user={user}
            profile={profile}
            onMatchFound={handleMatchFound}
            onVideoMatchFound={handleVideoMatchFound}
          />
        )}
        {activeTab === 'chats' && (
          <ChatsTab
            userId={user.uid}
            unreadCounts={unreadCounts}
            onOpenChat={openChat}
          />
        )}
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
            activeTab === 'settings' ? ' main-app__tab--active' : ''
          }`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="main-app__tab-icon" aria-hidden="true">
            ⚙️
          </span>
          <span>Ajustes</span>
        </button>

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
          <span className="main-app__tab-icon-wrap">
            <span className="main-app__tab-icon" aria-hidden="true">
              💬
            </span>
            {totalUnread > 0 && (
              <span className="main-app__tab-badge" aria-label={`${totalUnread} mensajes no leídos`}>
                {formatUnreadCount(totalUnread)}
              </span>
            )}
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
