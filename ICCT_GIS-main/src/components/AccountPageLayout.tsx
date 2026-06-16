'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Container,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Shared shell for the standalone account/profile routes: a top bar with a
 * back button plus an auth guard that bounces signed-out visitors home.
 */
export default function AccountPageLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Loading…
      </div>
    )
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f8fafc',
      }}
    >
      <AppBar position="static">
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            edge="start"
            onClick={() => router.push('/')}
            aria-label="Back to dashboard"
            sx={{ color: 'text.secondary' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 3 }}>
        <Container maxWidth="sm">{children}</Container>
      </Box>
    </Box>
  )
}
