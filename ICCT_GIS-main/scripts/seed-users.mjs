// Seeds default users (one per role) into Firebase Auth + the `users`
// Firestore collection. Idempotent: existing users are updated, not duplicated.
//
// Usage (loads .env.local for FIREBASE_SERVICE_ACCOUNT):
//   node --env-file=.env.local scripts/seed-users.mjs
//
// Users must sign out / in after a role change for it to take effect.

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Default accounts — change the password before using in production.
const DEFAULT_PASSWORD = 'ICCTgis2026!'
const SEED_USERS = [
  { email: 'admin@icct.edu.ph', role: 'admin', displayName: 'Campus Admin' },
  {
    email: 'student@icct.edu.ph',
    role: 'student',
    displayName: 'Student Reporter',
    studentNumber: '2023-00001',
    year: '1st Year',
    section: 'BSIT-1A',
  },
  { email: 'maintenance@icct.edu.ph', role: 'maintenance', displayName: 'Maintenance' },
]

const raw = process.env.FIREBASE_SERVICE_ACCOUNT
if (!raw) {
  console.error('FIREBASE_SERVICE_ACCOUNT is not set. Add it to .env.local first.')
  process.exit(1)
}
const json = raw.trim().startsWith('{')
  ? raw
  : Buffer.from(raw, 'base64').toString('utf8')

initializeApp({ credential: cert(JSON.parse(json)) })
const auth = getAuth()
const db = getFirestore()

async function upsertUser({
  email,
  role,
  displayName,
  studentNumber = '',
  year = '',
  section = '',
}) {
  let user
  try {
    user = await auth.createUser({
      email,
      password: DEFAULT_PASSWORD,
      displayName,
      emailVerified: true,
    })
    console.log(`Created  ${email}`)
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      user = await auth.getUserByEmail(email)
      // Keep the Auth display name in sync so the profile matches Firestore.
      await auth.updateUser(user.uid, { displayName })
      console.log(`Exists   ${email} (updating name + role)`)
    } else {
      throw err
    }
  }

  await auth.setCustomUserClaims(user.uid, { role })
  const isStudent = role === 'student'
  await db
    .collection('users')
    .doc(user.uid)
    .set(
      {
        uid: user.uid,
        email,
        name: displayName,
        role,
        photoURL: '',
        year: isStudent ? year : '',
        section: isStudent ? section : '',
        studentNumber: isStudent ? studentNumber : '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    )
  console.log(`  -> role: ${role}`)
}

try {
  for (const u of SEED_USERS) {
    await upsertUser(u)
  }
  console.log('\nSeed complete. Default password for all seeded users:')
  console.log(`  ${DEFAULT_PASSWORD}`)
  console.log('Tell users to sign out/in if a role was changed.')
  process.exit(0)
} catch (err) {
  console.error('Seed failed:', err?.message ?? err)
  process.exit(1)
}
