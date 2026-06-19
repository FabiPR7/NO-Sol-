import { useCallback, useState } from 'react'
import type { Usuario } from '../../../models'
import TabHero from '../../components/TabHero'
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
      <TabHero
        eyebrow={isHelper ? '🌤️ Modo ayudador' : '🫂 Tu espacio seguro'}
        variant="warm"
        title={
          <>
            Te conectamos con{' '}
            <span className="tab-hero__accent">alguien que encaje contigo</span>
          </>
        }
        lead="Miramos tus gustos, idioma y zona para encontrar a la persona adecuada. Tú decides si prefieres chat o videollamada."
        tags={['Sin juicios', 'A tu ritmo', 'Conexión real']}
      />

      <p className="search-tab__section-label">¿Cómo quieres hablar hoy?</p>

      <div className="search-tab__actions">
        <button
          type="button"
          className="search-tab__card search-tab__card--video"
          onClick={() => startSearch('video')}
        >
          <span className="search-tab__emoji" aria-hidden="true">
            📹
          </span>
          <div className="search-tab__card-body">
            <div className="search-tab__card-head">
              <strong>Videollamada</strong>
              <span className="search-tab__card-tag search-tab__card-tag--teal">
                En vivo
              </span>
            </div>
            <p>Os veis y os escucháis en tiempo real, como en la misma habitación.</p>
          </div>
        </button>

        <button
          type="button"
          className="search-tab__card search-tab__card--chat"
          onClick={() => startSearch('chat')}
        >
          <span className="search-tab__emoji" aria-hidden="true">
            💬
          </span>
          <div className="search-tab__card-body">
            <div className="search-tab__card-head">
              <strong>Chat</strong>
              <span className="search-tab__card-tag search-tab__card-tag--coral">
                Sin prisa
              </span>
            </div>
            <p>Escribe cuando te apetezca, con calma y sin presión.</p>
          </div>
        </button>
      </div>

      {profileError && <p className="search-tab__error">{profileError}</p>}
    </section>
  )
}

export default SearchTab
