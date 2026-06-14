import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { LANGUAGE_USER_COLLECTION, type LanguageUserInput } from '../../../models'

export async function saveUserLanguages(
  userId: string,
  languageIds: string[],
): Promise<void> {
  const existingQuery = query(
    collection(db, LANGUAGE_USER_COLLECTION),
    where('usuario_id', '==', userId),
  )
  const existingSnapshot = await getDocs(existingQuery)

  const batch = writeBatch(db)

  existingSnapshot.docs.forEach((document) => {
    batch.delete(document.ref)
  })

  languageIds.forEach((languageId) => {
    const data: LanguageUserInput = {
      usuario_id: userId,
      language_id: languageId,
    }

    batch.set(doc(collection(db, LANGUAGE_USER_COLLECTION)), data)
  })

  await batch.commit()
}
