'use client'

import { useEffect } from 'react'
import { useOrg } from '@/hooks/use-org'
import type { Organization, OrganizationMember } from '@/types'

interface OrgLayoutClientProps {
  children: React.ReactNode
  org: Organization
  role: OrganizationMember['role']
}

export function OrgLayoutClient({ children, org, role }: OrgLayoutClientProps) {
  const { setCurrentOrg, setMemberRole } = useOrg()

  useEffect(() => {
    setCurrentOrg(org)
    setMemberRole(role)
  }, [org, role, setCurrentOrg, setMemberRole])

  return <>{children}</>
}
