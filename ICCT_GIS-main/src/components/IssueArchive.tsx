'use client'

import { useMemo } from 'react'
import {
  Box,
  Typography,
  Chip,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from '@mui/material'
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
  CATEGORY_META,
  STATUS_META,
  type EnvIssue,
} from '@/types'

interface IssueArchiveProps {
  issues: EnvIssue[]
  loading: boolean
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}

export default function IssueArchive({
  issues,
  loading,
  onRestore,
  onDelete,
}: IssueArchiveProps) {
  // Newest archived first.
  const sorted = useMemo(
    () =>
      [...issues].sort((a, b) =>
        (b.archivedAt ?? b.updatedAt).localeCompare(a.archivedAt ?? a.updatedAt),
      ),
    [issues],
  )

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
        <Typography variant="h6">Archive · History Logs</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Archived reports are kept here as a history log. Restore them to the active
          list, or delete them permanently.
        </Typography>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 3 }}
        >
          {loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
              Loading archive…
            </Typography>
          ) : sorted.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
              No archived reports yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 600 } }}>
                  <TableCell>Report</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reported By</TableCell>
                  <TableCell>Archived By</TableCell>
                  <TableCell>Archived On</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((issue) => (
                  <TableRow key={issue.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {issue.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {issue.locationName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: CATEGORY_META[issue.category].color,
                          }}
                        />
                        {CATEGORY_META[issue.category].short}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_META[issue.status].label}
                        size="small"
                        sx={{
                          bgcolor: STATUS_META[issue.status].color,
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {issue.reportedBy}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {issue.archivedBy || '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {issue.archivedAt
                        ? new Date(issue.archivedAt).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<RestoreOutlinedIcon fontSize="small" />}
                        onClick={() => onRestore(issue.id)}
                        sx={{ minWidth: 0 }}
                      >
                        Restore
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineIcon fontSize="small" />}
                        onClick={() => onDelete(issue.id)}
                        sx={{ minWidth: 0, ml: 1 }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Box>
    </Box>
  )
}
