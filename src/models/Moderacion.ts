export const USER_BLOCKS_COLLECTION = 'user_blocks'
export const DENUNCIAS_COLLECTION = 'denuncias'
export const HIDDEN_CHATS_SUBCOLLECTION = 'chats_ocultos'
export const HIDDEN_HISTORIAL_SUBCOLLECTION = 'historial_oculto'

export type ReportReasonCode = '1' | '2' | '3' | '4' | '5' | '6'

export const REPORT_REASONS: ReadonlyArray<{
  code: ReportReasonCode
  label: string
  requiresDetail?: boolean
}> = [
  { code: '1', label: 'Acoso o insultos' },
  { code: '2', label: 'Contenido inapropiado' },
  { code: '3', label: 'Spam o publicidad' },
  { code: '4', label: 'Suplantación de identidad' },
  { code: '5', label: 'Conducta peligrosa' },
  { code: '6', label: 'Otro motivo', requiresDetail: true },
]

export interface UserBlock {
  id: string
  user_id: string
  blocked_user_id: string
  chat_id: string
  creado_en: Date
}

export interface Denuncia {
  id: string
  denunciante_id: string
  denunciado_id: string
  chat_id: string
  motivo_codigo: ReportReasonCode
  motivo_texto: string
  detalle?: string
  creado_en: Date
}

export type DenunciaInput = Omit<Denuncia, 'id' | 'creado_en'>

export interface HiddenChat {
  chat_id: string
  oculto_en: Date
}

export type ModerationBanType = 'none' | 'temporary' | 'expelled'

export interface ModerationStatus {
  type: ModerationBanType
  sancionHasta: Date | null
  castigos: number
  denunciasRecibidas: number
}
