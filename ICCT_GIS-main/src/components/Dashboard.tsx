'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Box,
  Alert,
  Fab,
  IconButton,
  Collapse,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import MenuIcon from '@mui/icons-material/Menu'
import { useAuth } from '@/contexts/AuthContext'
import { useIssues } from '@/hooks/useIssues'
import Header from './Header'
import Sidebar from './Sidebar'
import NavSidebar, { type NavView } from './NavSidebar'
import DashboardAnalytics from './DashboardAnalytics'
import MonitoringReports from './MonitoringReports'
import IssueArchive from './IssueArchive'
import ReportModal from './ReportModal'
import UserManagement from './UserManagement'
import {
  canReport,
  canUpdateStatus,
  canDelete,
  canManageRoles,
  canArchive,
  type EnvIssue,
  type IssueCategory,
  type IssueStatus,
  type NewIssueInput,
} from '@/types'

// react-leaflet touches `window`, so the map must render client-side only.
const CampusMap = dynamic(() => import('./CampusMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-slate-400">
      Loading map…
    </div>
  ),
})

export default function Dashboard({ email }: { email: string }) {
  const { user } = useAuth()
  const {
    issues,
    loading,
    error,
    addIssue,
    updateStatus,
    updateIssue,
    archiveIssue,
    unarchiveIssue,
    deleteIssue,
  } = useIssues()

  const [placing, setPlacing] = useState(false)
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(
    null,
  )
  const [editing, setEditing] = useState<EnvIssue | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<NavView>(
    user?.role === 'student' ? 'evacuation' : 'dashboard',
  )
  const [navOpen, setNavOpen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'all'>(
    'all',
  )
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all')

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const role = user?.role ?? null
  const reporter = canReport(role)
  const manager = canManageRoles(role)

  // Status changes: maintenance/admin only.
  const canSetStatus = canUpdateStatus(role)
  // Editing details / deleting: admin, or the issue's own reporter.
  const canEditDetails = (issue: EnvIssue) =>
    manager || issue.reportedBy === email
  const canRemoveIssue = (issue: EnvIssue) =>
    canDelete(role) || issue.reportedBy === email
  // Archiving (history logs): admin only.
  const canArchiveIssue = (_issue: EnvIssue) => canArchive(role)

  const handlePick = (lat: number, lng: number) => {
    setPending({ lat, lng })
    setPlacing(false)
  }

  const handleSubmit = async (input: NewIssueInput) => {
    await addIssue(input, email)
  }

  const handleEditSubmit = async (input: NewIssueInput) => {
    if (editing) await updateIssue(editing.id, input)
  }

  const handleConfirmDelete = async () => {
    if (deletingId) await deleteIssue(deletingId)
    setDeletingId(null)
  }

  const handleConfirmArchive = async () => {
    if (archivingId) await archiveIssue(archivingId, email)
    setArchivingId(null)
  }

  const deletingIssue = issues.find((i) => i.id === deletingId) ?? null
  const archivingIssue = issues.find((i) => i.id === archivingId) ?? null

  // Archived issues are kept as history and hidden from the active views.
  const activeIssues = issues.filter((i) => !i.archived)
  const archivedIssues = issues.filter((i) => i.archived)

  // Pending (unresolved) reports drive the Evacuation nav notification badge.
  const pendingCount = activeIssues.filter((i) => i.status === 'open').length

  const visibleIssues = activeIssues.filter(
    (i) =>
      (categoryFilter === 'all' || i.category === categoryFilter) &&
      (statusFilter === 'all' || i.status === statusFilter),
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header onMenuClick={() => setNavOpen(true)} />

      {error && (
        <Alert severity="error" square sx={{ borderRadius: 0 }}>
          Database error: {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', minHeight: 0, flex: 1 }}>
        <NavSidebar
          role={role}
          view={view}
          onSelect={setView}
          badges={{ evacuation: pendingCount }}
          open={navOpen}
          onClose={() => setNavOpen(false)}
        />

        {view === 'dashboard' && role !== 'student' && (
          <DashboardAnalytics issues={activeIssues} loading={loading} />
        )}

        {view === 'evacuation' && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              flex: 1,
            }}
          >
            {/* Toolbar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                px: { xs: 2, sm: 3 },
                py: 1.25,
                bgcolor: 'background.paper',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" noWrap>
                  Evacuation Plan · Campus Map
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  Locate, view, and report environmental issues on the campus
                  floor plan.
                </Typography>
              </Box>
              <IconButton
                onClick={() => setShowSidebar((s) => !s)}
                title={showSidebar ? 'Hide report list' : 'Show report list'}
                aria-label={showSidebar ? 'Hide report list' : 'Show report list'}
                sx={{ flexShrink: 0, color: 'text.secondary' }}
              >
                {showSidebar ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            </Box>

            {/* List + Map */}
            <Box
              sx={{
                display: 'flex',
                minHeight: 0,
                flex: 1,
                flexDirection: { xs: 'column-reverse', sm: 'row' },
              }}
            >
              <Collapse
                in={showSidebar}
                orientation={isMobile ? 'vertical' : 'horizontal'}
                sx={{
                  flexShrink: 0,
                  '& .MuiCollapse-wrapper, & .MuiCollapse-wrapperInner': {
                    height: { sm: '100%' },
                  },
                }}
              >
                <Sidebar
                  issues={activeIssues}
                  loading={loading}
                  categoryFilter={categoryFilter}
                  statusFilter={statusFilter}
                  canSetStatus={canSetStatus}
                  canEditDetails={canEditDetails}
                  canRemove={canRemoveIssue}
                  canArchive={canArchiveIssue}
                  onCategoryFilter={setCategoryFilter}
                  onStatusFilter={setStatusFilter}
                  onSelectIssue={setSelectedId}
                  onUpdateStatus={(id, s) => void updateStatus(id, s)}
                  onEdit={setEditing}
                  onDelete={setDeletingId}
                  onArchive={setArchivingId}
                  selectedId={selectedId}
                />
              </Collapse>

              <Box
                component="main"
                sx={{
                  position: 'relative',
                  flex: 1,
                  minHeight: { xs: '55vh', sm: 0 },
                }}
              >
                <CampusMap
                  issues={visibleIssues}
                  placing={placing}
                  canSetStatus={canSetStatus}
                  canEditDetails={canEditDetails}
                  canRemove={canRemoveIssue}
                  canArchive={canArchiveIssue}
                  onPickLocation={handlePick}
                  onUpdateStatus={(id, s) => void updateStatus(id, s)}
                  onEdit={setEditing}
                  onDelete={setDeletingId}
                  onArchive={setArchivingId}
                  focusId={selectedId}
                />

                {/* Floating action button for reporting (reporters/admin only). */}
                {reporter && (
                  <Fab
                    variant="extended"
                    color={placing ? 'error' : 'primary'}
                    onClick={() => setPlacing((p) => !p)}
                    sx={{ position: 'absolute', bottom: 20, right: 16, zIndex: 1000 }}
                  >
                    {placing ? (
                      <CloseIcon sx={{ mr: 1 }} />
                    ) : (
                      <AddIcon sx={{ mr: 1 }} />
                    )}
                    {placing ? 'Cancel' : 'Report Issue'}
                  </Fab>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {view === 'reports' && manager && (
          <MonitoringReports issues={activeIssues} loading={loading} />
        )}

        {view === 'archive' && manager && (
          <IssueArchive
            issues={archivedIssues}
            loading={loading}
            onRestore={(id) => void unarchiveIssue(id)}
            onDelete={setDeletingId}
          />
        )}

        {view === 'users' && manager && <UserManagement />}
      </Box>

      {pending && (
        <ReportModal
          position={pending}
          onSubmit={handleSubmit}
          onClose={() => setPending(null)}
        />
      )}

      {editing && (
        <ReportModal
          position={{ lat: editing.lat, lng: editing.lng }}
          initial={editing}
          onSubmit={handleEditSubmit}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog
        open={Boolean(deletingIssue)}
        onClose={() => setDeletingId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete this report?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            This action cannot be undone.
          </DialogContentText>
          {deletingIssue && (
            <Box sx={{ borderRadius: 2, bgcolor: '#f8fafc', px: 1.5, py: 1 }}>
              <Box sx={{ fontSize: 14, fontWeight: 500 }}>
                {deletingIssue.title}
              </Box>
              <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
                {deletingIssue.locationName}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setDeletingId(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleConfirmDelete()}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(archivingIssue)}
        onClose={() => setArchivingId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Archive this report?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            It will be moved to the Archive (history logs) and hidden from the
            active map and reports. You can restore it later.
          </DialogContentText>
          {archivingIssue && (
            <Box sx={{ borderRadius: 2, bgcolor: '#f8fafc', px: 1.5, py: 1 }}>
              <Box sx={{ fontSize: 14, fontWeight: 500 }}>
                {archivingIssue.title}
              </Box>
              <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
                {archivingIssue.locationName}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setArchivingId(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleConfirmArchive()}
          >
            Archive
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
