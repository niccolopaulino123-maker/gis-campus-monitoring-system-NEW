'use client'

import { useState, type FormEvent } from 'react'
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { useAuth } from '@/contexts/AuthContext'

type Feedback = { type: 'success' | 'error'; text: string } | null

export default function AccountSettings() {
  const { changePassword, demoMode } = useAuth()

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<Feedback>(null)

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setSavingPw(true)
    try {
      await changePassword(currentPw, newPw)
      setPwMsg({ type: 'success', text: 'Password updated successfully.' })
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      const code = (err as { code?: string })?.code
      const text =
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : err instanceof Error
            ? err.message
            : 'Failed to change password.'
      setPwMsg({ type: 'error', text })
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
      <Box component="form" onSubmit={handleChangePassword}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
          <LockOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2">Security</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Change your account password.
        </Typography>

        {demoMode ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Password changes are unavailable in demo mode.
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Current Password"
              type="password"
              size="small"
              fullWidth
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              autoComplete="current-password"
            />
            <TextField
              label="New Password"
              type="password"
              size="small"
              fullWidth
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              autoComplete="new-password"
              helperText="At least 6 characters."
            />
            <TextField
              label="Confirm New Password"
              type="password"
              size="small"
              fullWidth
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              autoComplete="new-password"
            />

            {pwMsg && <Alert severity={pwMsg.type}>{pwMsg.text}</Alert>}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" disabled={savingPw}>
                {savingPw ? 'Updating…' : 'Update Password'}
              </Button>
            </Box>
          </Stack>
        )}
      </Box>
    </Paper>
  )
}
