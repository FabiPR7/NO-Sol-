import { useCallback, useState } from 'react'
import type { Usuario } from '../../../models'
import type { AppUser } from '../../types/user'
import ChatMatchingView from '../chat/ChatMatchingView'
import VideoMatchingView from '../video/VideoMatchingView'
import './SearchTab.css'

type SearchMode = 'chat' | 'video' | null

type SearchTabProps = {
  user: AppUser
  profile: Partial<Usuario> | null
  onMatchFound: (chatId: string) => void
  onVideoMatchFound: (sessionId: string) => void
}

function SearchTab({ user, profile, onMatchFound, onVideoMatchFound }: SearchTabProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const isHelper = profile?.rol_enum === 'ayudador'
  const profileReady = Boolean(
    profile?.rol_enum && profile?.sexo && profile?.edad && profile?.alias,
  )

  const handleChatMatched = useCallback(
    (chatId: string) => {
      setSearchMode(null)
      onMatchFound(chatId)
    },
    [onMatchFound],
  )

  const handleVideoMatched = useCallback(
    (sessionId: string) => {
      setSearchMode(null)
      onVideoMatchFound(sessionId)
    },
    [onVideoMatchFound],
  )

  const handleCancelSearch = useCallback(() => {
    setSearchMode(null)
  }, [])

  const startSearch = (mode: Exclude<SearchMode, null>) => {
    setProfileError(null)

    if (!profileReady || !profile) {
      setProfileError('Completa tu perfil (rol, sexo y edad) antes de buscar.')
      return
    }

    setSearchMode(mode)
  }

  if (searchMode === 'chat' && profile) {
    return (
      <ChatMatchingView
        userId={user.uid}
        profile={profile}
        onMatched={handleChatMatched}
        onCancel={handleCancelSearch}
      />
    )
  }

  if (searchMode === 'video' && profile) {
    return (
      <VideoMatchingView
        userId={user.uid}
        profile={profile}
        onMatched={handleVideoMatched}
        onCancel={handleCancelSearch}
      />
    )
  }

  return (
    <section className="search-tab">
      <div className="search-tab__hero">
        <span className="search-tab__badge">
          {isHelper ? '🌤️ Modo ayudador' : '🌧️ Modo apoyo'}
        </span>
        <h1>Busca tu amigo/a</h1>
        <p>
          Te conectamos con alguien compatible por tus gustos, idioma y zona.
          Elige cómo quieres hablar hoy.
        </p>
      </div>

      <div className="search-tab__actions">
        <button
          type="button"
          className="search-tab__card search-tab__card--video"
          onClick={() => startSearch('video')}
        >
          <span className="search-tab__emoji">📹</span>
          <div>
            <strong>Videollamada</strong>
            <p>Cara a cara, en tiempo real.</p>
          </div>
        </button>

        <button
          type="button"
          className="search-tab__card search-tab__card--chat"
          onClick={() => startSearch('chat')}
        >
          <span className="search-tab__emoji">💬</span>
          <div>
            <strong>Chat</strong>
            <p>Escribe a tu ritmo, sin prisa.</p>
          </div>
        </button>
      </div>

      {profileError && <p className="search-tab__error">{profileError}</p>}

      <div className="search-tab__info">
        <p>🫂 Conexión real · Sin juicios · A tu ritmo</p>
      </div>
    </section>
  )
}

export default SearchTab
