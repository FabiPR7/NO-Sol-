import { signOut, type User } from 'firebase/auth'
import { auth } from '../../../firebase'
import { signInWithGoogle } from './signInWithGoogle'
import { userExists } from './userExists'

export async function loginUser(): Promise<User> {
  const firebaseUser = await signInWithGoogle('login')
  return finishLoginUser(firebaseUser)
}

export async function finishLoginUser(firebaseUser: User): Promise<User> {
  const exists = await userExists(firebaseUser.uid)

  if (!exists) {
    await signOut(auth)
    throw new Error('No existe una cuenta con este correo. Regístrate primero.')
  }

  return firebaseUser
}

/** @deprecated Usa loginUser */
export async function startLoginUser(): Promise<void> {
  await loginUser()
}
