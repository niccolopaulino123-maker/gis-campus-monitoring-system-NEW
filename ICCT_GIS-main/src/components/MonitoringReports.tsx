'use client'

import { useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from '@mui/material'
import {
  CATEGORY_META,
  STATUS_META,
  PRIORITY_META,
  type EnvIssue,
} from '@/types'

interface MonitoringReportsProps {
  issues: EnvIssue[]
  loading: boolean
}

export default function MonitoringReports({
  issues,
  loading,
}: MonitoringReportsProps) {
  const counts = useMemo(
    () => ({
      total: issues.length,
      open: issues.filter((i) => i.status === 'open').length,
      in_progress: issues.filter((i) => i.status === 'in_progress').length,
      resolved: issues.filter((i) => i.status === 'resolved').length,
    }),
    [issues],
  )

  const sorted = useMemo(
    () =>
      [...issues].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [issues],
  )

  const summary = [
    { label: 'Total', value: counts.total, color: 'text.primary' },
    { label: 'Pending', value: counts.open, color: STATUS_META.open.color },
    {
      label: 'In Progress',
      value: counts.in_progress,
      color: STATUS_META.in_progress.color,
    },
    {
      label: 'Resolved',
      value: counts.resolved,
      color: STATUS_META.resolved.color,
    },
  ]

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
        <Typography variant="h6">Monitoring Reports</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Overview of all environmental reports across the campus.
        </Typography>

        <Grid container spacing={2}>
          {summary.map((c) => (
            <Grid key={c.label} size={{ xs: 6, sm: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {c.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: c.color }}>
                    {c.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ mt: 3, borderRadius: 3 }}
        >
          {loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
              Loading reports…
            </Typography>
          ) : sorted.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
              No reports yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 600 } }}>
                  <TableCell>Report</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Reported By</TableCell>
                  <TableCell>Date</TableCell>
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
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: PRIORITY_META[issue.priority].color,
                        }}
                      >
                        {PRIORITY_META[issue.priority].label}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {issue.reportedBy}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {new Date(issue.createdAt).toLocaleDateString()}
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
