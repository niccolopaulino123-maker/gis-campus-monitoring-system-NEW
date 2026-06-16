import 'server-only'
import { NextResponse } from 'next/server'
import { adminAuth, isAdminConfigured } from './firebaseAdmin'
import type { UserRole } from '@/types'

export interface AuthedUser {
  uid: string
  email: string | null
  role: UserRole | null
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Verifies the Firebase ID token from the `Authorization: Bearer <token>`
 * header and returns the authenticated user (including their `role` claim).
 * Throws an ApiError with the appropriate HTTP status on failure.
 */
export async function requireUser(req: Request): Promise<AuthedUser> {
  if (!isAdminConfigured || !adminAuth) {
    throw new ApiError(
      503,
      'Server auth is not configured. Set FIREBASE_SERVICE_ACCOUNT.',
    )
  }

  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw new ApiError(401, 'Missing bearer token.')

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: (decoded.role as UserRole | undefined) ?? null,
    }
  } catch {
    throw new ApiError(401, 'Invalid or expired token.')
  }
}

/** Ensures the authenticated user has one of the allowed roles. */
export async function requireRole(
  req: Request,
  allowed: UserRole[],
): Promise<AuthedUser> {
  const user = await requireUser(req)
  if (!user.role || !allowed.includes(user.role)) {
    throw new ApiError(403, `Requires role: ${allowed.join(' or ')}.`)
  }
  return user
}

/** Converts thrown errors into a JSON error response for route handlers. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  const message = err instanceof Error ? err.message : 'Internal server error.'
  return NextResponse.json({ error: message }, { status: 500 })
}
