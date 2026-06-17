import type { Chat, ChatMessageTipo } from '../../../models'

export type ChatLastMessagePreview = {
  ultimo_mensaje_tipo: ChatMessageTipo
  ultimo_mensaje_contenido: string
  ultimo_mensaje_emisor_id: string
  ultimo_mensaje_en: Date
}

export function getChatActivityDate(chat: Chat): Date {
  return chat.ultimo_mensaje_en ?? chat.creado_en
}

export function hasChatMessages(chat: Chat): boolean {
  return Boolean(chat.ultimo_mensaje_en && chat.ultimo_mensaje_tipo)
}

export function getChatPreviewText(chat: Chat, userId: string): string | null {
  if (!hasChatMessages(chat) || !chat.ultimo_mensaje_tipo) {
    return null
  }

  let preview = ''

  switch (chat.ultimo_mensaje_tipo) {
    case 'imagen':
      preview = 'Imagen'
      break
    case 'audio':
      preview = 'Audio'
      break
    case 'texto':
      preview = chat.ultimo_mensaje_contenido?.trim() || ''
      break
  }

  if (!preview) {
    return null
  }

  if (chat.ultimo_mensaje_emisor_id === userId) {
    return `Tú: ${preview}`
  }

  return preview
}

export function mergeChatPreview(
  chat: Chat,
  fallback: ChatLastMessagePreview | undefined,
): Chat {
  if (hasChatMessages(chat) || !fallback) {
    return chat
  }

  return {
    ...chat,
    ...fallback,
  }
}
