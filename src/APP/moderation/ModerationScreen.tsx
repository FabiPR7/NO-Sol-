import type { ModerationStatus } from '../../models'
import { formatModerationUntil } from '../services/moderation'
import './ModerationScreen.css'

type ModerationScreenProps = {
  status: ModerationStatus
  onLogout: () => void
}

function ModerationScreen({ status, onLogout }: ModerationScreenProps) {
  const isExpelled = status.type === 'expelled'

  return (
    <div className="moderation-screen">
      <div className="moderation-screen__card">
        <span className="moderation-screen__emoji" aria-hidden="true">
          {isExpelled ? '⛔' : '⏳'}
        </span>

        <h1>{isExpelled ? 'Cuenta expulsada' : 'Cuenta suspendida'}</h1>

        {isExpelled ? (
          <p>
            Tu cuenta ha sido expulsada por acumular demasiadas denuncias. Ya no
            puedes utilizar No+Sol@ con esta cuenta.
          </p>
        ) : (
          <p>
            Has recibido una sanción temporal y no puedes usar la aplicación hasta{' '}
            <strong>
              {status.sancionHasta ? formatModerationUntil(status.sancionHasta) : 'nuevo aviso'}
            </strong>
            .
          </p>
        )}

        {!isExpelled && (
          <p className="moderation-screen__note">
            Las sanciones escalan: 1 día, luego 1 semana y, en casos graves, expulsión
            permanente.
          </p>
        )}

        <button type="button" className="moderation-screen__logout" onClick={onLogout}>
          Salir de la cuenta
        </button>
      </div>
    </div>
  )
}

export default ModerationScreen
