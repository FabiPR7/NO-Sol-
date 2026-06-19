import Daily, {
  type DailyCall,
  type DailyEventObjectCameraError,
  type DailyEventObjectTrack,
  type DailyParticipant,
} from '@daily-co/daily-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  endVideoSession,
  ensureVideoSessionRoom,
  getVideoSession,
  subscribeToVideoSession,
} from '../../services/video'
import { formatDailyUserMessage } from '../../services/video/dailyApi'
import { getPartnerFromVideoSession } from '../../services/video/mapVideoSessionDocument'
import './VideoCallView.css'

type VideoCallViewProps = {
  userId: string
  sessionId: string
  onBack: () => void
}

type CallPhase = 'loading' | 'invite' | 'prejoin' | 'incall'

function attachParticipantMedia(
  participant: DailyParticipant,
  localVideo: HTMLVideoElement | null,
  remoteVideo: HTMLVideoElement | null,
) {
  const element = participant.local ? localVideo : remoteVideo

  if (!element) {
    return
  }

  const tracks = Object.values(participant.tracks)
    .map((trackEntry) => trackEntry?.persistentTrack)
    .filter((track): track is MediaStreamTrack => Boolean(track))

  if (tracks.length === 0) {
    return
  }

  element.srcObject = new MediaStream(tracks)
  void element.play().catch(() => {})
}

function attachTrackToVideo(
  event: DailyEventObjectTrack,
  localVideo: HTMLVideoElement | null,
  remoteVideo: HTMLVideoElement | null,
) {
  if (!event.participant || !event.track) {
    return
  }

  const element = event.participant.local ? localVideo : remoteVideo

  if (!element) {
    return
  }

  let stream = element.srcObject as MediaStream | null

  if (!stream) {
    stream = new MediaStream()
    element.srcObject = stream
  }

  if (!stream.getTracks().some((track) => track.id === event.track.id)) {
    stream.addTrack(event.track)
  }

  void element.play().catch(() => {})
}

function detachTrackFromVideo(
  event: DailyEventObjectTrack,
  localVideo: HTMLVideoElement | null,
  remoteVideo: HTMLVideoElement | null,
) {
  if (!event.participant || !event.track) {
    return
  }

  const element = event.participant.local ? localVideo : remoteVideo
  const stream = element?.srcObject as MediaStream | null

  if (!stream) {
    return
  }

  const track = stream
    .getTracks()
    .find((currentTrack) => currentTrack.id === event.track.id)

  if (track) {
    stream.removeTrack(track)
  }
}

function hasRemoteParticipant(callObject: DailyCall): boolean {
  return Object.values(callObject.participants()).some(
    (participant) => !participant.local,
  )
}

function getMediaErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim()) {
    return formatDailyUserMessage(error)
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>

    if (typeof record.errorMsg === 'string' && record.errorMsg.trim()) {
      return formatDailyUserMessage(record.errorMsg)
    }

    if (record.errorMsg && typeof record.errorMsg === 'object') {
      const nested = record.errorMsg as Record<string, unknown>

      if (typeof nested.errorMsg === 'string' && nested.errorMsg.trim()) {
        return formatDailyUserMessage(nested.errorMsg)
      }
    }

    if (typeof record.msg === 'string' && record.msg.trim()) {
      return formatDailyUserMessage(record.msg)
    }
  }

  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Permiso denegado. Pulsa el candado en la barra de direcciones y permite cámara y micrófono para este sitio.'
    }

    if (error.name === 'NotFoundError') {
      return 'No se encontró cámara o micrófono en este dispositivo.'
    }

    if (error.name === 'NotReadableError') {
      return 'La cámara o el micrófono están en uso por otra aplicación.'
    }

    if (error.name === 'OverconstrainedError') {
      return 'Tu cámara no admite la configuración pedida. Prueba con otro navegador o dispositivo.'
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return formatDailyUserMessage(error.message)
  }

  return 'No se pudo activar la cámara ni el micrófono.'
}

