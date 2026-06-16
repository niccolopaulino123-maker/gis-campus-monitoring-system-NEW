'use client'

import {
  Badge,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import type { ReactNode } from 'react'
import type { UserRole } from '@/types'

export type NavView = 'dashboard' | 'evacuation' | 'reports' | 'archive' | 'users'

interface NavItem {
  view: NavView
  label: string
  roles: UserRole[]
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    view: 'dashboard',
    label: 'Dashboard',
    roles: ['admin', 'maintenance'],
    icon: <DashboardOutlinedIcon />,
  },
  {
    view: 'evacuation',
    label: 'Evacuation Plan',
    roles: ['admin', 'student', 'maintenance'],
    icon: <MapOutlinedIcon />,
  },
  {
    view: 'reports',
    label: 'Monitoring Reports',
    roles: ['admin'],
    icon: <AssessmentOutlinedIcon />,
  },
  {
    view: 'archive',
    label: 'Archive',
    roles: ['admin'],
    icon: <Inventory2OutlinedIcon />,
  },
  {
    view: 'users',
    label: 'User Management',
    roles: ['admin'],
    icon: <ManageAccountsOutlinedIcon />,
  },
]

const DRAWER_WIDTH = 240

interface NavSidebarProps {
  role: UserRole | null
  view: NavView
  onSelect: (view: NavView) => void
  /** Notification counts shown as a badge per nav view (e.g. pending issues). */
  badges?: Partial<Record<NavView, number>>
  /** Mobile drawer open state. */
  open: boolean
  onClose: () => void
}

export default function NavSidebar({
  role,
  view,
  onSelect,
  badges,
  open,
  onClose,
}: NavSidebarProps) {
  const items = NAV_ITEMS.filter((item) => !role || item.roles.includes(role))

  const content = (
    <Box sx={{ py: 1.5 }}>
      <Typography
        variant="overline"
        sx={{ px: 2.5, color: 'text.secondary', fontWeight: 600 }}
      >
        Menu
      </Typography>
      <List sx={{ px: 1 }}>
        {items.map((item) => {
          const active = view === item.view
          const count = badges?.[item.view] ?? 0
          return (
            <ListItemButton
              key={item.view}
              selected={active}
              onClick={() => {
                onSelect(item.view)
                onClose()
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: '#ecfdf5',
                  color: 'primary.dark',
                  '& .MuiListItemIcon-root': { color: 'primary.dark' },
                  '&:hover': { bgcolor: '#d1fae5' },
                },
              }}
            >
              <ListItemIcon
                sx={{ minWidth: 40, color: active ? 'primary.dark' : 'text.secondary' }}
              >
                <Badge badgeContent={count} color="error" max={99}>
                  {item.icon}
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { sx: { fontSize: 14, fontWeight: active ? 600 : 500 } },
                }}
              />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )

  return (
    <>
      {/* Desktop: permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            position: 'relative',
            width: DRAWER_WIDTH,
            border: 0,
            borderRight: '1px solid #e2e8f0',
          },
        }}
      >
        {content}
      </Drawer>

      {/* Mobile: temporary drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { sm: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        {content}
      </Drawer>
    </>
  )
}
