import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrg } from '@/actions/organizations'
import { OrgLayoutClient } from './org-layout-client'
import type { Organization, OrganizationMember } from '@/types'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const org = await getOrg(orgSlug)

  if (!org) {
    redirect('/dashboard')
  }

  // Verify the user is a member of this org
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    redirect('/dashboard')
  }

  return (
    <OrgLayoutClient org={org} role={member.role as OrganizationMember['role']}>
      {children}
    </OrgLayoutClient>
  )
}
