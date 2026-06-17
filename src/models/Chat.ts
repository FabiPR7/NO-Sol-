export const CHATS_COLLECTION = 'chats'
export const CHAT_MESSAGES_COLLECTION = 'mensajes'
export const CHAT_TYPING_COLLECTION = 'typing'

export const TYPING_STALE_MS = 5000

export type ChatMessageTipo = 'texto' | 'imagen' | 'audio'

export interface Chat {
  id: string
  participante_ids: [string, string]
  participante_1_id: string
  participante_2_id: string
  participante_1_alias: string
  participante_2_alias: string
  participante_1_foto: string
  participante_2_foto: string
  activo: boolean
  creado_en: Date
  ultimo_mensaje_tipo?: ChatMessageTipo | null
  ultimo_mensaje_contenido?: string
  ultimo_mensaje_emisor_id?: string
  ultimo_mensaje_en?: Date | null
}

export type ChatData = Omit<Chat, 'id' | 'creado_en'>

export interface ChatMessage {
  id: string
  emisor_id: string
  tipo: ChatMessageTipo
  contenido: string
  media_url?: string
  leido: boolean
  enviado_en: Date
}

export type ChatMessageInput = {
  emisor_id: string
  tipo: ChatMessageTipo
  contenido?: string
  media_url?: string
}
