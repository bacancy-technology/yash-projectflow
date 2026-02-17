'use client'

import { useState } from 'react'
import { createOrg } from '@/actions/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function NewOrgForm() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugEdited) {
      setSlug(slugify(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugEdited(true)
    setSlug(slugify(value))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.set('name', name)
      formData.set('slug', slug)
      await createOrg(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to dashboard
      </Link>

      <div className="flex flex-col items-center mb-5">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950 mb-3">
          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-lg font-semibold">Create Organization</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set up a new organization to collaborate with your team.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium">
            Organization Name
          </Label>
          <Input
            id="name"
            placeholder="My Organization"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug" className="text-xs font-medium">
            URL Slug
          </Label>
          <div className="flex h-9 rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
            <span className="inline-flex items-center px-2.5 bg-muted text-xs text-muted-foreground border-r border-input select-none">
              /org/
            </span>
            <Input
              id="slug"
              placeholder="my-organization"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              className="h-full border-0 rounded-none shadow-none focus-visible:ring-0 text-sm"
            />
          </div>
          {slug && (
            <p className="text-[11px] text-muted-foreground">
              Your org will be at: <span className="font-medium">/org/{slug}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              Creating...
            </>
          ) : (
            'Create Organization'
          )}
        </Button>
      </form>
    </div>
  )
}
