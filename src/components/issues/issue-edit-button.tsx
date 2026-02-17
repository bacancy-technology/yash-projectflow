'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IssueForm } from '@/components/issues/issue-form'
import type { BoardColumn, Issue, Profile } from '@/types'

interface IssueEditButtonProps {
  issue: Issue
  columns: BoardColumn[]
  members: Profile[]
}

export function IssueEditButton({ issue, columns, members }: IssueEditButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
        Edit
      </Button>

      <IssueForm
        open={open}
        onOpenChange={setOpen}
        projectId={issue.project_id}
        columns={columns}
        members={members}
        issue={issue}
        onSuccess={() => {
          setOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}

