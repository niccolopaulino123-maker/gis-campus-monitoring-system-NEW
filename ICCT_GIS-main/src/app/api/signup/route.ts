import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import { ApiError, toErrorResponse } from '@/lib/apiAuth'
import { STUDENT_YEARS, type UserRecord } from '@/types'

function deps() {
  if (!adminAuth || !adminDb) throw new ApiError(503, 'Server not configured.')
  return { auth: adminAuth, db: adminDb }
}

// POST /api/signup — public student self-registration. Always creates a
// STUDENT account; role can never be chosen by the caller.
export async function POST(req: Request) {
  try {
    const { auth, db } = deps()
    const body = (await req.json()) as Record<string, unknown>

    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const studentNumber =
      typeof body.studentNumber === 'string' ? body.studentNumber.trim() : ''
    const yearInput = typeof body.year === 'string' ? body.year : ''
    const section = typeof body.section === 'string' ? body.section.trim() : ''

    if (!email) throw new ApiError(400, 'Email is required.')
    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters.')
    }
    if (!name) throw new ApiError(400, 'Name is required.')
    if (!studentNumber) throw new ApiError(400, 'Student number is required.')
    if (!section) throw new ApiError(400, 'Section is required.')

    const year = (STUDENT_YEARS as readonly string[]).includes(yearInput)
      ? yearInput
      : STUDENT_YEARS[0]

    let user
    try {
      user = await auth.createUser({ email, password, displayName: name })
    } catch (err) {
      if ((err as { code?: string })?.code === 'auth/email-already-exists') {
        throw new ApiError(409, 'An account with this email already exists.')
      }
      if ((err as { code?: string })?.code === 'auth/invalid-email') {
        throw new ApiError(400, 'That email address is invalid.')
      }
      throw err
    }

    // Public sign-up is locked to the student role.
    await auth.setCustomUserClaims(user.uid, { role: 'student' })
    const updatedAt = new Date().toISOString()
    const record: UserRecord = {
      uid: user.uid,
      email,
      name,
      role: 'student',
      photoURL: '',
      year,
      section,
      studentNumber,
      updatedAt,
    }
    await db.collection('users').doc(user.uid).set(record)

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
