'use client'

import { useMemo } from 'react'
import {
  Box,
  Typography,
  Chip,
  TextField,
  MenuItem,
  List,
  ListItemButton,
  Button,
  Select,
  Divider,
} from '@mui/material'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import {
  CATEGORY_META,
  STATUS_META,
  PRIORITY_META,
  type EnvIssue,
  type IssueCategory,
  type IssueStatus,
} from '@/types'

interface SidebarProps {
  issues: EnvIssue[]
  loading: boolean
  categoryFilter: IssueCategory | 'all'
  statusFilter: IssueStatus | 'all'
  canSetStatus: boolean
  canEditDetails: (issue: EnvIssue) => boolean
  canRemove: (issue: EnvIssue) => boolean
  canArchive: (issue: EnvIssue) => boolean
  onCategoryFilter: (c: IssueCategory | 'all') => void
  onStatusFilter: (s: IssueStatus | 'all') => void
  onSelectIssue: (id: string) => void
  onUpdateStatus: (id: string, status: IssueStatus) => void
  onEdit: (issue: EnvIssue) => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
  selectedId: string | null
}

export default function Sidebar({
  issues,
  loading,
  categoryFilter,
  statusFilter,
  canSetStatus,
  canEditDetails,
  canRemove,
  canArchive,
  onCategoryFilter,
  onStatusFilter,
  onSelectIssue,
  onUpdateStatus,
  onEdit,
  onDelete,
  onArchive,
  selectedId,
}: SidebarProps) {
  const filtered = useMemo(
    () =>
      issues.filter(
        (i) =>
          (categoryFilter === 'all' || i.category === categoryFilter) &&
          (statusFilter === 'all' || i.status === statusFilter),
      ),
    [issues, categoryFilter, statusFilter],
  )

  return (
    <Box
      component="aside"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        width: { xs: '100%', sm: 320, lg: 360 },
        height: { sm: '100%' },
        maxHeight: { xs: '45vh', sm: 'none' },
        borderTop: { xs: '1px solid #e2e8f0', sm: 0 },
        borderRight: { sm: '1px solid #e2e8f0' },
      }}
    >
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, borderBottom: '1px solid #e2e8f0' }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value as IssueStatus | 'all')}
        >
          <MenuItem value="all">All statuses</MenuItem>
          {(Object.keys(STATUS_META) as IssueStatus[]).map((s) => (
            <MenuItem key={s} value={s}>
              {STATUS_META[s].label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          fullWidth
          size="small"
          label="Category"
          value={categoryFilter}
          onChange={(e) =>
            onCategoryFilter(e.target.value as IssueCategory | 'all')
          }
        >
          <MenuItem value="all">All categories</MenuItem>
          {(Object.keys(CATEGORY_META) as IssueCategory[]).map((c) => (
            <MenuItem key={c} value={c}>
              {CATEGORY_META[c].label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            Loading reports…
          </Typography>
        ) : filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No reports match the current filters. Tap “Report Issue” to add one.
          </Typography>
        ) : (
          <List disablePadding>
            {filtered.map((issue, idx) => {
              const selected = selectedId === issue.id
              const showActions =
                canSetStatus ||
                canEditDetails(issue) ||
                canRemove(issue) ||
                canArchive(issue)
              return (
                <Box key={issue.id}>
                  {idx > 0 && <Divider />}
                  <ListItemButton
                    selected={selected}
                    onClick={() => onSelectIssue(issue.id)}
                    sx={{
                      alignItems: 'flex-start',
                      gap: 1,
                      borderLeft: '3px solid',
                      borderLeftColor: selected ? 'primary.main' : 'transparent',
                      '&.Mui-selected': { bgcolor: '#ecfdf5' },
                    }}
                  >
                    <Box
                      sx={{
                        mt: 0.75,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        flexShrink: 0,
                        bgcolor: CATEGORY_META[issue.category].color,
                      }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {issue.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ display: 'block' }}
                      >
                        {issue.locationName}
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={STATUS_META[issue.status].label}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 10,
                            fontWeight: 600,
                            bgcolor: STATUS_META[issue.status].color,
                            color: '#fff',
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: PRIORITY_META[issue.priority].color }}
                        >
                          {PRIORITY_META[issue.priority].label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </Typography>
                        {issue.imageUrls && issue.imageUrls.length > 0 && (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.25,
                              color: 'text.secondary',
                            }}
                          >
                            <ImageOutlinedIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" color="text.secondary">
                              {issue.imageUrls.length}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ display: 'block', mt: 0.25 }}
                      >
                        Reported by {issue.reportedBy}
                      </Typography>

                      {showActions && (
                        <Box
                          sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canSetStatus && (
                            <Select
                              size="small"
                              value={issue.status}
                              onChange={(e) =>
                                onUpdateStatus(issue.id, e.target.value as IssueStatus)
                              }
                              sx={{ fontSize: 12, '& .MuiSelect-select': { py: 0.5 } }}
                            >
                              {(Object.keys(STATUS_META) as IssueStatus[]).map((s) => (
                                <MenuItem key={s} value={s} sx={{ fontSize: 12 }}>
                                  {STATUS_META[s].label}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                          {canEditDetails(issue) && (
                            <Button
                              size="small"
                              color="primary"
                              onClick={() => onEdit(issue)}
                              sx={{ minWidth: 0, px: 1 }}
                            >
                              Edit
                            </Button>
                          )}
                          {canArchive(issue) && (
                            <Button
                              size="small"
                              color="inherit"
                              onClick={() => onArchive(issue.id)}
                              sx={{ minWidth: 0, px: 1, color: 'text.secondary' }}
                            >
                              Archive
                            </Button>
                          )}
                          {canRemove(issue) && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => onDelete(issue.id)}
                              sx={{ minWidth: 0, px: 1 }}
                            >
                              Delete
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>
                  </ListItemButton>
                </Box>
              )
            })}
          </List>
        )}
      </Box>
    </Box>
  )
}
