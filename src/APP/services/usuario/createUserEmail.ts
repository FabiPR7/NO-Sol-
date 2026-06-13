import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { USERS_COLLECTION, type UsuarioRegistro } from '../../../models'

export async function createUserEmail(userId: string, email: string): Promise<void> {
  const userData: UsuarioRegistro = { email }

  await setDoc(doc(db, USERS_COLLECTION, userId), userData)
}
