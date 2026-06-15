import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { USERS_COLLECTION, type UsuarioFiltrosInput } from '../../../models'

export async function updateUserFilters(
  userId: string,
  filters: UsuarioFiltrosInput,
): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, userId), filters, { merge: true })
}
