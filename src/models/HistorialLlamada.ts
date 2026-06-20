export const HISTORIAL_LLAMADAS_COLLECTION = 'historial_llamadas'

export type HistorialLlamadaTipo = 'audio' | 'video'

export type HistorialLlamadaEstado = 'completada' | 'rechazada' | 'cancelada'

export interface HistorialLlamada {
  id: string
  session_id: string
  tipo: HistorialLlamadaTipo
  participante_ids: [string, string]
  participante_1_id: string
  participante_2_id: string
  participante_1_alias: string
  participante_2_alias: string
  participante_1_foto: string
  participante_2_foto: string
  estado: HistorialLlamadaEstado
  duracion_segundos: number
  finalizada_por_id: string
  creado_en: Date
  conectada_en?: Date
  finalizada_en: Date
}

export type HistorialLlamadaInput = Omit<HistorialLlamada, 'id' | 'finalizada_en'>
