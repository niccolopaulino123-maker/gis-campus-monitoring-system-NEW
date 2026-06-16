'use client'

import AccountPageLayout from '@/components/AccountPageLayout'
import UserProfile from '@/components/UserProfile'

export default function ProfilePage() {
  return (
    <AccountPageLayout title="My Profile">
      <UserProfile />
    </AccountPageLayout>
  )
}
