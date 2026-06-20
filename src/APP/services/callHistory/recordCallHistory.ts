import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import {
  HISTORIAL_LLAMADAS_COLLECTION,
  type AudioSession,
  type HistorialLlamada,
  type HistorialLlamadaEstado,
  type HistorialLlamadaTipo,
  type VideoSession,
} from '../../../models'
import { mapHistorialLlamadaDocument } from './mapHistorialLlamadaDocument'

type CallSession = AudioSession | VideoSession

export type RecordCallHistoryInput = {
  session: CallSession
  tipo: HistorialLlamadaTipo
  finalizadaPorId: string
  estado: HistorialLlamadaEstado
  duracionSegundos: number
  conectadaEn?: Date
}

export async function recordCallHistory(input: RecordCallHistoryInput): Promise<void> {
  const historialRef = doc(db, HISTORIAL_LLAMADAS_COLLECTION, input.session.id)

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(historialRef)

    if (existing.exists()) {
      return
    }

    transaction.set(historialRef, {
      session_id: input.session.id,
      tipo: input.tipo,
      participante_ids: input.session.participante_ids,
      participante_1_id: input.session.participante_1_id,
      participante_2_id: input.session.participante_2_id,
      participante_1_alias: input.session.participante_1_alias,
      participante_2_alias: input.session.participante_2_alias,
      participante_1_foto: input.session.participante_1_foto,
      participante_2_foto: input.session.participante_2_foto,
      estado: input.estado,
      duracion_segundos: input.duracionSegundos,
      finalizada_por_id: input.finalizadaPorId,
      creado_en: input.session.creado_en,
      ...(input.conectadaEn ? { conectada_en: input.conectadaEn } : {}),
      finalizada_en: serverTimestamp(),
    })
  })
}

function sortHistorialByDate(records: HistorialLlamada[]): HistorialLlamada[] {
  return records.sort(
    (a, b) => b.finalizada_en.getTime() - a.finalizada_en.getTime(),
  )
}

export async function listUserCallHistory(userId: string): Promise<HistorialLlamada[]> {
  const snapshot = await getDocs(
    query(
      collection(db, HISTORIAL_LLAMADAS_COLLECTION),
      where('participante_ids', 'array-contains', userId),
    ),
  )

  return sortHistorialByDate(
    snapshot.docs.map((document) =>
      mapHistorialLlamadaDocument(document.id, document.data()),
    ),
  )
}

export function subscribeToUserCallHistory(
  userId: string,
  onRecords: (records: HistorialLlamada[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, HISTORIAL_LLAMADAS_COLLECTION),
      where('participante_ids', 'array-contains', userId),
    ),
    (snapshot) => {
      onRecords(
        sortHistorialByDate(
          snapshot.docs.map((document) =>
            mapHistorialLlamadaDocument(document.id, document.data()),
          ),
        ),
      )
    },
    (error) => onError?.(error),
  )
}
