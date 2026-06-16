// DANGER: Resets the database. Deletes ALL issues and ALL users (Firestore
// docs + Firebase Auth accounts), then re-seeds the 3 default accounts.
// This is IRREVERSIBLE.
//
// Usage (loads .env.local for FIREBASE_SERVICE_ACCOUNT):
//   node --env-file=.env.local scripts/reset-db.mjs --yes
//
// The --yes flag is required so the wipe never runs by accident.

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

if (!process.argv.includes('--yes')) {
  console.error(
    'Refusing to run without --yes. This DELETES all issues and users.\n' +
      '  node --env-file=.env.local scripts/reset-db.mjs --yes',
  )
  process.exit(1)
}

// Default accounts to (re)create after the wipe.
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
const KEEP_EMAILS = new Set(SEED_USERS.map((u) => u.email.toLowerCase()))

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

/** Deletes every document in a collection in batches of 500. */
async function deleteCollection(name) {
  const snap = await db.collection(name).get()
  console.log(`Deleting ${snap.size} doc(s) from "${name}"…`)
  let batch = db.batch()
  let count = 0
  for (const doc of snap.docs) {
    batch.delete(doc.ref)
    count++
    if (count % 500 === 0) {
      await batch.commit()
      batch = db.batch()
    }
  }
  if (count % 500 !== 0) await batch.commit()
}

/** Deletes all Firebase Auth users except the default seed accounts. */
async function deleteNonDefaultAuthUsers() {
  let pageToken
  const toDelete = []
  do {
    const res = await auth.listUsers(1000, pageToken)
    for (const u of res.users) {
      if (!KEEP_EMAILS.has((u.email ?? '').toLowerCase())) {
        toDelete.push(u.uid)
      }
    }
    pageToken = res.pageToken
  } while (pageToken)

  console.log(`Deleting ${toDelete.length} Auth account(s) (keeping defaults)…`)
  for (let i = 0; i < toDelete.length; i += 1000) {
    await auth.deleteUsers(toDelete.slice(i, i + 1000))
  }
}

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
      console.log(`Exists   ${email} (updating name)`)
    } else {
      throw err
    }
  }

  await auth.setCustomUserClaims(user.uid, { role })
  const isStudent = role === 'student'
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    name: displayName,
    role,
    photoURL: '',
    year: isStudent ? year : '',
    section: isStudent ? section : '',
    studentNumber: isStudent ? studentNumber : '',
    updatedAt: new Date().toISOString(),
  })
  console.log(`  -> role: ${role}`)
}

try {
  console.log('--- RESET START ---')
  await deleteCollection('issues')
  await deleteCollection('users')
  await deleteNonDefaultAuthUsers()

  console.log('\nRe-seeding default accounts…')
  for (const u of SEED_USERS) {
    await upsertUser(u)
  }

  console.log('\nReset complete. Default password for all seeded users:')
  console.log(`  ${DEFAULT_PASSWORD}`)
  process.exit(0)
} catch (err) {
  console.error('Reset failed:', err?.message ?? err)
  process.exit(1)
}