function getCameraErrorMessage(event: DailyEventObjectCameraError): string {
  const dailyError = event.error

  if (dailyError?.msg) {
    return dailyError.msg
  }

  if (typeof event.errorMsg === 'object' && event.errorMsg?.errorMsg) {
    return event.errorMsg.errorMsg
  }

  return 'No se pudo acceder a la cámara o al micrófono.'
}

async function checkMediaPermissionsGranted(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return false
  }

  if (!navigator.permissions?.query) {
    return false
  }

  try {
    const [camera, microphone] = await Promise.all([
      navigator.permissions.query({ name: 'camera' as PermissionName }),
      navigator.permissions.query({ name: 'microphone' as PermissionName }),
    ])

    return camera.state === 'granted' && microphone.state === 'granted'
  } catch {
    return false
  }
}

async function waitForDailyTeardown() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!Daily.getCallInstance()) {
      return
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 60)
    })
  }
}

async function destroyDailyCall(callObjectRef?: { current: DailyCall | null }) {
  const instances = new Set<DailyCall>()

  if (callObjectRef?.current) {
    instances.add(callObjectRef.current)
  }

  const existing = Daily.getCallInstance()

  if (existing) {
    instances.add(existing)
  }

  for (const callObject of instances) {
    try {
      const state = callObject.meetingState()

      if (state === 'joined-meeting' || state === 'joining-meeting') {
        await callObject.leave()
      }
    } catch {
      // Puede fallar si aún no se unió a la sala.
    }

    try {
      await callObject.destroy()
    } catch {
      // Ignorar errores al destruir instancias huérfanas.
    }
  }

  const leftover = Daily.getCallInstance()

  if (leftover) {
    try {
      await leftover.destroy()
    } catch {
      // Ignorar.
    }
  }

  if (callObjectRef) {
    callObjectRef.current = null
  }

  await waitForDailyTeardown()
}

function assertSecureContext() {
  if (!window.isSecureContext) {
    throw new Error(
      'La cámara requiere HTTPS. Abre la app con https://localhost:5173 o https://TU-IP:5173 (no http).',
    )
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Tu navegador no permite usar cámara ni micrófono.')
  }
}

