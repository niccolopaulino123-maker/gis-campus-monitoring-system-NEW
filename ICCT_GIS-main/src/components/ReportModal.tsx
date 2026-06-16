'use client'

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  CATEGORY_META,
  PRIORITY_META,
  type EnvIssue,
  type IssueCategory,
  type IssuePriority,
  type NewIssueInput,
} from '@/types'
import { AREA_NAMES, findAreaAt } from '@/data/locations'
import { uploadToCloudinary } from '@/lib/cloudinary'

interface ReportModalProps {
  position: { lat: number; lng: number }
  /** When provided, the modal edits this issue's details instead of creating. */
  initial?: EnvIssue
  onSubmit: (input: NewIssueInput) => Promise<void>
  onClose: () => void
}

export default function ReportModal({
  position,
  initial,
  onSubmit,
  onClose,
}: ReportModalProps) {
  const editing = Boolean(initial)
  const [category, setCategory] = useState<IssueCategory>(
    initial?.category ?? 'waste',
  )
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [locationName, setLocationName] = useState(
    initial?.locationName ?? findAreaAt(position.lat, position.lng),
  )
  const [priority, setPriority] = useState<IssuePriority>(
    initial?.priority ?? 'medium',
  )
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.imageUrls ?? [])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const urls = await Promise.all(files.map((f) => uploadToCloudinary(f)))
      setImageUrls((prev) => [...prev, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const removeImage = (url: string) =>
    setImageUrls((prev) => prev.filter((u) => u !== url))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    // Require photo evidence for new reports so admins can verify the issue
    // (and discourage fake or prank reports).
    if (!editing && imageUrls.length === 0) {
      setError('Please attach at least one photo as evidence before submitting.')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        category,
        title: title.trim(),
        description: description.trim(),
        locationName,
        priority,
        imageUrls,
        lat: initial?.lat ?? position.lat,
        lng: initial?.lng ?? position.lng,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {editing ? 'Edit Issue' : 'Report Environmental Issue'}
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(CATEGORY_META) as IssueCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                    category === c
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: CATEGORY_META[c].color }}
                  />
                  {CATEGORY_META[c].short}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Overflowing trash bin"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Location / Area
            </label>
            <select
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              {AREA_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the issue…"
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(PRIORITY_META) as IssuePriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                    priority === p
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Photos
              {editing && (
                <span className="font-normal text-slate-400"> (optional)</span>
              )}
            </label>
            {!editing && (
              <p className="mb-1.5 text-xs text-slate-500">
                Attach at least one photo as evidence so the admin can verify the
                issue.
              </p>
            )}
            {imageUrls.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {imageUrls.map((url) => (
                  <div key={url} className="relative h-16 w-16">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Issue attachment"
                      className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      aria-label="Remove photo"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs leading-none text-white hover:bg-slate-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFiles}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : '+ Add Photos'}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting || uploading || (!editing && imageUrls.length === 0)
              }
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Save Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
