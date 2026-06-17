import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import './ChatAudioMessage.css'

type ChatAudioMessageProps = {
  src: string
  isMine: boolean
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function ChatAudioMessage({ src, isMine }: ChatAudioMessageProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [src])

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }

    try {
      await audio.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  const handleSeek = (event: MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return

    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))

    audio.currentTime = ratio * duration
    setCurrentTime(audio.currentTime)
  }

  return (
    <div className={`chat-audio${isMine ? ' chat-audio--mine' : ' chat-audio--theirs'}`}>
      <button
        type="button"
        className="chat-audio__play"
        onClick={() => void togglePlay()}
        aria-label={playing ? 'Pausar audio' : 'Reproducir audio'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4.5" height="14" rx="1.2" />
            <rect x="13.5" y="5" width="4.5" height="14" rx="1.2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.8v12.4c0 .9 1 .4 1.5-.2l8.2-6a1 1 0 0 0 0-1.6l-8.2-6c-.5-.6-1.5-1.1-1.5-.2Z" />
          </svg>
        )}
      </button>

      <div className="chat-audio__content">
        <div className="chat-audio__wave" aria-hidden="true">
          {[3, 5, 8, 4, 7, 5, 9, 4, 6, 8, 5, 7, 4, 6].map((height, index) => (
            <span
              key={index}
              className={playing ? 'chat-audio__bar chat-audio__bar--active' : 'chat-audio__bar'}
              style={{ '--bar-height': `${height * 2}px` } as CSSProperties}
            />
          ))}
        </div>

        <div
          className="chat-audio__track"
          onClick={handleSeek}
          role="slider"
          aria-label="Progreso del audio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div className="chat-audio__track-fill" style={{ width: `${progress}%` }} />
          <div className="chat-audio__track-thumb" style={{ left: `${progress}%` }} />
        </div>

        <div className="chat-audio__meta">
          <span className="chat-audio__label">Mensaje de voz</span>
          <span className="chat-audio__time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration)
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime)
        }}
        onEnded={() => {
          setPlaying(false)
          setCurrentTime(0)

          if (audioRef.current) {
            audioRef.current.currentTime = 0
          }
        }}
      />
    </div>
  )
}

export default ChatAudioMessage
