import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { ApiError, requireUser, requireRole, toErrorResponse } from '@/lib/apiAuth'
import type { EnvIssue, IssueCategory, IssuePriority } from '@/types'

const CATEGORIES: IssueCategory[] = [
  'waste',
  'drainage',
  'maintenance',
  'electrical',
  'safety',
  'other',
]
const PRIORITIES: IssuePriority[] = ['low', 'medium', 'high']

function db() {
  if (!adminDb) throw new ApiError(503, 'Database not configured.')
  return adminDb
}

// GET /api/issues — list all reports (any authenticated user).
export async function GET(req: Request) {
  try {
    await requireUser(req)
    const snap = await db().collection('issues').orderBy('createdAt', 'desc').get()
    const issues = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EnvIssue)
    return NextResponse.json(issues)
  } catch (err) {
    return toErrorResponse(err)
  }
}

// POST /api/issues — create a report (admin, staff, or maintenance).
export async function POST(req: Request) {
  try {
    const user = await requireRole(req, ['admin', 'student'])
    const body = (await req.json()) as Record<string, unknown>

    if (
      !CATEGORIES.includes(body.category as IssueCategory) ||
      !PRIORITIES.includes(body.priority as IssuePriority) ||
      typeof body.title !== 'string' ||
      typeof body.description !== 'string' ||
      typeof body.locationName !== 'string' ||
      typeof body.lat !== 'number' ||
      typeof body.lng !== 'number'
    ) {
      throw new ApiError(400, 'Invalid issue payload.')
    }

    const now = new Date().toISOString()
    const data = {
      category: body.category as IssueCategory,
      title: body.title.trim(),
      description: body.description.trim(),
      locationName: body.locationName,
      lat: body.lat,
      lng: body.lng,
      priority: body.priority as IssuePriority,
      status: 'open' as const,
      reportedBy: user.email ?? user.uid,
      createdAt: now,
      updatedAt: now,
    }
    const ref = await db().collection('issues').add(data)
    return NextResponse.json({ id: ref.id, ...data }, { status: 201 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
