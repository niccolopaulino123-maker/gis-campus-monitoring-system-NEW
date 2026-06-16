/**
 * Cloudinary unsigned image upload.
 *
 * Unsigned uploads only need the cloud name and an upload preset — the API
 * key/secret are NOT required and must never ship to the browser, so they are
 * intentionally absent here. Both values below are safe to expose publicly.
 * They can be overridden via env vars without touching code.
 */
const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
const UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''

/** Uploads an image file to Cloudinary and resolves to its secure URL. */
export async function uploadToCloudinary(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }
  // Cloudinary's free tier caps unsigned uploads; keep avatars reasonable.
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be smaller than 10 MB.')
  }

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  )

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string }
    }
    throw new Error(body.error?.message ?? 'Image upload failed.')
  }

  const data = (await res.json()) as { secure_url?: string }
  if (!data.secure_url) throw new Error('Image upload returned no URL.')
  return data.secure_url
}
