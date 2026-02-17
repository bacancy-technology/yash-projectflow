import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserOrgs } from '@/actions/organizations'
import { AppShell } from './app-shell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const orgs = await getUserOrgs()

  return <AppShell orgs={orgs}>{children}</AppShell>
}
