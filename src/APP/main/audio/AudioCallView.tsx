import Daily, {
  type DailyCall,
  type DailyEventObjectCameraError,
  type DailyEventObjectTrack,
  type DailyParticipant,
} from '@daily-co/daily-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioSession, HistorialLlamadaEstado } from '../../../models'
import {
  acceptAudioCall,
  endAudioSession,
  ensureAudioSessionRoom,
  getAudioSession,
  getPartnerFromAudioSession,
  subscribeToAudioSession,
} from '../../services/audio'
import { recordCallHistory } from '../../services/callHistory'
import { formatDailyUserMessage } from '../../services/video/dailyApi'
import './AudioCallView.css'

type AudioCallViewProps = {
  userId: string
  sessionId: string
  onBack: () => void
}

type CallPhase = 'loading' | 'calling' | 'invite' | 'prejoin' | 'incall'

function attachParticipantAudio(
  participant: DailyParticipant,
  remoteAudio: HTMLAudioElement | null,
) {
  if (participant.local || !remoteAudio) {
    return
  }

  const tracks = Object.values(participant.tracks)
    .map((trackEntry) => trackEntry?.persistentTrack)
    .filter((track): track is MediaStreamTrack => Boolean(track))

  if (tracks.length === 0) {
    return
  }

  remoteAudio.srcObject = new MediaStream(tracks)
  void remoteAudio.play().catch(() => {})
}

function attachTrackToAudio(event: DailyEventObjectTrack, remoteAudio: HTMLAudioElement | null) {
  if (!event.participant || event.participant.local || !event.track || !remoteAudio) {
    return
  }

  let stream = remoteAudio.srcObject as MediaStream | null

  if (!stream) {
    stream = new MediaStream()
    remoteAudio.srcObject = stream
  }

  if (!stream.getTracks().some((track) => track.id === event.track.id)) {
    stream.addTrack(event.track)
  }

  void remoteAudio.play().catch(() => {})
}

function detachTrackFromAudio(event: DailyEventObjectTrack, remoteAudio: HTMLAudioElement | null) {
  if (!event.participant || event.participant.local || !event.track || !remoteAudio) {
    return
  }

  const stream = remoteAudio.srcObject as MediaStream | null

  if (!stream) {
    return
  }

  const track = stream.getTracks().find((currentTrack) => currentTrack.id === event.track.id)

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
      return 'Permiso denegado. Pulsa el candado en la barra de direcciones y permite el micrófono para este sitio.'
    }

    if (error.name === 'NotFoundError') {
      return 'No se encontró micrófono en este dispositivo.'
    }

    if (error.name === 'NotReadableError') {
      return 'El micrófono está en uso por otra aplicación.'
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return formatDailyUserMessage(error.message)
  }

  return 'No se pudo activar el micrófono.'
}

function getCameraErrorMessage(event: DailyEventObjectCameraError): string {
  const dailyError = event.error

  if (dailyError?.msg) {
    return dailyError.msg
  }

  if (typeof event.errorMsg === 'object' && event.errorMsg?.errorMsg) {
    return event.errorMsg.errorMsg
  }

  return 'No se pudo acceder al micrófono.'
}

async function checkMicrophonePermissionGranted(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return false
  }

  if (!navigator.permissions?.query) {
    return false
  }

  try {
    const microphone = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    })

    return microphone.state === 'granted'
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
      'El micrófono requiere HTTPS. Abre la app con https://localhost:5173 o https://TU-IP:5173 (no http).',
    )
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Tu navegador no permite usar el micrófono.')
  }
}

