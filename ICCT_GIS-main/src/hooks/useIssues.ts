'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import type { EnvIssue, NewIssueInput, IssueStatus } from '@/types'

const COLLECTION = 'issues'
const LOCAL_KEY = 'icct_gis_issues'

function readLocal(): EnvIssue[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as EnvIssue[]) : []
  } catch {
    return []
  }
}

function writeLocal(issues: EnvIssue[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(issues))
}

function sortByNewest(issues: EnvIssue[]): EnvIssue[] {
  return [...issues].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

interface UseIssuesResult {
  issues: EnvIssue[]
  loading: boolean
  error: string | null
  addIssue: (input: NewIssueInput, reportedBy: string) => Promise<void>
  updateStatus: (id: string, status: IssueStatus) => Promise<void>
  updateIssue: (id: string, input: NewIssueInput) => Promise<void>
  archiveIssue: (id: string, archivedBy: string) => Promise<void>
  unarchiveIssue: (id: string) => Promise<void>
  deleteIssue: (id: string) => Promise<void>
}

export function useIssues(): UseIssuesResult {
  const [issues, setIssues] = useState<EnvIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
      const unsub = onSnapshot(
        q,
        (snap) => {
          setIssues(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EnvIssue, 'id'>) })),
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
    setIssues(sortByNewest(readLocal()))
    setLoading(false)
  }, [])

  const addIssue = useCallback(
    async (input: NewIssueInput, reportedBy: string) => {
      const now = new Date().toISOString()
      const base = {
        ...input,
        status: 'open' as IssueStatus,
        reportedBy,
        createdAt: now,
        updatedAt: now,
      }
      if (isFirebaseConfigured && db) {
        await addDoc(collection(db, COLLECTION), base)
        return
      }
      const issue: EnvIssue = { id: crypto.randomUUID(), ...base }
      const next = sortByNewest([issue, ...readLocal()])
      writeLocal(next)
      setIssues(next)
    },
    [],
  )

  const updateStatus = useCallback(async (id: string, status: IssueStatus) => {
    const updatedAt = new Date().toISOString()
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, COLLECTION, id), { status, updatedAt })
      return
    }
    const next = readLocal().map((i) =>
      i.id === id ? { ...i, status, updatedAt } : i,
    )
    writeLocal(next)
    setIssues(sortByNewest(next))
  }, [])

  // Edit an issue's details (category, title, description, location, priority).
  const updateIssue = useCallback(async (id: string, input: NewIssueInput) => {
    const updatedAt = new Date().toISOString()
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, COLLECTION, id), { ...input, updatedAt })
      return
    }
    const next = readLocal().map((i) =>
      i.id === id ? { ...i, ...input, updatedAt } : i,
    )
    writeLocal(next)
    setIssues(sortByNewest(next))
  }, [])

  // Soft-archive: keep the issue as history but hide it from active views.
  const archiveIssue = useCallback(async (id: string, archivedBy: string) => {
    const archivedAt = new Date().toISOString()
    const patch = { archived: true, archivedAt, archivedBy, updatedAt: archivedAt }
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, COLLECTION, id), patch)
      return
    }
    const next = readLocal().map((i) => (i.id === id ? { ...i, ...patch } : i))
    writeLocal(next)
    setIssues(sortByNewest(next))
  }, [])

  // Restore an archived issue back to the active list.
  const unarchiveIssue = useCallback(async (id: string) => {
    const updatedAt = new Date().toISOString()
    const patch = {
      archived: false,
      archivedAt: null,
      archivedBy: null,
      updatedAt,
    }
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, COLLECTION, id), patch)
      return
    }
    const next = readLocal().map((i) =>
      i.id === id
        ? { ...i, archived: false, archivedAt: undefined, archivedBy: undefined, updatedAt }
        : i,
    )
    writeLocal(next)
    setIssues(sortByNewest(next))
  }, [])

  const deleteIssue = useCallback(async (id: string) => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, COLLECTION, id))
      return
    }
    const next = readLocal().filter((i) => i.id !== id)
    writeLocal(next)
    setIssues(sortByNewest(next))
  }, [])

  return {
    issues,
    loading,
    error,
    addIssue,
    updateStatus,
    updateIssue,
    archiveIssue,
    unarchiveIssue,
    deleteIssue,
  }
}
