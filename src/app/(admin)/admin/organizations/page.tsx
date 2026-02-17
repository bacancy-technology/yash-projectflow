import { getAllOrgs } from '@/actions/admin'
import { OrgTable } from '@/components/admin/org-table'

export default async function AdminOrganizationsPage() {
  const organizations = await getAllOrgs()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Manage all organizations on the platform.
        </p>
      </div>

      <OrgTable organizations={organizations} />
    </div>
  )
}
