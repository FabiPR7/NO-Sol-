import { doc, getDoc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore'
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

export class UserAlreadyReportedError extends Error {
  constructor() {
    super('ALREADY_REPORTED')
    this.name = 'UserAlreadyReportedError'
  }
}

export function getDenunciaDocId(denuncianteId: string, denunciadoId: string): string {
  return `${denuncianteId}_${denunciadoId}`
}

export async function hasUserReportedPartner(
  denuncianteId: string,
  denunciadoId: string,
): Promise<boolean> {
  const snapshot = await getDoc(
    doc(db, DENUNCIAS_COLLECTION, getDenunciaDocId(denuncianteId, denunciadoId)),
  )

  return snapshot.exists()
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

  const denunciaRef = doc(
    db,
    DENUNCIAS_COLLECTION,
    getDenunciaDocId(input.denuncianteId, input.denunciadoId),
  )

  await runTransaction(db, async (transaction) => {
    const existingDenuncia = await transaction.get(denunciaRef)

    if (existingDenuncia.exists()) {
      throw new UserAlreadyReportedError()
    }

    const userRef = doc(db, USERS_COLLECTION, input.denunciadoId)
    const userSnap = await transaction.get(userRef)
    const currentDenuncias = Number(userSnap.data()?.denuncias_recibidas ?? 0)
    const newDenuncias = currentDenuncias + 1

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
