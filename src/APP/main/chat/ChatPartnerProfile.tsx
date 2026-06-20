import { useEffect, useState } from 'react'
import type { Interes } from '../../../models'
import { getUserInterests } from '../../services/interes'
import { getUserProfile } from '../../services/usuario'
import './ChatPartnerProfile.css'

type ChatPartnerProfileProps = {
  partnerId: string
  partnerAlias: string
  partnerPhoto: string
  onBack: () => void
  backAriaLabel?: string
}

function ChatPartnerProfile({
  partnerId,
  partnerAlias,
  partnerPhoto,
  onBack,
  backAriaLabel = 'Volver al chat',
}: ChatPartnerProfileProps) {
  const [descripcion, setDescripcion] = useState<string | null>(null)
  const [interests, setInterests] = useState<Interes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const photoUrl = partnerPhoto.trim()
  const displayName = partnerAlias.trim() || 'Usuario'

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([getUserProfile(partnerId), getUserInterests(partnerId)])
      .then(([profile, userInterests]) => {
        setDescripcion(profile.descripcion?.trim() ?? '')
        setInterests(userInterests)
      })
      .catch(() => setError('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false))
  }, [partnerId])

  return (
    <section className="chat-partner-profile">
      <header className="chat-partner-profile__header">
        <button
          type="button"
          className="chat-partner-profile__back"
          onClick={onBack}
          aria-label={backAriaLabel}
        >
          ←
        </button>
        <h1>Perfil</h1>
      </header>

      <div className="chat-partner-profile__content">
        <div className="chat-partner-profile__hero">
          <div className="chat-partner-profile__avatar-wrap">
            {photoUrl ? (
              <img
                className="chat-partner-profile__avatar"
                src={photoUrl}
                alt={displayName}
              />
            ) : (
              <div className="chat-partner-profile__avatar chat-partner-profile__avatar--fallback">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2>{displayName}</h2>
          <span className="chat-partner-profile__chip">
            <span className="chat-partner-profile__chip-dot" aria-hidden="true" />
            Compañía activa
          </span>
        </div>

        {loading ? (
          <p className="chat-partner-profile__status">Cargando perfil...</p>
        ) : (
          <>
            {error && <p className="chat-partner-profile__error">{error}</p>}

            <div className="chat-partner-profile__card chat-partner-profile__card--bio">
              <div className="chat-partner-profile__card-head">
                <span className="chat-partner-profile__card-icon" aria-hidden="true">
                  ✨
                </span>
                <h3>Sobre {displayName.split(' ')[0]}</h3>
              </div>
              {descripcion ? (
                <p className="chat-partner-profile__bio">{descripcion}</p>
              ) : (
                <p className="chat-partner-profile__empty">
                  Aún no ha escrito una descripción.
                </p>
              )}
            </div>

            <div className="chat-partner-profile__card chat-partner-profile__card--interests">
              <div className="chat-partner-profile__card-head">
                <span className="chat-partner-profile__card-icon" aria-hidden="true">
                  💛
                </span>
                <h3>Gustos</h3>
              </div>
              {interests.length > 0 ? (
                <div className="chat-partner-profile__bubbles">
                  {interests.map((interes) => (
                    <span key={interes.id} className="chat-partner-profile__bubble">
                      {interes.nombre}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="chat-partner-profile__empty">
                  No ha indicado gustos todavía.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default ChatPartnerProfile
