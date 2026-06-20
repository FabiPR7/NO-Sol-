import { useCallback, useEffect, useState } from 'react'
import AppLogo from '../../components/AppLogo'
import type { Usuario } from '../../models'
import { formatUnreadCount, subscribeToUserUnreadCounts } from '../services/chat'
import { subscribeToIncomingAudioCalls } from '../services/audio'
import { subscribeToIncomingVideoCalls } from '../services/video'
import { getProfilePhotoUrl } from '../utils/profilePhoto'
import type { AppUser } from '../types/user'
import AudioCallView from './audio/AudioCallView'
import ChatView from './chat/ChatView'
import VideoCallView from './video/VideoCallView'
import ChatsTab from './tabs/ChatsTab'
import HistorialTab from './tabs/HistorialTab'
import ProfileTab from './tabs/ProfileTab'
import SearchTab from './tabs/SearchTab'
import SettingsTab from './tabs/SettingsTab'
import './MainApp.css'

export type MainTab = 'settings' | 'search' | 'chats' | 'history' | 'profile'

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
  const [openAudioSessionId, setOpenAudioSessionId] = useState<string | null>(null)
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

  const closeAudioCall = useCallback(() => {
    setOpenAudioSessionId(null)
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

  const handleAudioMatchFound = useCallback((sessionId: string) => {
    setOpenAudioSessionId(sessionId)
    setActiveTab('search')
  }, [])

  const handleStartVideoCallFromChat = useCallback((sessionId: string) => {
    setOpenVideoSessionId(sessionId)
  }, [])

  const handleStartAudioCallFromChat = useCallback((sessionId: string) => {
    setOpenAudioSessionId(sessionId)
  }, [])

  useEffect(() => {
    if (openVideoSessionId || openAudioSessionId) {
      return
    }

    const unsubscribeVideo = subscribeToIncomingVideoCalls(user.uid, (session) => {
      setOpenVideoSessionId(session.id)
    })

    const unsubscribeAudio = subscribeToIncomingAudioCalls(user.uid, (session) => {
      setOpenAudioSessionId(session.id)
    })

    return () => {
      unsubscribeVideo()
      unsubscribeAudio()
    }
  }, [user.uid, openVideoSessionId, openAudioSessionId])

  if (openAudioSessionId) {
    return (
      <div className="main-app main-app--chat-open">
        <AudioCallView
          userId={user.uid}
          sessionId={openAudioSessionId}
          onBack={closeAudioCall}
        />
      </div>
    )
  }

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
        <ChatView
          userId={user.uid}
          chatId={openChatId}
          onBack={closeChat}
          onStartVideoCall={handleStartVideoCallFromChat}
          onStartAudioCall={handleStartAudioCallFromChat}
        />
      </div>
    )
  }

  return (
    <div className="main-app">
      <header className="main-app__header">
        <button type="button" className="main-app__logout" onClick={onLogout}>
          Salir
        </button>

        <AppLogo size="lg" className="main-app__logo" />

        <button
          type="button"
          className="main-app__profile"
          onClick={() => setActiveTab('profile')}
          aria-label={`Ir a tu perfil, ${displayName}`}
        >
          {avatarUrl ? (
            <img className="main-app__avatar" src={avatarUrl} alt="" />
          ) : (
            <span className="main-app__avatar main-app__avatar--fallback">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="main-app__greeting">
            Hola, <strong>{displayName}</strong>
          </span>
        </button>
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
            onAudioMatchFound={handleAudioMatchFound}
          />
        )}
        {activeTab === 'chats' && (
          <ChatsTab
            userId={user.uid}
            unreadCounts={unreadCounts}
            onOpenChat={openChat}
          />
        )}
        {activeTab === 'history' && (
          <HistorialTab
            userId={user.uid}
            userAlias={profile?.alias ?? user.name ?? 'Usuario'}
            userPhoto={avatarUrl ?? ''}
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
            activeTab === 'history' ? ' main-app__tab--active' : ''
          }`}
          onClick={() => setActiveTab('history')}
        >
          <span className="main-app__tab-icon" aria-hidden="true">
            🕘
          </span>
          <span>Historial</span>
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
