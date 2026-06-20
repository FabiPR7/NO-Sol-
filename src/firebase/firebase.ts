import { initializeApp } from 'firebase/app'
import {
  browserPopupRedirectResolver,
  getAuth,
  initializeAuth,
} from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'
import { firebaseConfig, isFirebaseConfigured } from './config'

if (!isFirebaseConfigured()) {
  throw new Error(
    'Firebase no está configurado. Revisa las variables VITE_FIREBASE_* en tu archivo .env',
  )
}

export const firebaseApp = initializeApp(firebaseConfig)

function createAuth() {
  try {
    return initializeAuth(firebaseApp, {
      popupRedirectResolver: browserPopupRedirectResolver,
    })
  } catch {
    return getAuth(firebaseApp)
  }
}

export const auth = createAuth()
export const database = getDatabase(firebaseApp)
export const db = getFirestore(firebaseApp)

export const analytics =
  typeof window !== 'undefined' ? getAnalytics(firebaseApp) : null
