import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import { ApiError, requireRole, toErrorResponse } from '@/lib/apiAuth'
import { USER_ROLES, type UserRecord, type UserRole } from '@/types'

function deps() {
  if (!adminAuth || !adminDb) throw new ApiError(503, 'Server not configured.')
  return { auth: adminAuth, db: adminDb }
}

// GET /api/roles — list all users and their roles (admin only).
export async function GET(req: Request) {
  try {
    await requireRole(req, ['admin'])
    const { auth, db } = deps()

    const { users } = await auth.listUsers(1000)
    const docs = await db.collection('users').get()
    const updatedAtByUid = new Map(
      docs.docs.map((d) => [d.id, (d.data().updatedAt as string) ?? '']),
    )

    const records: UserRecord[] = users.map((u) => ({
      uid: u.uid,
      email: u.email ?? '',
      role: ((u.customClaims?.role as UserRole | undefined) ?? 'student'),
      updatedAt: updatedAtByUid.get(u.uid) ?? '',
    }))
    return NextResponse.json(records)
  } catch (err) {
    return toErrorResponse(err)
  }
}

// POST /api/roles — assign a role to a user by email (admin only).
export async function POST(req: Request) {
  try {
    await requireRole(req, ['admin'])
    const { auth, db } = deps()
    const body = (await req.json()) as Record<string, unknown>

    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const role = body.role as UserRole
    if (!email) throw new ApiError(400, 'email is required.')
    if (!USER_ROLES.includes(role)) throw new ApiError(400, 'Invalid role.')

    let user
    try {
      user = await auth.getUserByEmail(email)
    } catch {
      throw new ApiError(404, `No user found with email ${email}.`)
    }

    // Set the custom claim (used for access control) and mirror to Firestore.
    await auth.setCustomUserClaims(user.uid, { role })
    const updatedAt = new Date().toISOString()
    const record: UserRecord = { uid: user.uid, email, role, updatedAt }
    await db.collection('users').doc(user.uid).set(record, { merge: true })

    return NextResponse.json(record)
  } catch (err) {
    return toErrorResponse(err)
  }
}
