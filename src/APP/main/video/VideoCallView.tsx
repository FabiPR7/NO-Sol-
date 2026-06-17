import DailyIframe, { type DailyCall } from '@daily-co/daily-js'
import { useEffect, useRef, useState } from 'react'
import {
  endVideoSession,
  ensureVideoSessionRoom,
  getVideoSession,
} from '../../services/video'
import { getPartnerFromVideoSession } from '../../services/video/mapVideoSessionDocument'
import './VideoCallView.css'

type VideoCallViewProps = {
  userId: string
  sessionId: string
  onBack: () => void
}

function VideoCallView({ userId, sessionId, onBack }: VideoCallViewProps) {
  const dailyContainerRef = useRef<HTMLDivElement>(null)
  const callFrameRef = useRef<DailyCall | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partnerAlias, setPartnerAlias] = useState('')
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    let cancelled = false

    const prepareCall = async () => {
      try {
        const session = await getVideoSession(sessionId)

        if (!session || !session.activo) {
          if (!cancelled) {
            setError('No se encontró la videollamada.')
          }
          return
        }

        const partner = getPartnerFromVideoSession(session, userId)

        if (!cancelled) {
          setPartnerAlias(partner.alias)
        }

        const url = await ensureVideoSessionRoom(sessionId)

        if (!cancelled) {
          setRoomUrl(url)
        }
      } catch (err) {
        if (!cancelled) {
          setError('No se pudo preparar la videollamada.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void prepareCall()

    return () => {
      cancelled = true
    }
  }, [sessionId, userId])

  useEffect(() => {
    if (!roomUrl || !dailyContainerRef.current) {
      return
    }

    setJoining(true)

    const callFrame = DailyIframe.createFrame(dailyContainerRef.current, {
      showLeaveButton: false,
      showFullscreenButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '16px',
      },
    })

    callFrameRef.current = callFrame

    callFrame
      .join({ url: roomUrl })
      .then(() => {
        setJoining(false)
      })
      .catch(() => {
        setJoining(false)
        setError('No se pudo entrar en la videollamada. Revisa permisos de cámara y micrófono.')
      })

    return () => {
      void callFrame.leave()
      callFrame.destroy()
      callFrameRef.current = null
    }
  }, [roomUrl])

  const handleHangUp = async () => {
    setEnding(true)

    try {
      await callFrameRef.current?.leave()
      callFrameRef.current?.destroy()
      callFrameRef.current = null
      await endVideoSession(sessionId)
      onBack()
    } catch {
      setError('No se pudo colgar la llamada.')
      setEnding(false)
    }
  }

  if (loading) {
    return (
      <section className="video-call">
        <p className="video-call__loading">Preparando videollamada...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="video-call">
        <p className="video-call__error">{error}</p>
        <button type="button" className="video-call__back-btn" onClick={onBack}>
          Volver
        </button>
      </section>
    )
  }

  return (
    <section className="video-call">
      <header className="video-call__header">
        <div className="video-call__header-info">
          <strong>{partnerAlias}</strong>
          <span>{joining ? 'Conectando...' : 'Videollamada en curso'}</span>
        </div>
      </header>

      <div className="video-call__stage">
        <div ref={dailyContainerRef} className="video-call__daily" />
        {joining && <p className="video-call__joining">Activando cámara y micrófono...</p>}
      </div>

      <footer className="video-call__controls">
        <button
          type="button"
          className="video-call__hangup"
          disabled={ending || joining}
          onClick={() => void handleHangUp()}
        >
          Colgar
        </button>
      </footer>
    </section>
  )
}

export default VideoCallView
