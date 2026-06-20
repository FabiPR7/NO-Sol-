export const AUDIO_SESSIONS_COLLECTION = 'audio_sessions'

export interface AudioSession {
  id: string
  participante_ids: [string, string]
  participante_1_id: string
  participante_2_id: string
  participante_1_alias: string
  participante_2_alias: string
  participante_1_foto: string
  participante_2_foto: string
  participante_1_descripcion?: string
  participante_2_descripcion?: string
  activo: boolean
  daily_room_url?: string
  chat_id?: string
  iniciador_id?: string
  llamada_aceptada?: boolean
  creado_en: Date
}

export type AudioSessionData = Omit<AudioSession, 'id' | 'creado_en'>
