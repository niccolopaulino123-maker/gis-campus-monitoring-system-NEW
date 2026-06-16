'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Paper,
  Box,
  Avatar,
  Button,
  TextField,
  MenuItem,
  Typography,
  Stack,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { useAuth } from '@/contexts/AuthContext'
import { useUsers } from '@/hooks/useUsers'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { ROLE_META, STUDENT_YEARS } from '@/types'

type Feedback = { type: 'success' | 'error'; text: string } | null

export default function UserProfile() {
  const { user, updateName, updatePhoto, updateProfileDetails, changeEmail, demoMode } =
    useAuth()
  const { users } = useUsers()

  // Year/section live in the `users` collection; seed from the matched record.
  const record = users.find(
    (u) => u.email.toLowerCase() === (user?.email ?? '').toLowerCase(),
  )
  const isStudent = user?.role === 'student'

  const [name, setName] = useState(user?.name ?? '')
  const [year, setYear] = useState(record?.year || STUDENT_YEARS[0])
  const [section, setSection] = useState(record?.section ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<Feedback>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // Email change (re-auth required) is handled in its own section.
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPw, setCurrentPw] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailMsg, setEmailMsg] = useState<Feedback>(null)

  // Keep year/section in sync once the user's record loads.
  useEffect(() => {
    if (record) {
      setYear(record.year || STUDENT_YEARS[0])
      setSection(record.section ?? '')
    }
  }, [record])

  const emailChanged = email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase()

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMsg(null)
    try {
      const url = await uploadToCloudinary(file)
      await updatePhoto(url)
      setMsg({ type: 'success', text: 'Profile picture updated.' })
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Image upload failed.',
      })
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setSaving(true)
    try {
      await updateName(name)
      if (isStudent) {
        await updateProfileDetails({ year, section: section.trim() })
      }
      setMsg({ type: 'success', text: 'Profile updated.' })
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangeEmail = async (e: FormEvent) => {
    e.preventDefault()
    setEmailMsg(null)
    const next = email.trim()
    if (!next) {
      setEmailMsg({ type: 'error', text: 'Email cannot be empty.' })
      return
    }
    setSavingEmail(true)
    try {
      await changeEmail(currentPw, next)
      setCurrentPw('')
      setEmailMsg({
        type: 'success',
        text: demoMode
          ? 'Email updated.'
          : `We've sent a verification link to ${next}. Your sign-in email changes once you confirm it.`,
      })
    } catch (err) {
      const code = (err as { code?: string })?.code
      const text =
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : code === 'auth/email-already-in-use'
            ? 'That email is already in use by another account.'
            : code === 'auth/invalid-email'
              ? 'That email address is invalid.'
              : err instanceof Error
                ? err.message
                : 'Failed to update email.'
      setEmailMsg({ type: 'error', text })
    } finally {
      setSavingEmail(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
      {/* Profile details */}
      <Box component="form" onSubmit={handleSave}>
        <Stack spacing={3}>
          {/* Profile picture */}
          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
            <Avatar src={user?.photoURL || undefined} sx={{ width: 88, height: 88 }}>
              {(user?.name || user?.email || '?')[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePickFile}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  uploading ? <CircularProgress size={16} /> : <PhotoCameraOutlinedIcon />
                }
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                {uploading ? 'Uploading…' : 'Change Photo'}
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Stored on Cloudinary. JPG/PNG up to 10 MB.
              </Typography>
            </Box>
          </Stack>

          <TextField
            label="Name"
            size="small"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Role"
            size="small"
            fullWidth
            value={user?.role ? ROLE_META[user.role].label : '—'}
            disabled
          />

          {isStudent && (
            <TextField
              label="Student Number"
              size="small"
              fullWidth
              value={record?.studentNumber || '—'}
              disabled
              helperText="Managed by your admin."
            />
          )}

          {isStudent && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Year"
                size="small"
                select
                fullWidth
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {STUDENT_YEARS.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Section"
                size="small"
                fullWidth
                placeholder="e.g. BSIT-3A"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
            </Stack>
          )}

          {msg && <Alert severity={msg.type}>{msg.text}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Email change (requires re-authentication) */}
      <Box component="form" onSubmit={handleChangeEmail}>
        <Typography variant="subtitle2">Email</Typography>
        <Typography variant="caption" color="text.secondary">
          Your email is your sign-in identity.
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Email"
            type="email"
            size="small"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {emailChanged && !demoMode && (
            <TextField
              label="Current Password"
              type="password"
              size="small"
              fullWidth
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
              helperText="Confirm your password to change the sign-in email."
            />
          )}

          {emailMsg && <Alert severity={emailMsg.type}>{emailMsg.text}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={savingEmail || !emailChanged}
            >
              {savingEmail ? 'Updating…' : 'Update Email'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Paper>
  )
}
