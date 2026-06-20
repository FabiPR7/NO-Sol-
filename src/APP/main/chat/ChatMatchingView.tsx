import { useEffect, useState } from 'react'
import type { MatchModo, Usuario } from '../../../models'
import { isMinorAge } from '../../../models'
import { joinMatchQueue, leaveMatchQueue, listenForMatch } from '../../services/match'
import './ChatMatchingView.css'

type MatchingViewProps = {
  userId: string
  profile: Partial<Usuario>
  modo: MatchModo
  onMatched: (sessionId: string) => void
  onCancel: () => void
}

const MATCHING_COPY: Record<
  MatchModo,
  {
    title: string
    searching: string
    matched: string
    hint: string
  }
> = {
  chat: {
    title: 'Buscando tu compañía',
    searching: 'Estamos buscando a alguien compatible contigo...',
    matched: '¡Hay alguien esperándote!',
    hint: 'Unimos a quien necesita compañía con quien quiere acompañar.',
  },
  video: {
    title: 'Preparando tu videollamada',
    searching: 'Buscando a alguien para verte y escucharte...',
    matched: '¡Listo! Entrando en la videollamada...',
    hint: 'Mismos filtros, gustos e idioma que en el chat.',
  },
  audio: {
    title: 'Preparando tu llamada',
    searching: 'Buscando a alguien para hablar por voz...',
    matched: '¡Listo! Entrando en la llamada...',
    hint: 'Mismos filtros, gustos e idioma que en el chat.',
  },
}

function MatchingView({ userId, profile, modo, onMatched, onCancel }: MatchingViewProps) {
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Preparando tu búsqueda...')
  const copy = MATCHING_COPY[modo]

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    const searchStartedAt = Date.now()
    let matched = false

    const start = async () => {
      try {
        setStatus(copy.searching)
        const entry = await joinMatchQueue(userId, profile, modo)

        unsubscribe = listenForMatch(
          userId,
          entry.es_menor,
          modo,
          searchStartedAt,
          (sessionId) => {
            if (matched) return
            matched = true
            setStatus(copy.matched)
            onMatched(sessionId)
          },
          () => {
            setError('No se pudo completar la búsqueda. Inténtalo de nuevo.')
          },
        )
      } catch {
        setError('No se pudo entrar en la cola de búsqueda.')
      }
    }

    void start()

    return () => {
      unsubscribe?.()
      if (!matched) {
        void leaveMatchQueue(userId)
      }
    }
  }, [userId, profile, modo, onMatched])

  const ageLabel = isMinorAge(profile.edad ?? 18)
    ? 'Solo te emparejamos con menores de edad.'
    : 'Solo te emparejamos con mayores de edad.'

  return (
    <section className={`chat-matching chat-matching--${modo}`}>
      <div className="chat-matching__card">
        <div className="chat-matching__spinner" aria-hidden="true" />
        <h1>{copy.title}</h1>
        <p className="chat-matching__status">{status}</p>
        <p className="chat-matching__hint">
          Respetamos tus filtros de ajustes y tu grupo de edad. {ageLabel}
        </p>
        <p className="chat-matching__hint chat-matching__hint--soft">{copy.hint}</p>
        {modo === 'video' && (
          <p className="chat-matching__hint chat-matching__hint--soft">
            En el siguiente paso conectaremos cámara y micrófono.
          </p>
        )}
        {modo === 'audio' && (
          <p className="chat-matching__hint chat-matching__hint--soft">
            En el siguiente paso conectaremos solo el micrófono.
          </p>
        )}

        {error && <p className="chat-matching__error">{error}</p>}

        <button type="button" className="chat-matching__cancel" onClick={onCancel}>
          Cancelar búsqueda
        </button>
      </div>
    </section>
  )
}

type ChatMatchingViewProps = Omit<MatchingViewProps, 'modo'>

function ChatMatchingView(props: ChatMatchingViewProps) {
  return <MatchingView {...props} modo="chat" />
}

export default ChatMatchingView
export { MatchingView }
