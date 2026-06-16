'use client'

import { useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  LinearProgress,
  Avatar,
} from '@mui/material'
import {
  CATEGORY_META,
  STATUS_META,
  PRIORITY_META,
  type EnvIssue,
  type IssueCategory,
  type IssueStatus,
  type IssuePriority,
} from '@/types'

interface DashboardAnalyticsProps {
  issues: EnvIssue[]
  loading: boolean
}

/** Labelled progress bar row. */
function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Typography variant="caption" sx={{ width: 96, color: 'text.secondary' }} noWrap>
        {label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          flex: 1,
          height: 8,
          borderRadius: 5,
          bgcolor: '#f1f5f9',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 },
        }}
      />
      <Typography variant="caption" sx={{ width: 24, textAlign: 'right', fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  )
}

/** Minimal SVG donut for status distribution. */
function Donut({
  segments,
  total,
}: {
  segments: { value: number; color: string }[]
  total: number
}) {
  const r = 42
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox="0 0 120 120" style={{ height: 144, width: 144, transform: 'rotate(-90deg)' }}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {total > 0 &&
        segments.map((s, i) => {
          const len = (s.value / total) * c
          const el = (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return el
        })}
    </svg>
  )
}

export default function DashboardAnalytics({
  issues,
  loading,
}: DashboardAnalyticsProps) {
  const stats = useMemo(() => {
    const byCategory = {} as Record<IssueCategory, number>
    const byStatus = {} as Record<IssueStatus, number>
    const byPriority = {} as Record<IssuePriority, number>
    const byLocation = {} as Record<string, number>

    for (const i of issues) {
      byCategory[i.category] = (byCategory[i.category] ?? 0) + 1
      byStatus[i.status] = (byStatus[i.status] ?? 0) + 1
      byPriority[i.priority] = (byPriority[i.priority] ?? 0) + 1
      byLocation[i.locationName] = (byLocation[i.locationName] ?? 0) + 1
    }

    const topLocations = Object.entries(byLocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return { byCategory, byStatus, byPriority, topLocations }
  }, [issues])

  const total = issues.length
  const resolvedPct =
    total > 0 ? Math.round(((stats.byStatus.resolved ?? 0) / total) * 100) : 0

  const cards = [
    { label: 'Total Reports', value: total, color: 'text.primary' },
    { label: 'Pending', value: stats.byStatus.open ?? 0, color: STATUS_META.open.color },
    {
      label: 'In Progress',
      value: stats.byStatus.in_progress ?? 0,
      color: STATUS_META.in_progress.color,
    },
    { label: 'Resolved', value: `${resolvedPct}%`, color: STATUS_META.resolved.color },
  ]

  const categoryMax = Math.max(1, ...Object.values(stats.byCategory))
  const priorityMax = Math.max(1, ...Object.values(stats.byPriority))

  const statusSegments = (Object.keys(STATUS_META) as IssueStatus[]).map((s) => ({
    label: STATUS_META[s].label,
    value: stats.byStatus[s] ?? 0,
    color: STATUS_META[s].color,
  }))

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
        <Typography variant="h6">Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Analytics overview of campus environmental reports.
        </Typography>

        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading analytics…
          </Typography>
        ) : (
          <>
            <Grid container spacing={2}>
              {cards.map((c) => (
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

            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Reports by Category
                    </Typography>
                    <Stack spacing={1.5}>
                      {(Object.keys(CATEGORY_META) as IssueCategory[]).map((cat) => (
                        <Bar
                          key={cat}
                          label={CATEGORY_META[cat].short}
                          value={stats.byCategory[cat] ?? 0}
                          max={categoryMax}
                          color={CATEGORY_META[cat].color}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Reports by Status
                    </Typography>
                    <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                      <Box sx={{ position: 'relative' }}>
                        <Donut segments={statusSegments} total={total} />
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {total}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total
                          </Typography>
                        </Box>
                      </Box>
                      <Stack spacing={1} sx={{ flex: 1 }}>
                        {statusSegments.map((s) => (
                          <Stack
                            key={s.label}
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: 'center' }}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: s.color,
                              }}
                            />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {s.label}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {s.value}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Reports by Priority
                    </Typography>
                    <Stack spacing={1.5}>
                      {(Object.keys(PRIORITY_META) as IssuePriority[]).map((p) => (
                        <Bar
                          key={p}
                          label={PRIORITY_META[p].label}
                          value={stats.byPriority[p] ?? 0}
                          max={priorityMax}
                          color={PRIORITY_META[p].color}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Most Reported Areas
                    </Typography>
                    {stats.topLocations.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No reports yet.
                      </Typography>
                    ) : (
                      <Stack spacing={1.25}>
                        {stats.topLocations.map(([name, count], i) => (
                          <Stack
                            key={name}
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: 'center' }}
                          >
                            <Avatar
                              sx={{
                                width: 22,
                                height: 22,
                                fontSize: 12,
                                bgcolor: '#f1f5f9',
                                color: 'text.secondary',
                              }}
                            >
                              {i + 1}
                            </Avatar>
                            <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                              {name}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {count}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  )
}
