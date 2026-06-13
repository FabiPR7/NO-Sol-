import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { USUARIO_INTERES_COLLECTION, type UsuarioInteresInput } from '../../../models'

export async function saveUserInterests(
  userId: string,
  interestIds: string[],
): Promise<void> {
  const existingQuery = query(
    collection(db, USUARIO_INTERES_COLLECTION),
    where('usuario_id', '==', userId),
  )
  const existingSnapshot = await getDocs(existingQuery)

  const batch = writeBatch(db)

  existingSnapshot.docs.forEach((document) => {
    batch.delete(document.ref)
  })

  interestIds.forEach((interesId) => {
    const data: UsuarioInteresInput = {
      usuario_id: userId,
      interes_id: interesId,
    }

    batch.set(doc(collection(db, USUARIO_INTERES_COLLECTION)), data)
  })

  await batch.commit()
}
