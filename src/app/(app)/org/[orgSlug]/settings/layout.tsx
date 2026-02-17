import { OrgSettingsTabs } from '@/components/org/org-settings-tabs'

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const basePath = `/org/${orgSlug}/settings`

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage organization details and billing.
        </p>
      </div>

      <OrgSettingsTabs basePath={basePath} />

      <div className="pb-8">{children}</div>
    </div>
  )
}

