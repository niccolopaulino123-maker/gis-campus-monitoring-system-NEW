'use client'

import { useState, type FormEvent } from 'react'
import {
  Box,
  Paper,
  Avatar,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  Link,
  Stack,
} from '@mui/material'
import ParkOutlinedIcon from '@mui/icons-material/ParkOutlined'
import { useAuth, DEMO_CREDENTIALS } from '@/contexts/AuthContext'
import { STUDENT_YEARS } from '@/types'

type Mode = 'signin' | 'signup'

export default function Login() {
  const { signIn, signUp, demoMode } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Sign-up-only fields.
  const [name, setName] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [year, setYear] = useState<string>(STUDENT_YEARS[0])
  const [section, setSection] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  const handleSignIn = async () => {
    await signIn(email, password)
  }

  const handleSignUp = async () => {
    if (!name.trim()) throw new Error('Full name is required.')
    if (!studentNumber.trim()) throw new Error('Student number is required.')
    if (!year.trim()) throw new Error('Year is required.')
    if (!section.trim()) throw new Error('Section is required.')
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.')
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.')
    }
    await signUp({
      email,
      password,
      name,
      studentNumber,
      year,
      section,
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signup') await handleSignUp()
      else await handleSignIn()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === 'signup'
            ? 'Sign up failed.'
            : 'Sign in failed.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const isSignUp = mode === 'signup'

  return (
    <Box
      sx={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
      }}
    >
      <Paper
        elevation={8}
        sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 }, borderRadius: 4 }}
      >
        <Stack spacing={1} sx={{ mb: 3, alignItems: 'center' }}>
          <Avatar
            variant="rounded"
            sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}
          >
            <ParkOutlinedIcon />
          </Avatar>
          <Typography variant="h6" align="center">
            ICCT Binangonan Campus
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Environmental Monitoring System (GIS)
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {isSignUp && (
              <>
                <TextField
                  label="Full Name"
                  required
                  fullWidth
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="Student Number"
                  required
                  fullWidth
                  size="small"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  placeholder="e.g. 2023-00123"
                />
              </>
            )}

            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@icct.edu.ph"
            />

            {isSignUp && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Year"
                  select
                  required
                  fullWidth
                  size="small"
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
                  required
                  fullWidth
                  size="small"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. BSIT-3A"
                />
              </Stack>
            )}

            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              helperText={isSignUp ? 'At least 6 characters.' : undefined}
            />

            {isSignUp && (
              <TextField
                label="Confirm Password"
                type="password"
                required
                fullWidth
                size="small"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={submitting}
            >
              {submitting
                ? isSignUp
                  ? 'Creating account…'
                  : 'Signing in…'
                : isSignUp
                  ? 'Create Student Account'
                  : 'Sign In'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => switchMode('signin')}
                  >
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Student without an account?{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => switchMode('signup')}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </Typography>
          </Stack>
        </Box>

        {demoMode && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
              Demo mode (Firebase not configured)
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              Email: <code>{DEMO_CREDENTIALS.email}</code>
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              Password: <code>{DEMO_CREDENTIALS.password}</code>
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Student sign-up requires Firebase to be configured.
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  )
}
