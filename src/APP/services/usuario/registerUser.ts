import { type User } from 'firebase/auth'
import { createUserEmail } from './createUserEmail'
import { formatAuthError } from './formatAuthError'
import { signInWithGoogle } from './signInWithGoogle'
import { userExists } from './userExists'

export async function registerUser(): Promise<User> {
  const firebaseUser = await signInWithGoogle('register')
  return finishRegisterUser(firebaseUser)
}

export async function finishRegisterUser(firebaseUser: User): Promise<User> {
  let exists = false

  try {
    exists = await userExists(firebaseUser.uid)
  } catch (error) {
    throw new Error(formatAuthError(error))
  }

  if (!exists) {
    try {
      await createUserEmail(firebaseUser.uid, firebaseUser.email!)
    } catch (error) {
      throw new Error(formatAuthError(error))
    }
  }

  return firebaseUser
}

/** @deprecated Usa registerUser */
export async function startRegisterUser(): Promise<void> {
  await registerUser()
}
