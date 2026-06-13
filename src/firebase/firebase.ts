import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
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
export const auth = getAuth(firebaseApp)
export const database = getDatabase(firebaseApp)
export const db = getFirestore(firebaseApp)

export const analytics =
  typeof window !== 'undefined' ? getAnalytics(firebaseApp) : null
