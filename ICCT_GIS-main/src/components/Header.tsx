'use client'

import { useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  AppBar,
  Toolbar,
  Box,
  Avatar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Chip,
  ListItemIcon,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ParkOutlinedIcon from '@mui/icons-material/ParkOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_META } from '@/types'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut, demoMode } = useAuth()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const initial = (user?.email?.[0] ?? '?').toUpperCase()

  const openMenu = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)
  const closeMenu = () => setAnchor(null)

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 1.5, minHeight: { xs: 56, sm: 64 } }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { sm: 'none' }, color: 'text.secondary' }}
          aria-label="Open menu"
        >
          <MenuIcon />
        </IconButton>

        <Avatar
          variant="rounded"
          sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}
        >
          <ParkOutlinedIcon fontSize="small" />
        </Avatar>

        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ color: 'text.primary', lineHeight: 1.2 }}
          >
            {isMobile ? 'ICCT Binangonan' : 'ICCT Campus Monitoring'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
            >
              GIS-based issue mapping
            </Typography>
            {demoMode && (
              <Chip
                label="DEMO"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
              />
            )}
          </Box>
        </Box>

        <IconButton onClick={openMenu} sx={{ p: 0.5 }} title={user?.email}>
          <Avatar
            src={user?.photoURL || undefined}
            sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 15 }}
          >
            {initial}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
              {user?.email}
            </Typography>
            {user?.role && (
              <Typography variant="caption" color="text.secondary">
                {ROLE_META[user.role].label}
              </Typography>
            )}
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              closeMenu()
              router.push('/profile')
            }}
            sx={{ py: 1.25 }}
          >
            <ListItemIcon>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            My profile
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu()
              router.push('/account')
            }}
            sx={{ py: 1.25 }}
          >
            <ListItemIcon>
              <ManageAccountsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Account settings
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu()
              void signOut()
            }}
            sx={{ color: 'error.main', py: 1.25 }}
          >
            <ListItemIcon sx={{ color: 'error.main' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
