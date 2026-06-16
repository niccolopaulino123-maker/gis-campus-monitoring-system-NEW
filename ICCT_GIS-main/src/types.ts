export type UserRole = 'admin' | 'student' | 'maintenance'

export const USER_ROLES: UserRole[] = ['admin', 'student', 'maintenance']

export interface UserRecord {
  uid: string
  email: string
  role: UserRole
  /** Full display name. */
  name?: string
  /** Cloudinary URL of the profile picture. */
  photoURL?: string
  /** Year level — only meaningful for students. */
  year?: string
  /** Section — only meaningful for students. */
  section?: string
  /** Student number — only meaningful for students; used for accountability. */
  studentNumber?: string
  updatedAt: string
}

/** Year levels offered to students. */
export const STUDENT_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
] as const

/** Payload used when an admin creates or edits a user. */
export interface UserInput {
  email: string
  /** Plain password (create only / demo mode); never persisted in Firebase mode. */
  password?: string
  name: string
  role: UserRole
  photoURL: string
  year: string
  section: string
  studentNumber: string
}

/** Payload for public student self-registration (sign-up). */
export interface StudentSignUpInput {
  email: string
  password: string
  name: string
  studentNumber: string
  year: string
  section: string
}

export const ROLE_META: Record<UserRole, { label: string; description: string }> = {
  admin: {
    label: 'Admin',
    description: 'Manage users/roles and monitor all reports.',
  },
  student: {
    label: 'Student',
    description: 'Report environmental issues on the campus map.',
  },
  maintenance: {
    label: 'Maintenance',
    description: 'Set the action status of reported issues (pending / in progress / resolved).',
  },
}

/** Capability helpers derived from a user role. */
export function canReport(role: UserRole | null): boolean {
  return role === 'admin' || role === 'student'
}
export function canUpdateStatus(role: UserRole | null): boolean {
  return role === 'admin' || role === 'maintenance'
}
export function canDelete(role: UserRole | null): boolean {
  return role === 'admin'
}
export function canManageRoles(role: UserRole | null): boolean {
  return role === 'admin'
}
export function canArchive(role: UserRole | null): boolean {
  return role === 'admin'
}

export type IssueCategory =
  | 'waste'
  | 'drainage'
  | 'maintenance'
  | 'electrical'
  | 'safety'
  | 'other'

export type IssueStatus = 'open' | 'in_progress' | 'resolved'

export type IssuePriority = 'low' | 'medium' | 'high'

export interface EnvIssue {
  id: string
  category: IssueCategory
  title: string
  description: string
  /** Name of the campus area/room where the issue is located. */
  locationName: string
  /** Position on the campus map in Leaflet CRS.Simple coords [y, x]. */
  lat: number
  lng: number
  status: IssueStatus
  priority: IssuePriority
  /** Cloudinary URLs of photos attached to the report. */
  imageUrls?: string[]
  reportedBy: string
  /** ISO timestamp string. */
  createdAt: string
  /** ISO timestamp string of last status/detail update. */
  updatedAt: string
  /** Soft-archive flag — archived issues are kept as history, hidden from active views. */
  archived?: boolean
  /** ISO timestamp string of when the issue was archived. */
  archivedAt?: string
  /** Email of the admin who archived the issue. */
  archivedBy?: string
}

/** Payload used when creating a new report (system fills the rest). */
export type NewIssueInput = Pick<
  EnvIssue,
  | 'category'
  | 'title'
  | 'description'
  | 'locationName'
  | 'lat'
  | 'lng'
  | 'priority'
  | 'imageUrls'
>

export const CATEGORY_META: Record<
  IssueCategory,
  { label: string; short: string; color: string }
> = {
  waste: { label: 'Waste Accumulation', short: 'Waste', color: '#16a34a' },
  drainage: { label: 'Drainage Problem', short: 'Drainage', color: '#0284c7' },
  maintenance: { label: 'Maintenance Concern', short: 'Maintenance', color: '#d97706' },
  electrical: { label: 'Electrical Hazard', short: 'Electrical', color: '#dc2626' },
  safety: { label: 'Safety Hazard', short: 'Safety', color: '#7c3aed' },
  other: { label: 'Other', short: 'Other', color: '#64748b' },
}

export const STATUS_META: Record<
  IssueStatus,
  { label: string; color: string }
> = {
  open: { label: 'Pending', color: '#dc2626' },
  in_progress: { label: 'In Progress', color: '#d97706' },
  resolved: { label: 'Resolved', color: '#16a34a' },
}

export const PRIORITY_META: Record<
  IssuePriority,
  { label: string; color: string }
> = {
  low: { label: 'Low', color: '#64748b' },
  medium: { label: 'Medium', color: '#d97706' },
  high: { label: 'High', color: '#dc2626' },
}
