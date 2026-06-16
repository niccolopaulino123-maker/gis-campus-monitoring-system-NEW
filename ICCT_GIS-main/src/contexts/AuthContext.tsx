'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  type User,
} from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'
import type { StudentSignUpInput, UserRole } from '@/types'

interface AuthUser {
  /** Firebase Auth uid (empty string in demo mode). */
  uid: string
  email: string
  name: string
  role: UserRole | null
  photoURL: string
}

/** Editable personal details a user may change on their own profile. */
interface ProfileDetails {
  year?: string
  section?: string
}

/** Friendly name from an email local-part, e.g. "student" -> "Student". */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'User'
  return local
    .split(/[._-]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  demoMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** Public student self-registration, then signs the new student in. */
  signUp: (input: StudentSignUpInput) => Promise<void>
  signOut: () => Promise<void>
  /** Updates the signed-in user's display name. */
  updateName: (name: string) => Promise<void>
  /** Updates the signed-in user's profile picture URL (e.g. Cloudinary). */
  updatePhoto: (photoURL: string) => Promise<void>
  /** Re-authenticates, then sends a verification link to the new email. */
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>
  /** Updates the signed-in user's own personal details (year/section). */
  updateProfileDetails: (details: ProfileDetails) => Promise<void>
  /** Re-authenticates with the current password, then sets a new password. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  /** Returns the current Firebase ID token for authorizing API calls. */
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const DEMO_USER_KEY = 'icct_gis_demo_user'
const DEMO_PHOTO_KEY = 'icct_gis_demo_photo'
// Demo credentials used only when Firebase is not configured.
const DEMO_EMAIL = 'admin@icct.edu.ph'
const DEMO_PASSWORD = 'admin123'

async function toAuthUser(fbUser: User): Promise<AuthUser> {
  // Custom claims (the role) ride along on the ID token result.
  const result = await fbUser.getIdTokenResult()
  const role = (result.claims.role as UserRole | undefined) ?? null
  const email = fbUser.email ?? ''
  return {
    uid: fbUser.uid,
    email,
    name: fbUser.displayName || nameFromEmail(email),
    role,
    photoURL: fbUser.photoURL ?? '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, async (fbUser) => {
        setUser(fbUser ? await toAuthUser(fbUser) : null)
        setLoading(false)
      })
      return unsub
    }
    // Demo mode: restore session from localStorage.
    const stored = localStorage.getItem(DEMO_USER_KEY)
    setUser(
      stored
        ? {
            uid: '',
            email: stored,
            name: nameFromEmail(stored),
            role: 'admin',
            photoURL: localStorage.getItem(DEMO_PHOTO_KEY) ?? '',
          }
        : null,
    )
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, password)
      return
    }
    // Demo mode authentication.
    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem(DEMO_USER_KEY, DEMO_EMAIL)
      setUser({
        uid: '',
        email: DEMO_EMAIL,
        name: nameFromEmail(DEMO_EMAIL),
        role: 'admin',
        photoURL: localStorage.getItem(DEMO_PHOTO_KEY) ?? '',
      })
      return
    }
    throw new Error('Invalid email or password.')
  }

  const signUp = async (input: StudentSignUpInput) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Sign up is unavailable in demo mode.')
    }
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(data.error || 'Sign up failed.')
    }
    // Sign the new student straight in.
    await signInWithEmailAndPassword(auth, input.email.trim(), input.password)
  }

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth)
      return
    }
    localStorage.removeItem(DEMO_USER_KEY)
    setUser(null)
  }

  const updateName = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Name cannot be empty.')
    if (isFirebaseConfigured && auth?.currentUser) {
      await updateProfile(auth.currentUser, { displayName: trimmed })
      // Mirror to the Firestore profile so it reflects in User Management.
      if (db) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          name: trimmed,
          updatedAt: new Date().toISOString(),
        })
      }
    }
    // Reflect immediately in both Firebase and demo modes.
    setUser((u) => (u ? { ...u, name: trimmed } : u))
  }

  const updatePhoto = async (photoURL: string) => {
    if (isFirebaseConfigured && auth?.currentUser) {
      await updateProfile(auth.currentUser, { photoURL })
      // Mirror to the Firestore profile so the avatar updates everywhere.
      if (db) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          photoURL,
          updatedAt: new Date().toISOString(),
        })
      }
    } else {
      // Demo mode: persist so the picture survives a reload.
      localStorage.setItem(DEMO_PHOTO_KEY, photoURL)
    }
    setUser((u) => (u ? { ...u, photoURL } : u))
  }

  const changeEmail = async (currentPassword: string, newEmail: string) => {
    const trimmed = newEmail.trim()
    if (!trimmed) throw new Error('Email cannot be empty.')
    if (isFirebaseConfigured && auth?.currentUser?.email) {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword,
      )
      // Firebase requires a recent re-auth before changing the sign-in email.
      await reauthenticateWithCredential(auth.currentUser, credential)
      // The email only switches once the user confirms the verification link;
      // local state is intentionally left unchanged until then.
      await verifyBeforeUpdateEmail(auth.currentUser, trimmed)
      return
    }
    // Demo mode: the email is the identity, so update it immediately.
    localStorage.setItem(DEMO_USER_KEY, trimmed)
    setUser((u) => (u ? { ...u, email: trimmed } : u))
  }

  const updateProfileDetails = async (details: ProfileDetails) => {
    const fields: Record<string, unknown> = {
      ...details,
      updatedAt: new Date().toISOString(),
    }
    if (isFirebaseConfigured && db && auth?.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), fields)
      return
    }
    // Demo mode: patch the matching record in the shared users store.
    try {
      const raw = localStorage.getItem('icct_gis_users')
      const records = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : []
      const email = user?.email.toLowerCase()
      const next = records.map((r) =>
        String(r.email).toLowerCase() === email ? { ...r, ...fields } : r,
      )
      localStorage.setItem('icct_gis_users', JSON.stringify(next))
    } catch {
      // Ignore corrupt local store; nothing to persist in demo mode.
    }
  }

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    if (!isFirebaseConfigured || !auth?.currentUser?.email) {
      throw new Error('Password changes are unavailable in demo mode.')
    }
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword,
    )
    // Recent re-auth is required by Firebase before a password change.
    await reauthenticateWithCredential(auth.currentUser, credential)
    await updatePassword(auth.currentUser, newPassword)
  }

  const getToken = async () => {
    if (isFirebaseConfigured && auth?.currentUser) {
      return auth.currentUser.getIdToken()
    }
    return null
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      demoMode: !isFirebaseConfigured,
      signIn,
      signUp,
      signOut,
      updateName,
      updatePhoto,
      changeEmail,
      updateProfileDetails,
      changePassword,
      getToken,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export const DEMO_CREDENTIALS = { email: DEMO_EMAIL, password: DEMO_PASSWORD }