function AudioCallView({ userId, sessionId, onBack }: AudioCallViewProps) {
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const callObjectRef = useRef<DailyCall | null>(null)
  const isStartingRef = useRef(false)
  const endingLocallyRef = useRef(false)
  const sessionRef = useRef<AudioSession | null>(null)
  const connectedAtRef = useRef<Date | null>(null)
  const callerJoinTriggeredRef = useRef(false)
  const [phase, setPhase] = useState<CallPhase>('loading')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partnerAlias, setPartnerAlias] = useState('')
  const [partnerPhoto, setPartnerPhoto] = useState('')
  const [partnerDescription, setPartnerDescription] = useState('')
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [remoteConnected, setRemoteConnected] = useState(false)
  const [ending, setEnding] = useState(false)

  const endForEveryone = useCallback(
    async (estado: HistorialLlamadaEstado) => {
      endingLocallyRef.current = true

      const session = sessionRef.current

      if (session) {
        const duracionSegundos = connectedAtRef.current
          ? Math.max(
              0,
              Math.floor((Date.now() - connectedAtRef.current.getTime()) / 1000),
            )
          : 0

        try {
          await recordCallHistory({
            session,
            tipo: 'audio',
            finalizadaPorId: userId,
            estado,
            duracionSegundos,
            conectadaEn: connectedAtRef.current ?? undefined,
          })
        } catch {
          // No bloquear el cierre si falla el historial.
        }
      }

      await destroyDailyCall(callObjectRef)
      await endAudioSession(sessionId)
      onBack()
    },
    [onBack, sessionId, userId],
  )

  useEffect(() => {
    let cancelled = false

    const prepareCall = async () => {
      try {
        const session = await getAudioSession(sessionId)

        if (!session || !session.activo) {
          if (!cancelled) {
            setError('No se encontró la llamada.')
            setPhase('invite')
          }
          return
        }

        sessionRef.current = session

        const partner = getPartnerFromAudioSession(session, userId)

        if (!cancelled) {
          setPartnerAlias(partner.alias)
          setPartnerPhoto(partner.foto_url)
          setPartnerDescription(partner.descripcion?.trim() ?? '')
          setPhase(session.iniciador_id === userId ? 'calling' : 'invite')
        }

        const url = await ensureAudioSessionRoom(sessionId)

        if (!cancelled) {
          setRoomUrl(url)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'No se pudo preparar la llamada.'
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
    return subscribeToAudioSession(sessionId, (session) => {
      if (endingLocallyRef.current) {
        return
      }

      if (!session || !session.activo) {
        void destroyDailyCall(callObjectRef).finally(onBack)
        return
      }

      sessionRef.current = session

      if (
        session.iniciador_id === userId &&
        session.llamada_aceptada &&
        !callerJoinTriggeredRef.current &&
        !isStartingRef.current
      ) {
        callerJoinTriggeredRef.current = true

        void (async () => {
          setError(null)

          const permissionsGranted = await checkMicrophonePermissionGranted()

          if (permissionsGranted) {
            void handleStartCall()
            return
          }

          setPhase('prejoin')
        })()
      }
    })
  }, [sessionId, onBack, userId])

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
        videoSource: false,
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
        attachTrackToAudio(event, remoteAudioRef.current)
      }

      const onTrackStopped = (event: DailyEventObjectTrack) => {
        detachTrackFromAudio(event, remoteAudioRef.current)
      }

      const onJoinedMeeting = () => {
        connectedAtRef.current = new Date()

        Object.values(callObject.participants()).forEach((participant) => {
          attachParticipantAudio(participant, remoteAudioRef.current)
        })

        setJoining(false)
        setRemoteConnected(hasRemoteParticipant(callObject))
      }

      const onParticipantJoined = (event: { participant?: DailyParticipant }) => {
        if (!event.participant) {
          return
        }

        attachParticipantAudio(event.participant, remoteAudioRef.current)

        if (!event.participant.local) {
          setRemoteConnected(true)
        }
      }

      const onParticipantLeft = (event: { participant?: { local?: boolean } }) => {
        if (!event.participant?.local) {
          setRemoteConnected(false)

          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null
          }
        }
      }

      const onCameraError = (event: DailyEventObjectCameraError) => {
        failCall(getCameraErrorMessage(event))
      }

      const onError = (event: { errorMsg?: string }) => {
        failCall(event.errorMsg ?? 'Error en la llamada.')
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
        startVideoOff: true,
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

    if (sessionRef.current?.iniciador_id && sessionRef.current.iniciador_id !== userId) {
      await acceptAudioCall(sessionId)
    }

    const permissionsGranted = await checkMicrophonePermissionGranted()

    if (permissionsGranted) {
      void handleStartCall()
      return
    }

    setPhase('prejoin')
  }

  const handleReject = () => {
    void endForEveryone('rechazada')
  }

  const handleHangUp = async () => {
    setEnding(true)

    try {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
      }

      await endForEveryone('completada')
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
      return 'Llamada en curso'
    }

    return `Esperando a ${partnerAlias || 'tu compañero'}...`
  })()

  const partnerInitial = partnerAlias.charAt(0).toUpperCase() || '?'

  if (phase === 'loading') {
    return (
      <section className="audio-call">
        <p className="audio-call__loading">Preparando llamada...</p>
      </section>
    )
  }

  if (phase === 'calling') {
    return (
      <section className="audio-call">
        <div className="audio-call__invite audio-call__calling">
          {error && <p className="audio-call__invite-error">{error}</p>}

          <div className="audio-call__calling-avatar-wrap">
            {partnerPhoto ? (
              <img
                className="audio-call__invite-avatar"
                src={partnerPhoto}
                alt={partnerAlias}
              />
            ) : (
              <span className="audio-call__invite-avatar audio-call__invite-avatar--fallback">
                {partnerInitial}
              </span>
            )}
          </div>

          <h2 className="audio-call__invite-title">
            Llamando a <strong>{partnerAlias}</strong>...
          </h2>

          <p className="audio-call__invite-bio">
            Esperando a que acepte la llamada.
          </p>

          <div className="audio-call__invite-actions audio-call__invite-actions--single">
            <button
              type="button"
              className="audio-call__invite-btn audio-call__invite-btn--reject"
              onClick={() => void endForEveryone('cancelada')}
            >
              Cancelar
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (phase === 'invite') {
    return (
      <section className="audio-call">
        <div className="audio-call__invite">
          {error && <p className="audio-call__invite-error">{error}</p>}

          {partnerPhoto ? (
            <img
              className="audio-call__invite-avatar"
              src={partnerPhoto}
              alt={partnerAlias}
            />
          ) : (
            <span className="audio-call__invite-avatar audio-call__invite-avatar--fallback">
              {partnerInitial}
            </span>
          )}

          <h2 className="audio-call__invite-title">
            ¿Aceptas la llamada con <strong>{partnerAlias}</strong>?
          </h2>

          {partnerDescription ? (
            <p className="audio-call__invite-bio">{partnerDescription}</p>
          ) : (
            <p className="audio-call__invite-bio audio-call__invite-bio--muted">
              Sin descripción en el perfil.
            </p>
          )}

          <div className="audio-call__invite-actions">
            <button
              type="button"
              className="audio-call__invite-btn audio-call__invite-btn--reject"
              onClick={handleReject}
            >
              Rechazar
            </button>
            <button
              type="button"
              className="audio-call__invite-btn audio-call__invite-btn--accept"
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
      <section className="audio-call">
        <header className="audio-call__header">
          <div className="audio-call__header-info">
            <strong>{partnerAlias}</strong>
            <span>Permiso de micrófono</span>
          </div>
        </header>

        <div className="audio-call__prejoin">
          <p className="audio-call__prejoin-text">
            Para entrar en la llamada necesitamos acceso a tu micrófono. El
            navegador solo lo pedirá esta vez.
          </p>
          {!window.isSecureContext && (
            <p className="audio-call__prejoin-warning">
              Estás en HTTP (no seguro). Entra con{' '}
              <strong>https://localhost:5173</strong> o{' '}
              <strong>https://TU-IP:5173</strong>.
            </p>
          )}
          {error && <p className="audio-call__prejoin-error">{error}</p>}
          <button
            type="button"
            className="audio-call__start-btn"
            disabled={!roomUrl || joining}
            onClick={() => void handleStartCall()}
          >
            Activar micrófono y entrar
          </button>
        </div>

        <footer className="audio-call__controls">
          <button type="button" className="audio-call__back-btn" onClick={() => void endForEveryone('cancelada')}>
            Cancelar
          </button>
        </footer>
      </section>
    )
  }

  return (
    <section className="audio-call">
      <header className="audio-call__header">
        <div className="audio-call__header-info">
          <strong>{partnerAlias}</strong>
          <span>{statusLabel}</span>
        </div>
      </header>

      <div className="audio-call__stage">
        <div
          className={`audio-call__avatar-wrap${
            remoteConnected ? ' audio-call__avatar-wrap--live' : ''
          }`}
        >
          {partnerPhoto ? (
            <img className="audio-call__avatar" src={partnerPhoto} alt={partnerAlias} />
          ) : (
            <span className="audio-call__avatar audio-call__avatar--fallback">
              {partnerInitial}
            </span>
          )}
          <span className="audio-call__phone-icon" aria-hidden="true">
            📞
          </span>
        </div>

        {!remoteConnected && !joining && (
          <p className="audio-call__waiting">
            Cuando {partnerAlias || 'tu compañero'} entre, escucharás su voz.
          </p>
        )}

        {joining && <p className="audio-call__joining">Activando micrófono...</p>}
        {error && <p className="audio-call__inline-error">{error}</p>}
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline />

      <footer className="audio-call__controls">
        <button
          type="button"
          className="audio-call__hangup"
          disabled={ending || joining}
          onClick={() => void handleHangUp()}
        >
          Colgar
        </button>
      </footer>
    </section>
  )
}

export default AudioCallView
