import { redirect } from 'next/navigation'

interface OrgHomePageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function OrgHomePage({ params }: OrgHomePageProps) {
  const { orgSlug } = await params
  redirect(`/org/${orgSlug}/projects`)
}

