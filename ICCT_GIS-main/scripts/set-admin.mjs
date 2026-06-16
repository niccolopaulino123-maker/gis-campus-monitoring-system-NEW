// One-time bootstrap: grant a Firebase user a role (default: admin).
// Solves the chicken-and-egg problem where assigning roles via the API
// requires an existing admin.
//
// Usage (loads .env.local for FIREBASE_SERVICE_ACCOUNT):
//   node --env-file=.env.local scripts/set-admin.mjs you@email.com
//   node --env-file=.env.local scripts/set-admin.mjs you@email.com staff
//
// After running, the user must sign out and back in for the new role to apply.

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const VALID_ROLES = ['admin', 'student', 'maintenance']

const email = process.argv[2]
const role = process.argv[3] ?? 'admin'

if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/set-admin.mjs <email> [role]')
  process.exit(1)
}
if (!VALID_ROLES.includes(role)) {
  console.error(`Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`)
  process.exit(1)
}

const raw = process.env.FIREBASE_SERVICE_ACCOUNT
if (!raw) {
  console.error('FIREBASE_SERVICE_ACCOUNT is not set. Add it to .env.local first.')
  process.exit(1)
}

const json = raw.trim().startsWith('{')
  ? raw
  : Buffer.from(raw, 'base64').toString('utf8')
const serviceAccount = JSON.parse(json)

initializeApp({ credential: cert(serviceAccount) })

const auth = getAuth()
const db = getFirestore()

try {
  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, { role })
  await db
    .collection('users')
    .doc(user.uid)
    .set(
      { uid: user.uid, email, role, updatedAt: new Date().toISOString() },
      { merge: true },
    )
  console.log(`OK: set role "${role}" for ${email} (uid: ${user.uid}).`)
  console.log('The user must sign out and back in for it to take effect.')
  process.exit(0)
} catch (err) {
  console.error('Failed:', err?.message ?? err)
  process.exit(1)
}
