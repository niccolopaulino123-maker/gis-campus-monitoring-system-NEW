'use client'

import AccountPageLayout from '@/components/AccountPageLayout'
import AccountSettings from '@/components/AccountSettings'

export default function AccountPage() {
  return (
    <AccountPageLayout title="Account Settings">
      <AccountSettings />
    </AccountPageLayout>
  )
}
