import type { VideoSession } from '../../../models'

export function mapVideoSessionDocument(
  id: string,
  data: Record<string, unknown>,
): VideoSession {
  return {
    id,
    participante_ids: data.participante_ids as [string, string],
    participante_1_id: data.participante_1_id as string,
    participante_2_id: data.participante_2_id as string,
    participante_1_alias: data.participante_1_alias as string,
    participante_2_alias: data.participante_2_alias as string,
    participante_1_foto: data.participante_1_foto as string,
    participante_2_foto: data.participante_2_foto as string,
    participante_1_descripcion: (data.participante_1_descripcion as string | undefined) ?? '',
    participante_2_descripcion: (data.participante_2_descripcion as string | undefined) ?? '',
    activo: data.activo as boolean,
    daily_room_url: (data.daily_room_url as string | undefined) ?? undefined,
    creado_en:
      (data.creado_en as { toDate?: () => Date })?.toDate?.() ?? new Date(),
  }
}

export function getPartnerFromVideoSession(session: VideoSession, userId: string) {
  if (session.participante_1_id === userId) {
    return {
      id: session.participante_2_id,
      alias: session.participante_2_alias,
      foto_url: session.participante_2_foto,
      descripcion: session.participante_2_descripcion ?? '',
    }
  }

  return {
    id: session.participante_1_id,
    alias: session.participante_1_alias,
    foto_url: session.participante_1_foto,
    descripcion: session.participante_1_descripcion ?? '',
  }
}
