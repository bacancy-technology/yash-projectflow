'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import React from 'react'
import type { Organization, OrganizationMember } from '@/types'

interface OrgContextValue {
  currentOrg: Organization | null
  setCurrentOrg: (org: Organization | null) => void
  memberRole: OrganizationMember['role'] | null
  setMemberRole: (role: OrganizationMember['role'] | null) => void
  orgs: Organization[]
  setOrgs: (orgs: Organization[]) => void
  switchOrg: (org: Organization) => void
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined)

interface OrgProviderProps {
  children: ReactNode
  initialOrg?: Organization | null
  initialRole?: OrganizationMember['role'] | null
  initialOrgs?: Organization[]
}

export function OrgProvider({
  children,
  initialOrg = null,
  initialRole = null,
  initialOrgs = [],
}: OrgProviderProps) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(initialOrg)
  const [memberRole, setMemberRole] = useState<
    OrganizationMember['role'] | null
  >(initialRole)
  const [orgs, setOrgs] = useState<Organization[]>(initialOrgs)

  const switchOrg = useCallback((org: Organization) => {
    setCurrentOrg(org)
  }, [])

  return React.createElement(
    OrgContext.Provider,
    {
      value: {
        currentOrg,
        setCurrentOrg,
        memberRole,
        setMemberRole,
        orgs,
        setOrgs,
        switchOrg,
      },
    },
    children
  )
}

export function useOrg() {
  const context = useContext(OrgContext)
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider')
  }
  return context
}
