import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions, httpsCallable } from 'firebase/functions'

let firebaseApp = null

function envVal(key) {
  return import.meta.env[key]
}

function isConfigComplete(config) {
  return Object.values(config).every((v) => typeof v === 'string' && v.length > 0)
}

function createConfigFromEnv() {
  return {
    apiKey: envVal('VITE_FIREBASE_API_KEY'),
    authDomain: envVal('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: envVal('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: envVal('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: envVal('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: envVal('VITE_FIREBASE_APP_ID'),
  }
}

export function getFirebaseApp() {
  if (firebaseApp) return firebaseApp

  const config = createConfigFromEnv()
  if (!isConfigComplete(config)) {
    // Keep dev/build working even without credentials.
    console.warn(
      '[personal-app] Missing Firebase env vars. Set VITE_FIREBASE_* in .env to enable Firebase.'
    )
    return null
  }

  const existing = getApps()
  firebaseApp = existing.length ? existing[0] : initializeApp(config)
  return firebaseApp
}

export function getFirebaseAuth() {
  const app = getFirebaseApp()
  return app ? getAuth(app) : null
}

export function getFirebaseFirestore() {
  const app = getFirebaseApp()
  return app ? getFirestore(app) : null
}

export function getFirebaseStorage() {
  const app = getFirebaseApp()
  return app ? getStorage(app) : null
}

export function getFirebaseFunctions() {
  const app = getFirebaseApp()
  return app ? getFunctions(app) : null
}

export { httpsCallable }

