export interface MensajeChat {
  id: number
  amistar_id: number
  emisor_id: string
  contenido: string
  leido: boolean
  enviado_en: Date
}

export type MensajeChatInput = Omit<MensajeChat, 'id' | 'enviado_en' | 'leido'>