function VideoCallView({ userId, sessionId, onBack }: VideoCallViewProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const callObjectRef = useRef<DailyCall | null>(null)
  const isStartingRef = useRef(false)
  const endingLocallyRef = useRef(false)
  const [phase, setPhase] = useState<CallPhase>('loading')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partnerAlias, setPartnerAlias] = useState('')
  const [partnerPhoto, setPartnerPhoto] = useState('')
  const [partnerDescription, setPartnerDescription] = useState('')
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [remoteConnected, setRemoteConnected] = useState(false)
  const [ending, setEnding] = useState(false)

  const endForEveryone = useCallback(async () => {
    endingLocallyRef.current = true
    await destroyDailyCall(callObjectRef)
    await endVideoSession(sessionId)
    onBack()
  }, [onBack, sessionId])

  useEffect(() => {
    let cancelled = false

    const prepareCall = async () => {
      try {
        const session = await getVideoSession(sessionId)

        if (!session || !session.activo) {
          if (!cancelled) {
            setError('No se encontró la videollamada.')
            setPhase('invite')
          }
          return
        }

        const partner = getPartnerFromVideoSession(session, userId)

        if (!cancelled) {
          setPartnerAlias(partner.alias)
          setPartnerPhoto(partner.foto_url)
          setPartnerDescription(partner.descripcion?.trim() ?? '')
          setPhase('invite')
        }

        const url = await ensureVideoSessionRoom(sessionId)

        if (!cancelled) {
          setRoomUrl(url)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'No se pudo preparar la videollamada.'
          setError(message)
          setPhase('invite')
        }
      }
    }

    void prepareCall()

    return () => {
      cancelled = true
    }
  }, [sessionId, userId])

  useEffect(() => {
    return subscribeToVideoSession(sessionId, (session) => {
      if (endingLocallyRef.current) {
        return
      }

      if (!session || !session.activo) {
        void destroyDailyCall(callObjectRef).finally(onBack)
      }
    })
  }, [sessionId, onBack])

  useEffect(() => {
    return () => {
      void destroyDailyCall(callObjectRef)
    }
  }, [])

  const handleStartCall = async () => {
    if (!roomUrl || isStartingRef.current) {
      return
    }

    isStartingRef.current = true
    setError(null)
    setJoining(true)
    setPhase('incall')
    setRemoteConnected(false)

    let hasFailed = false

    try {
      assertSecureContext()
      await destroyDailyCall(callObjectRef)

      const callObject = Daily.createCallObject({
        allowMultipleCallInstances: true,
        videoSource: true,
        audioSource: true,
        subscribeToTracksAutomatically: true,
      })

      callObjectRef.current = callObject

      let failed = false

      const failCall = (message: string) => {
        if (failed) {
          return
        }

        failed = true
        hasFailed = true
        void destroyDailyCall(callObjectRef).finally(() => {
          setJoining(false)
          setPhase('prejoin')
          setError(message)
        })
      }

      const onTrackStarted = (event: DailyEventObjectTrack) => {
        attachTrackToVideo(event, localVideoRef.current, remoteVideoRef.current)
      }

      const onTrackStopped = (event: DailyEventObjectTrack) => {
        detachTrackFromVideo(event, localVideoRef.current, remoteVideoRef.current)
      }

      const onJoinedMeeting = () => {
        Object.values(callObject.participants()).forEach((participant) => {
          attachParticipantMedia(
            participant,
            localVideoRef.current,
            remoteVideoRef.current,
          )
        })

        setJoining(false)
        setRemoteConnected(hasRemoteParticipant(callObject))
      }

      const onParticipantJoined = (event: { participant?: DailyParticipant }) => {
        if (!event.participant) {
          return
        }

        attachParticipantMedia(
          event.participant,
          localVideoRef.current,
          remoteVideoRef.current,
        )

        if (!event.participant.local) {
          setRemoteConnected(true)
        }
      }

      const onParticipantLeft = (event: { participant?: { local?: boolean } }) => {
        if (!event.participant?.local) {
          setRemoteConnected(false)

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null
          }
        }
      }

      const onCameraError = (event: DailyEventObjectCameraError) => {
        failCall(getCameraErrorMessage(event))
      }

      const onError = (event: { errorMsg?: string }) => {
        failCall(event.errorMsg ?? 'Error en la videollamada.')
      }

      callObject.on('track-started', onTrackStarted)
      callObject.on('track-stopped', onTrackStopped)
      callObject.on('joined-meeting', onJoinedMeeting)
      callObject.on('participant-joined', onParticipantJoined)
      callObject.on('participant-left', onParticipantLeft)
      callObject.on('camera-error', onCameraError)
      callObject.on('error', onError)

      await callObject.join({
        url: roomUrl,
        startVideoOff: false,
        startAudioOff: false,
      })
    } catch (err) {
      if (!hasFailed) {
        await destroyDailyCall(callObjectRef)
        setJoining(false)
        setPhase('prejoin')
        setError(getMediaErrorMessage(err))
      }
    } finally {
      isStartingRef.current = false
    }
  }

  const handleAccept = async () => {
    setError(null)

    const permissionsGranted = await checkMediaPermissionsGranted()

    if (permissionsGranted) {
      void handleStartCall()
      return
    }

    setPhase('prejoin')
  }

  const handleReject = () => {
    void endForEveryone()
  }

  const handleHangUp = async () => {
    setEnding(true)

    try {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }

      await endForEveryone()
    } catch {
      setError('No se pudo colgar la llamada.')
      setEnding(false)
      endingLocallyRef.current = false
    }
  }

  const statusLabel = (() => {
    if (joining) {
      return 'Conectando...'
    }

    if (remoteConnected) {
      return 'Videollamada en curso'
    }

    return `Esperando a ${partnerAlias || 'tu compañero'}...`
  })()

  const partnerInitial = partnerAlias.charAt(0).toUpperCase() || '?'

  if (phase === 'loading') {
    return (
      <section className="video-call">
        <p className="video-call__loading">Preparando videollamada...</p>
      </section>
    )
  }

  if (phase === 'invite') {
    return (
      <section className="video-call">
        <div className="video-call__invite">
          {error && <p className="video-call__invite-error">{error}</p>}

          {partnerPhoto ? (
            <img
              className="video-call__invite-avatar"
              src={partnerPhoto}
              alt={partnerAlias}
            />
          ) : (
            <span className="video-call__invite-avatar video-call__invite-avatar--fallback">
              {partnerInitial}
            </span>
          )}

          <h2 className="video-call__invite-title">
            ¿Aceptas la videollamada con <strong>{partnerAlias}</strong>?
          </h2>

          {partnerDescription ? (
            <p className="video-call__invite-bio">{partnerDescription}</p>
          ) : (
            <p className="video-call__invite-bio video-call__invite-bio--muted">
              Sin descripción en el perfil.
            </p>
          )}

          <div className="video-call__invite-actions">
            <button
              type="button"
              className="video-call__invite-btn video-call__invite-btn--reject"
              onClick={handleReject}
            >
              Rechazar
            </button>
            <button
              type="button"
              className="video-call__invite-btn video-call__invite-btn--accept"
              disabled={!roomUrl}
              onClick={() => void handleAccept()}
            >
              Aceptar
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (phase === 'prejoin') {
    return (
      <section className="video-call">
        <header className="video-call__header">
          <div className="video-call__header-info">
            <strong>{partnerAlias}</strong>
            <span>Permisos de cámara y micrófono</span>
          </div>
        </header>

        <div className="video-call__prejoin">
          <p className="video-call__prejoin-text">
            Para entrar en la videollamada necesitamos acceso a tu cámara y
            micrófono. El navegador solo lo pedirá esta vez.
          </p>
          {!window.isSecureContext && (
            <p className="video-call__prejoin-warning">
              Estás en HTTP (no seguro). Entra con{' '}
              <strong>https://localhost:5173</strong> o{' '}
              <strong>https://TU-IP:5173</strong>.
            </p>
          )}
          {error && <p className="video-call__prejoin-error">{error}</p>}
          <button
            type="button"
            className="video-call__start-btn"
            disabled={!roomUrl || joining}
            onClick={() => void handleStartCall()}
          >
            Activar cámara y entrar
          </button>
        </div>

        <footer className="video-call__controls">
          <button type="button" className="video-call__back-btn" onClick={handleReject}>
            Cancelar
          </button>
        </footer>
      </section>
    )
  }

  return (
    <section className="video-call">
      <header className="video-call__header">
        <div className="video-call__header-info">
          <strong>{partnerAlias}</strong>
          <span>{statusLabel}</span>
        </div>
      </header>

      <div className="video-call__stage">
        <video
          ref={remoteVideoRef}
          className="video-call__remote"
          autoPlay
          playsInline
        />
        {!remoteConnected && !joining && (
          <p className="video-call__waiting">
            Cuando {partnerAlias || 'tu compañero'} entre, verás su cámara aquí.
          </p>
        )}
        <video
          ref={localVideoRef}
          className="video-call__local"
          autoPlay
          playsInline
          muted
        />
        {joining && (
          <p className="video-call__joining">Activando cámara y micrófono...</p>
        )}
        {error && (
          <p className="video-call__inline-error">{error}</p>
        )}
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
