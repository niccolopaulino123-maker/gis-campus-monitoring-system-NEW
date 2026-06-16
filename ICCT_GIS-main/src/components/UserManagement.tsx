'use client'

import { useRef, useState, type FormEvent } from 'react'
import {
  Box,
  Avatar,
  Button,
  Chip,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/contexts/AuthContext'
import { uploadToCloudinary } from '@/lib/cloudinary'
import {
  ROLE_META,
  STUDENT_YEARS,
  USER_ROLES,
  type UserInput,
  type UserRecord,
  type UserRole,
} from '@/types'

type Feedback = { type: 'success' | 'error'; text: string } | null

const EMPTY_FORM: UserInput = {
  email: '',
  password: '',
  name: '',
  role: 'student',
  photoURL: '',
  year: STUDENT_YEARS[0],
  section: '',
  studentNumber: '',
}

export default function UserManagement() {
  const { users, loading, error, addUser, updateUser, deleteUser } = useUsers()
  const { demoMode } = useAuth()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UserRecord | null>(null)
  const [form, setForm] = useState<UserInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formMsg, setFormMsg] = useState<Feedback>(null)
  const [deleting, setDeleting] = useState<UserRecord | null>(null)
  const [tab, setTab] = useState<'students' | 'personnel'>('students')
  const fileInput = useRef<HTMLInputElement>(null)

  // Students vs. authorized personnel (admins + maintenance).
  const isStudentRole = (r: UserRole) => r === 'student'
  const studentCount = users.filter((u) => isStudentRole(u.role)).length
  const personnelCount = users.length - studentCount
  const visibleUsers = users.filter((u) =>
    tab === 'students' ? isStudentRole(u.role) : !isStudentRole(u.role),
  )

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormMsg(null)
    setDialogOpen(true)
  }

  const openEdit = (u: UserRecord) => {
    setEditing(u)
    setForm({
      email: u.email,
      password: '',
      name: u.name ?? '',
      role: u.role,
      photoURL: u.photoURL ?? '',
      year: u.year || STUDENT_YEARS[0],
      section: u.section ?? '',
      studentNumber: u.studentNumber ?? '',
    })
    setFormMsg(null)
    setDialogOpen(true)
  }

  const setField = <K extends keyof UserInput>(key: K, value: UserInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setFormMsg(null)
    try {
      const url = await uploadToCloudinary(file)
      setField('photoURL', url)
    } catch (err) {
      setFormMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Image upload failed.',
      })
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormMsg(null)
    if (!form.name.trim()) {
      setFormMsg({ type: 'error', text: 'Name is required.' })
      return
    }
    if (form.role === 'student' && !form.studentNumber.trim()) {
      setFormMsg({ type: 'error', text: 'Student number is required for students.' })
      return
    }
    if (form.role === 'student' && !form.section.trim()) {
      setFormMsg({ type: 'error', text: 'Section is required for students.' })
      return
    }
    if (!editing && (form.password ?? '').length < 6) {
      setFormMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    setSaving(true)
    try {
      if (editing) await updateUser(editing.uid, form)
      else await addUser(form)
      setDialogOpen(false)
    } catch (err) {
      setFormMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save user.',
      })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteUser(deleting.uid)
    } finally {
      setDeleting(null)
    }
  }

  const isStudent = form.role === 'student'

  return (
    <Box sx={{ flex: 1, minWidth: 0, overflowY: 'auto', p: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6">User Management</Typography>
          <Typography variant="caption" color="text.secondary">
            Manage roles and personal details for everyone on the system.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add User
        </Button>
      </Box>

      {demoMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Demo mode: users are stored locally in this browser. Profile pictures
          still upload to Cloudinary.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <ToggleButtonGroup
        value={tab}
        exclusive
        size="small"
        onChange={(_e, next) => next && setTab(next)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="students" sx={{ textTransform: 'none', px: 2 }}>
          Students ({studentCount})
        </ToggleButton>
        <ToggleButton value="personnel" sx={{ textTransform: 'none', px: 2 }}>
          Authorized Personnel ({personnelCount})
        </ToggleButton>
      </ToggleButtonGroup>

      <Box
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 600 } }}>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              {tab === 'students' && <TableCell>Year &amp; Section</TableCell>}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={tab === 'students' ? 5 : 4} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  Loading users…
                </TableCell>
              </TableRow>
            ) : visibleUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tab === 'students' ? 5 : 4} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  {tab === 'students'
                    ? 'No students yet.'
                    : 'No authorized personnel yet.'}
                </TableCell>
              </TableRow>
            ) : (
              visibleUsers.map((u) => (
                <TableRow key={u.uid} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar src={u.photoURL || undefined} sx={{ width: 36, height: 36 }}>
                        {(u.name || u.email || '?')[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {u.name || '—'}
                        </Typography>
                        {u.role === 'student' && u.studentNumber && (
                          <Typography variant="caption" color="text.secondary">
                            No. {u.studentNumber}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={ROLE_META[u.role].label}
                      color={u.role === 'admin' ? 'primary' : 'default'}
                      variant={u.role === 'admin' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  {tab === 'students' && (
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {u.year || u.section
                        ? [u.year, u.section].filter(Boolean).join(' · ')
                        : '—'}
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(u)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleting(u)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {/* Profile picture */}
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar src={form.photoURL || undefined} sx={{ width: 72, height: 72 }}>
                  {(form.name || form.email || '?')[0]?.toUpperCase()}
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
                      uploading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <PhotoCameraOutlinedIcon />
                      )
                    }
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                  >
                    {uploading ? 'Uploading…' : 'Upload Photo'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Stored on Cloudinary. JPG/PNG up to 10 MB.
                  </Typography>
                </Box>
              </Stack>

              <TextField
                label="Name"
                size="small"
                fullWidth
                required
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
              <TextField
                label="Email"
                type="email"
                size="small"
                fullWidth
                required
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                disabled={Boolean(editing)}
                helperText={editing ? 'Email is the sign-in identity and cannot be changed.' : undefined}
              />
              <TextField
                label={editing ? 'New Password (optional)' : 'Password'}
                type="password"
                size="small"
                fullWidth
                required={!editing}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                autoComplete="new-password"
                helperText={editing ? 'Leave blank to keep the current password.' : 'At least 6 characters.'}
              />
              <TextField
                label="Role"
                size="small"
                select
                fullWidth
                value={form.role}
                onChange={(e) => setField('role', e.target.value as UserRole)}
              >
                {USER_ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {ROLE_META[r].label}
                  </MenuItem>
                ))}
              </TextField>

              {isStudent && (
                <>
                  <TextField
                    label="Student Number"
                    size="small"
                    fullWidth
                    required
                    placeholder="e.g. 2023-00123"
                    value={form.studentNumber}
                    onChange={(e) => setField('studentNumber', e.target.value)}
                    helperText="Required for accountability on submitted reports."
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Year"
                      size="small"
                      select
                      fullWidth
                      value={form.year}
                      onChange={(e) => setField('year', e.target.value)}
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
                      required
                      placeholder="e.g. BSIT-3A"
                      value={form.section}
                      onChange={(e) => setField('section', e.target.value)}
                    />
                  </Stack>
                </>
              )}

              {formMsg && <Alert severity={formMsg.type}>{formMsg.text}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button color="inherit" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving || uploading}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove this user?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {deleting?.name || deleting?.email} will be removed from the system.
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={() => void confirmDelete()}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
