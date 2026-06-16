'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { UserInput, UserRecord, UserRole } from '@/types'

const COLLECTION = 'users'
const LOCAL_KEY = 'icct_gis_users'

/** Default users shown in demo mode so the list is never empty. */
const DEMO_SEED: UserRecord[] = [
  {
    uid: 'demo-admin',
    email: 'admin@icct.edu.ph',
    name: 'Campus Admin',
    role: 'admin',
    photoURL: '',
    year: '',
    section: '',
    updatedAt: new Date().toISOString(),
  },
]

function readLocal(): UserRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) {
      writeLocal(DEMO_SEED)
      return DEMO_SEED
    }
    return JSON.parse(raw) as UserRecord[]
  } catch {
    return []
  }
}

function writeLocal(users: UserRecord[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(users))
}

function sortByName(users: UserRecord[]): UserRecord[] {
  return [...users].sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email),
  )
}

/** Strips student-only fields when the role is not student. */
function profileFields(input: UserInput) {
  const isStudent = input.role === 'student'
  return {
    email: input.email.trim(),
    name: input.name.trim(),
    role: input.role,
    photoURL: input.photoURL,
    year: isStudent ? input.year : '',
    section: isStudent ? input.section.trim() : '',
    studentNumber: isStudent ? input.studentNumber.trim() : '',
  }
}

interface UseUsersResult {
  users: UserRecord[]
  loading: boolean
  error: string | null
  addUser: (input: UserInput) => Promise<void>
  updateUser: (uid: string, input: UserInput) => Promise<void>
  deleteUser: (uid: string) => Promise<void>
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const unsub = onSnapshot(
        collection(db, COLLECTION),
        (snap) => {
          setUsers(
            sortByName(
              snap.docs.map((d) => ({
                uid: d.id,
                ...(d.data() as Omit<UserRecord, 'uid'>),
              })),
            ),
          )
          setLoading(false)
        },
        (err) => {
          setError(err.message)
          setLoading(false)
        },
      )
      return unsub
    }
    // Demo mode.
    setUsers(sortByName(readLocal()))
    setLoading(false)
  }, [])

  const addUser = useCallback(async (input: UserInput) => {
    const updatedAt = new Date().toISOString()
    const fields = profileFields(input)
    if (isFirebaseConfigured && db) {
      const ref = doc(collection(db, COLLECTION))
      await setDoc(ref, { ...fields, updatedAt })
      return
    }
    const record: UserRecord = {
      uid: crypto.randomUUID(),
      ...fields,
      updatedAt,
    }
    const next = sortByName([record, ...readLocal()])
    writeLocal(next)
    setUsers(next)
  }, [])

  const updateUser = useCallback(async (uid: string, input: UserInput) => {
    const updatedAt = new Date().toISOString()
    const fields = profileFields(input)
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, COLLECTION, uid), { ...fields, updatedAt })
      return
    }
    const next = sortByName(
      readLocal().map((u) => (u.uid === uid ? { ...u, ...fields, updatedAt } : u)),
    )
    writeLocal(next)
    setUsers(next)
  }, [])

  const deleteUser = useCallback(async (uid: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COLLECTION, uid))
      return
    }
    const next = readLocal().filter((u) => u.uid !== uid)
    writeLocal(next)
    setUsers(next)
  }, [])

  return { users, loading, error, addUser, updateUser, deleteUser }
}

export type { UserRole }
