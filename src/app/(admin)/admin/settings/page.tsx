import { getSuperAdmins } from '@/actions/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Shield } from 'lucide-react'
import { SuperAdminManager } from './super-admin-manager'

export default async function AdminSettingsPage() {
  const superAdmins = await getSuperAdmins()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Manage super admins and platform configuration.
        </p>
      </div>

      {/* Super Admins */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Super Admins</CardTitle>
          </div>
          <CardDescription>
            Users with full platform access. They can manage all organizations,
            users, and subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuperAdminManager superAdmins={superAdmins} />
        </CardContent>
      </Card>

      <Separator />

      {/* Platform settings placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Configuration</CardTitle>
          <CardDescription>
            Platform-level settings and feature flags.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Platform configuration options will be available here in a future
            update. This will include feature flags, default plan settings,
            email templates, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
