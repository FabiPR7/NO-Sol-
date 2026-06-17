export const VIDEO_SESSIONS_COLLECTION = 'video_sessions'

export interface VideoSession {
  id: string
  participante_ids: [string, string]
  participante_1_id: string
  participante_2_id: string
  participante_1_alias: string
  participante_2_alias: string
  participante_1_foto: string
  participante_2_foto: string
  activo: boolean
  daily_room_url?: string
  creado_en: Date
}

export type VideoSessionData = Omit<VideoSession, 'id' | 'creado_en'>
