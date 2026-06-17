import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import {
  DENUNCIAS_COLLECTION,
  type DenunciaInput,
  type ReportReasonCode,
  USERS_COLLECTION,
} from '../../../models'
import { getSanctionForCastigo } from './sanctions'

export class ChatBlockedError extends Error {
  constructor() {
    super('BLOCKED')
    this.name = 'ChatBlockedError'
  }
}

export async function reportUser(input: {
  denuncianteId: string
  denunciadoId: string
  chatId: string
  motivoCodigo: ReportReasonCode
  motivoTexto: string
  detalle?: string
}): Promise<void> {
  const denuncia: DenunciaInput = {
    denunciante_id: input.denuncianteId,
    denunciado_id: input.denunciadoId,
    chat_id: input.chatId,
    motivo_codigo: input.motivoCodigo,
    motivo_texto: input.motivoTexto,
    ...(input.detalle?.trim() ? { detalle: input.detalle.trim() } : {}),
  }

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, USERS_COLLECTION, input.denunciadoId)
    const userSnap = await transaction.get(userRef)
    const currentDenuncias = Number(userSnap.data()?.denuncias_recibidas ?? 0)
    const newDenuncias = currentDenuncias + 1
    const denunciaRef = doc(collection(db, DENUNCIAS_COLLECTION))

    transaction.set(denunciaRef, {
      ...denuncia,
      creado_en: serverTimestamp(),
    })

    const updates: Record<string, unknown> = {
      denuncias_recibidas: newDenuncias,
    }

    if (newDenuncias % 5 === 0) {
      const castigos = Math.floor(newDenuncias / 5)
      const sanction = getSanctionForCastigo(castigos)

      updates.castigos = castigos

      if (sanction.expelled) {
        updates.expulsado = true
        updates.sancion_hasta = null
      } else if (sanction.sancionHasta) {
        updates.sancion_hasta = Timestamp.fromDate(sanction.sancionHasta)
      }
    }

    if (userSnap.exists()) {
      transaction.update(userRef, updates)
    } else {
      transaction.set(userRef, updates, { merge: true })
    }
  })
}
