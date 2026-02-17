import { redirect } from 'next/navigation'
import { getUserOrg } from '@/actions/organizations'
import { NewOrgForm } from './new-org-form'

export default async function NewOrgPage() {
  const org = await getUserOrg()

  if (org) {
    redirect(`/org/${org.slug}/projects`)
  }

  return <NewOrgForm />
}
