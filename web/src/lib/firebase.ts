import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  if (!auth.emulatorConfig) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    } catch (error) {
      console.log('Auth emulator connection failed:', error)
    }
  }
  
  if (!db._delegate._databaseId.projectId.includes('demo-')) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080)
    } catch (error) {
      console.log('Firestore emulator connection failed:', error)
    }
  }
  
  if (!storage._delegate._host.includes('localhost')) {
    try {
      connectStorageEmulator(storage, 'localhost', 9199)
    } catch (error) {
      console.log('Storage emulator connection failed:', error)
    }
  }
}

export default app
