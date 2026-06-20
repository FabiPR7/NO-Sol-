import { useEffect, useMemo, useState } from 'react'
import type { HistorialLlamada, HistorialLlamadaEstado, ReportReasonCode } from '../../../models'
import TabHero from '../../components/TabHero'
import ChatConfirmModal from '../chat/ChatConfirmModal'
import ChatPartnerProfile from '../chat/ChatPartnerProfile'
import ChatReportModal from '../chat/ChatReportModal'
import { findOrCreateChatWithPartner } from '../../services/chat'
import {
  getPartnerFromHistorialLlamada,
  hideCallHistoryForUser,
  subscribeToHiddenHistorialIds,
  subscribeToUserCallHistory,
} from '../../services/callHistory'
import { hasUserReportedPartner, reportUser, UserAlreadyReportedError } from '../../services/moderation'
import {
  IconHistorialChat,
  IconHistorialDelete,
  IconHistorialReport,
  IconHistorialSpinner,
} from './HistorialActionIcons'
import './HistorialTab.css'

type HistorialTabProps = {
  userId: string
  userAlias: string
  userPhoto: string
  onOpenChat: (chatId: string) => void
}

type SelectedPartner = {
  id: string
  alias: string
  foto_url: string
}

function formatHistorialDate(date: Date): string {
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) {
    return 'Sin duración'
  }

  if (seconds < 60) {
    return `${seconds} s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (remainingSeconds === 0) {
    return `${minutes} min`
  }

  return `${minutes} min ${remainingSeconds} s`
}

function getEstadoLabel(estado: HistorialLlamadaEstado): string {
  switch (estado) {
    case 'completada':
      return 'Completada'
    case 'rechazada':
      return 'Rechazada'
    case 'cancelada':
      return 'Cancelada'
    default:
      return estado
  }
}

function getTipoLabel(tipo: HistorialLlamada['tipo']): string {
  return tipo === 'video' ? 'Videollamada' : 'Llamada'
}

function getDetailText(record: HistorialLlamada, userId: string): string {
  if (record.estado === 'completada') {
    return formatDuration(record.duracion_segundos)
  }

  if (record.estado === 'rechazada') {
    return record.finalizada_por_id === userId
      ? 'Rechazaste la llamada'
      : 'No aceptó la llamada'
  }

  return record.finalizada_por_id === userId
    ? 'Cancelaste antes de conectar'
    : 'Se canceló antes de conectar'
}

function HistorialTab({ userId, userAlias, userPhoto, onOpenChat }: HistorialTabProps) {
  const [records, setRecords] = useState<HistorialLlamada[]>([])
  const [hiddenRecordIds, setHiddenRecordIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<SelectedPartner | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<HistorialLlamada | null>(null)
  const [reportRecord, setReportRecord] = useState<HistorialLlamada | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null)
  const [reportedPartnerIds, setReportedPartnerIds] = useState<Set<string>>(new Set())

  const visibleRecords = useMemo(
    () => records.filter((record) => !hiddenRecordIds.has(record.id)),
    [records, hiddenRecordIds],
  )

  useEffect(() => {
    setLoading(true)

    const unsubscribe = subscribeToUserCallHistory(
      userId,
      (nextRecords) => {
        setRecords(nextRecords)
        setLoading(false)
      },
      () => {
        setError('No se pudo cargar tu historial de llamadas.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [userId])

  useEffect(() => {
    return subscribeToHiddenHistorialIds(userId, setHiddenRecordIds)
  }, [userId])

  const openPartnerProfile = (partner: SelectedPartner) => {
    setSelectedPartner(partner)
  }

  const getPartnerFromRecord = (record: HistorialLlamada) =>
    getPartnerFromHistorialLlamada(record, userId)

  const startChatWithPartner = async (record: HistorialLlamada) => {
    const partner = getPartnerFromRecord(record)

    setChatLoadingId(record.id)
    setError(null)

    try {
      const chatId = await findOrCreateChatWithPartner({
        userId,
        userAlias,
        userPhoto,
        partnerId: partner.id,
        partnerAlias: partner.alias,
        partnerPhoto: partner.foto_url,
      })

      onOpenChat(chatId)
    } catch {
      setError('No se pudo abrir el chat.')
    } finally {
      setChatLoadingId(null)
    }
  }

  const confirmDeleteRecord = async () => {
    if (!deleteRecord) {
      return
    }

    setActionLoading(true)
    setError(null)

    try {
      await hideCallHistoryForUser(userId, deleteRecord.id)
      setDeleteRecord(null)
      setNotice('Registro eliminado de tu historial.')
    } catch {
      setError('No se pudo eliminar el registro.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReportClick = async (record: HistorialLlamada) => {
    const partner = getPartnerFromRecord(record)

    if (reportedPartnerIds.has(partner.id)) {
      setNotice('Ya denunciaste a esta persona. Solo puedes hacerlo una vez.')
      return
    }

    const alreadyReported = await hasUserReportedPartner(userId, partner.id)

    if (alreadyReported) {
      setReportedPartnerIds((current) => new Set(current).add(partner.id))
      setNotice('Ya denunciaste a esta persona. Solo puedes hacerlo una vez.')
      return
    }

    setReportRecord(record)
  }

  const handleReportSubmit = async (input: {
    motivoCodigo: ReportReasonCode
    motivoTexto: string
    detalle?: string
  }) => {
    if (!reportRecord) {
      return
    }

    const partner = getPartnerFromRecord(reportRecord)

    setActionLoading(true)
    setError(null)

    try {
      const chatId = await findOrCreateChatWithPartner({
        userId,
        userAlias,
        userPhoto,
        partnerId: partner.id,
        partnerAlias: partner.alias,
        partnerPhoto: partner.foto_url,
      })

      await reportUser({
        denuncianteId: userId,
        denunciadoId: partner.id,
        chatId,
        motivoCodigo: input.motivoCodigo,
        motivoTexto: input.motivoTexto,
        detalle: input.detalle,
      })

      setReportedPartnerIds((current) => new Set(current).add(partner.id))
      setReportRecord(null)
      setNotice('Denuncia enviada. Gracias por ayudarnos a cuidar la comunidad.')
    } catch (err) {
      if (err instanceof UserAlreadyReportedError) {
        setReportedPartnerIds((current) => new Set(current).add(partner.id))
        setReportRecord(null)
        setNotice('Ya denunciaste a esta persona. Solo puedes hacerlo una vez.')
        return
      }

      throw new Error('REPORT_FAILED')
    } finally {
      setActionLoading(false)
    }
  }

  if (selectedPartner) {
    return (
      <ChatPartnerProfile
        partnerId={selectedPartner.id}
        partnerAlias={selectedPartner.alias}
        partnerPhoto={selectedPartner.foto_url}
        backAriaLabel="Volver al historial"
        onBack={() => setSelectedPartner(null)}
      />
    )
  }

  const reportPartner = reportRecord ? getPartnerFromRecord(reportRecord) : null

  return (
    <section className="historial-tab">
      <TabHero
        eyebrow="🕘 Tu memoria"
        variant="cool"
        title={
          <>
            Historial de{' '}
            <span className="tab-hero__accent tab-hero__accent--teal">conexiones</span>
          </>
        }
        lead="Toca una llamada para ver el perfil. Desde ahí puedes chatear, denunciar o eliminar el registro."
      />

      {notice && (
        <p className="historial-tab__notice" role="status">
          {notice}
        </p>
      )}

      {loading && <p className="historial-tab__loading">Cargando historial...</p>}

      {error && <p className="historial-tab__error">{error}</p>}

      {!loading && !error && visibleRecords.length === 0 && (
        <div className="historial-tab__empty">
          <span className="historial-tab__emoji">🕘</span>
          <h2>Todavía no hay llamadas</h2>
          <p>
            Cuando hagas una llamada o videollamada desde Buscar, aparecerá aquí con la
            fecha, la duración y el resultado.
          </p>
        </div>
      )}

      {!loading && visibleRecords.length > 0 && (
        <ul className="historial-tab__list">
          {visibleRecords.map((record) => {
            const partner = getPartnerFromRecord(record)
            const tipoClass =
              record.tipo === 'video'
                ? 'historial-tab__item--video'
                : 'historial-tab__item--audio'
            const isChatLoading = chatLoadingId === record.id
            const isPartnerReported = reportedPartnerIds.has(partner.id)

            return (
              <li key={record.id}>
                <article className={`historial-tab__item ${tipoClass}`}>
                  <button
                    type="button"
                    className="historial-tab__main"
                    onClick={() =>
                      openPartnerProfile({
                        id: partner.id,
                        alias: partner.alias,
                        foto_url: partner.foto_url,
                      })
                    }
                  >
                    <div className="historial-tab__avatar-wrap">
                      {partner.foto_url ? (
                        <img
                          className="historial-tab__avatar"
                          src={partner.foto_url}
                          alt={partner.alias}
                        />
                      ) : (
                        <div className="historial-tab__avatar historial-tab__avatar--fallback">
                          {partner.alias.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <span
                        className="historial-tab__tipo-icon"
                        aria-hidden="true"
                      >
                        {record.tipo === 'video' ? '📹' : '📞'}
                      </span>
                    </div>

                    <div className="historial-tab__item-body">
                      <div className="historial-tab__item-top">
                        <strong>{partner.alias}</strong>
                        <span>{formatHistorialDate(record.finalizada_en)}</span>
                      </div>

                      <div className="historial-tab__meta">
                        <span
                          className={`historial-tab__estado historial-tab__estado--${record.estado}`}
                        >
                          {getEstadoLabel(record.estado)}
                        </span>
                        <span className="historial-tab__tipo">{getTipoLabel(record.tipo)}</span>
                      </div>

                      <p>{getDetailText(record, userId)}</p>
                    </div>
                  </button>

                  <div className="historial-tab__actions" role="group" aria-label={`Acciones con ${partner.alias}`}>
                    <button
                      type="button"
                      className="historial-tab__action historial-tab__action--chat"
                      disabled={isChatLoading || actionLoading}
                      aria-label={`Iniciar chat con ${partner.alias}`}
                      onClick={() => void startChatWithPartner(record)}
                    >
                      <span className="historial-tab__action-icon" aria-hidden="true">
                        {isChatLoading ? (
                          <IconHistorialSpinner className="historial-tab__spinner" />
                        ) : (
                          <IconHistorialChat />
                        )}
                      </span>
                      <span className="historial-tab__action-label">Chat</span>
                    </button>
                    <button
                      type="button"
                      className={`historial-tab__action historial-tab__action--report${
                        isPartnerReported ? ' historial-tab__action--disabled' : ''
                      }`}
                      disabled={actionLoading || isChatLoading || isPartnerReported}
                      aria-label={
                        isPartnerReported
                          ? `Ya denunciaste a ${partner.alias}`
                          : `Denunciar a ${partner.alias}`
                      }
                      onClick={() => void handleReportClick(record)}
                    >
                      <span className="historial-tab__action-icon" aria-hidden="true">
                        <IconHistorialReport />
                      </span>
                      <span className="historial-tab__action-label">
                        {isPartnerReported ? 'Denunciado' : 'Denunciar'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="historial-tab__action historial-tab__action--delete"
                      disabled={actionLoading || isChatLoading}
                      aria-label={`Eliminar llamada con ${partner.alias}`}
                      onClick={() => setDeleteRecord(record)}
                    >
                      <span className="historial-tab__action-icon" aria-hidden="true">
                        <IconHistorialDelete />
                      </span>
                      <span className="historial-tab__action-label">Eliminar</span>
                    </button>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      <ChatConfirmModal
        open={Boolean(deleteRecord)}
        title="¿Eliminar del historial?"
        description={
          deleteRecord
            ? `¿Seguro que quieres quitar la ${getTipoLabel(deleteRecord.tipo).toLowerCase()} con ${getPartnerFromRecord(deleteRecord).alias}? Solo desaparecerá de tu historial.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        danger
        loading={actionLoading}
        onClose={() => setDeleteRecord(null)}
        onConfirm={() => void confirmDeleteRecord()}
      />

      <ChatReportModal
        open={Boolean(reportRecord && reportPartner)}
        partnerAlias={reportPartner?.alias ?? ''}
        submitting={actionLoading}
        onClose={() => setReportRecord(null)}
        onSubmit={handleReportSubmit}
      />
    </section>
  )
}

export default HistorialTab
