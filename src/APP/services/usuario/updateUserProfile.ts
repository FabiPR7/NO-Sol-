import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { USERS_COLLECTION, type UsuarioPerfilInput } from '../../../models'

export type UsuarioPerfilUpdate = Partial<UsuarioPerfilInput>

export async function updateUserProfile(
  userId: string,
  profile: UsuarioPerfilUpdate,
): Promise<void> {
  const data: Partial<UsuarioPerfilInput> = {}

  if (profile.alias !== undefined) data.alias = profile.alias
  if (profile.pais !== undefined) data.pais = profile.pais
  if (profile.rol_enum !== undefined) data.rol_enum = profile.rol_enum
  if (profile.foto_url !== undefined) data.foto_url = profile.foto_url

  await setDoc(doc(db, USERS_COLLECTION, userId), data, { merge: true })
}
