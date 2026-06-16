'use client'

import { useAuth } from '@/contexts/AuthContext'
import Login from '@/components/Login'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Loading…
      </div>
    )
  }

  if (!user) return <Login />

  return <Dashboard email={user.email} />
}
