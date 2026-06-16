import 'server-only'
import {
  initializeApp,
  getApps,
  cert,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/**
 * Parses the Firebase service-account credentials from the environment.
 * Accepts either raw JSON or a base64-encoded JSON string in
 * FIREBASE_SERVICE_ACCOUNT (the latter is convenient for Vercel env vars).
 */
function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return null
  try {
    const json = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8')
    return JSON.parse(json) as ServiceAccount
  } catch {
    return null
  }
}

const serviceAccount = readServiceAccount()

/** True when the Admin SDK can be initialized (server-only). */
export const isAdminConfigured = Boolean(serviceAccount)

let adminApp: App | undefined
let adminAuthInstance: Auth | undefined
let adminDbInstance: Firestore | undefined

if (serviceAccount) {
  adminApp = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) })
  adminAuthInstance = getAuth(adminApp)
  adminDbInstance = getFirestore(adminApp)
}

export const adminAuth = adminAuthInstance
export const adminDb = adminDbInstance
