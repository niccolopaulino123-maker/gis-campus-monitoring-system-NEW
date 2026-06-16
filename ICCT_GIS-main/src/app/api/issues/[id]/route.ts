import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { ApiError, requireRole, toErrorResponse } from '@/lib/apiAuth'
import type { EnvIssue, IssueStatus } from '@/types'

const STATUSES: IssueStatus[] = ['open', 'in_progress', 'resolved']

function db() {
  if (!adminDb) throw new ApiError(503, 'Database not configured.')
  return adminDb
}

// PATCH /api/issues/:id — update status (admin/maintenance) and/or archive (admin).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(req, ['admin', 'maintenance'])
    const { id } = await params
    const body = (await req.json()) as Record<string, unknown>

    const hasStatus = body.status !== undefined
    const hasArchived = body.archived !== undefined
    if (!hasStatus && !hasArchived) {
      throw new ApiError(400, 'Nothing to update.')
    }

    const updatedAt = new Date().toISOString()
    const update: Record<string, unknown> = { updatedAt }

    if (hasStatus) {
      if (!STATUSES.includes(body.status as IssueStatus)) {
        throw new ApiError(400, 'Invalid status.')
      }
      update.status = body.status
    }

    if (hasArchived) {
      // Archiving (history logs) is admin-only.
      if (user.role !== 'admin') {
        throw new ApiError(403, 'Only admins can archive issues.')
      }
      if (typeof body.archived !== 'boolean') {
        throw new ApiError(400, 'Invalid archived flag.')
      }
      update.archived = body.archived
      update.archivedAt = body.archived ? updatedAt : null
      update.archivedBy = body.archived ? (user.email ?? user.uid) : null
    }

    const ref = db().collection('issues').doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new ApiError(404, 'Issue not found.')

    await ref.update(update)
    return NextResponse.json({ id, ...doc.data(), ...update } as EnvIssue)
  } catch (err) {
    return toErrorResponse(err)
  }
}

// DELETE /api/issues/:id — delete a report (admin only).
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(req, ['admin'])
    const { id } = await params
    const ref = db().collection('issues').doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new ApiError(404, 'Issue not found.')
    await ref.delete()
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return toErrorResponse(err)
  }
}
