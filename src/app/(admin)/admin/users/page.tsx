import { getAllUsers } from '@/actions/admin'
import { createClient } from '@/lib/supabase/server'
import { UserTable } from '@/components/admin/user-table'

export default async function AdminUsersPage() {
  const users = await getAllUsers()

  const supabase = await createClient()
  const { data: superAdmins } = await supabase
    .from('super_admins')
    .select('user_id')

  const superAdminIds = (superAdmins ?? []).map((sa) => sa.user_id)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage all users on the platform.
        </p>
      </div>

      <UserTable users={users} superAdminIds={superAdminIds} />
    </div>
  )
}
