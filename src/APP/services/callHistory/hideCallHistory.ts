import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { HIDDEN_HISTORIAL_SUBCOLLECTION, USERS_COLLECTION } from '../../../models'

export async function hideCallHistoryForUser(
  userId: string,
  recordId: string,
): Promise<void> {
  await setDoc(
    doc(db, USERS_COLLECTION, userId, HIDDEN_HISTORIAL_SUBCOLLECTION, recordId),
    {
      record_id: recordId,
      oculto_en: serverTimestamp(),
    },
  )
}

export function subscribeToHiddenHistorialIds(
  userId: string,
  onHiddenRecordIds: (recordIds: Set<string>) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, USERS_COLLECTION, userId, HIDDEN_HISTORIAL_SUBCOLLECTION),
    (snapshot) => {
      onHiddenRecordIds(new Set(snapshot.docs.map((document) => document.id)))
    },
    (error) => onError?.(error),
  )
}
