import type { HistorialLlamada } from '../../../models'

export function mapHistorialLlamadaDocument(
  id: string,
  data: Record<string, unknown>,
): HistorialLlamada {
  return {
    id,
    session_id: data.session_id as string,
    tipo: data.tipo as HistorialLlamada['tipo'],
    participante_ids: data.participante_ids as [string, string],
    participante_1_id: data.participante_1_id as string,
    participante_2_id: data.participante_2_id as string,
    participante_1_alias: data.participante_1_alias as string,
    participante_2_alias: data.participante_2_alias as string,
    participante_1_foto: data.participante_1_foto as string,
    participante_2_foto: data.participante_2_foto as string,
    estado: data.estado as HistorialLlamada['estado'],
    duracion_segundos: (data.duracion_segundos as number | undefined) ?? 0,
    finalizada_por_id: data.finalizada_por_id as string,
    creado_en:
      (data.creado_en as { toDate?: () => Date })?.toDate?.() ?? new Date(),
    conectada_en: (data.conectada_en as { toDate?: () => Date })?.toDate?.(),
    finalizada_en:
      (data.finalizada_en as { toDate?: () => Date })?.toDate?.() ?? new Date(),
  }
}

export function getPartnerFromHistorialLlamada(record: HistorialLlamada, userId: string) {
  if (record.participante_1_id === userId) {
    return {
      id: record.participante_2_id,
      alias: record.participante_2_alias,
      foto_url: record.participante_2_foto,
    }
  }

  return {
    id: record.participante_1_id,
    alias: record.participante_1_alias,
    foto_url: record.participante_1_foto,
  }
}
