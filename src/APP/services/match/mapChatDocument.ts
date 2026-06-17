import type { Chat } from '../../../models'

export function mapChatDocument(id: string, data: Record<string, unknown>): Chat {
  const ultimoMensajeEnRaw = data.ultimo_mensaje_en as { toDate?: () => Date } | Date | null | undefined

  return {
    id,
    participante_ids: data.participante_ids as [string, string],
    participante_1_id: data.participante_1_id as string,
    participante_2_id: data.participante_2_id as string,
    participante_1_alias: data.participante_1_alias as string,
    participante_2_alias: data.participante_2_alias as string,
    participante_1_foto: data.participante_1_foto as string,
    participante_2_foto: data.participante_2_foto as string,
    activo: data.activo as boolean,
    creado_en:
      (data.creado_en as { toDate?: () => Date })?.toDate?.() ?? new Date(),
    ultimo_mensaje_tipo: (data.ultimo_mensaje_tipo as Chat['ultimo_mensaje_tipo']) ?? null,
    ultimo_mensaje_contenido: (data.ultimo_mensaje_contenido as string | undefined) ?? '',
    ultimo_mensaje_emisor_id: (data.ultimo_mensaje_emisor_id as string | undefined) ?? '',
    ultimo_mensaje_en:
      ultimoMensajeEnRaw instanceof Date
        ? ultimoMensajeEnRaw
        : ultimoMensajeEnRaw?.toDate?.() ?? null,
  }
}

export function getPartnerFromChat(chat: Chat, userId: string) {
  if (chat.participante_1_id === userId) {
    return {
      id: chat.participante_2_id,
      alias: chat.participante_2_alias,
      foto_url: chat.participante_2_foto,
    }
  }

  return {
    id: chat.participante_1_id,
    alias: chat.participante_1_alias,
    foto_url: chat.participante_1_foto,
  }
}
