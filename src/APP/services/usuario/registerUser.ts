import { type User } from 'firebase/auth'
import { createUserEmail } from './createUserEmail'
import { signInWithGoogle } from './signInWithGoogle'
import { userExists } from './userExists'

export async function registerUser(): Promise<User> {
  const firebaseUser = await signInWithGoogle('register')
  return finishRegisterUser(firebaseUser)
}

export async function finishRegisterUser(firebaseUser: User): Promise<User> {
  const exists = await userExists(firebaseUser.uid)

  if (!exists) {
    await createUserEmail(firebaseUser.uid, firebaseUser.email!)
  }

  return firebaseUser
}

/** @deprecated Usa registerUser */
export async function startRegisterUser(): Promise<void> {
  await registerUser()
}
