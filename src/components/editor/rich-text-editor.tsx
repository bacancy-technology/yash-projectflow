'use client'

import { useEffect, useMemo, type ReactNode } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Code,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  editorClassName?: string
}

function normalizeHtml(html: string) {
  const trimmed = html.trim()
  if (
    trimmed === '' ||
    trimmed === '<p></p>' ||
    trimmed === '<p><br></p>' ||
    trimmed === '<p><br/></p>'
  ) {
    return ''
  }
  return trimmed
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something…',
  className,
  editorClassName,
}: RichTextEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    [placeholder]
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value || '',
    editorProps: {
      attributes: {
        class: cn(
          'tiptap-editor w-full rounded-md border bg-background px-3 py-2 text-sm outline-none',
          'min-h-[140px] max-h-[280px] overflow-y-auto',
          editorClassName
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(normalizeHtml(editor.getHTML()))
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = normalizeHtml(editor.getHTML())
    const next = normalizeHtml(value)
    if (current === next) return
    editor.commands.setContent(next || '', { emitUpdate: false })
  }, [editor, value])

  if (!editor) {
    return (
      <div
        className={cn(
          'min-h-[140px] w-full rounded-md border bg-muted/30',
          className
        )}
      />
    )
  }

  const toolbarButton = (
    label: string,
    onClick: () => void,
    active?: boolean,
    disabled?: boolean,
    icon?: ReactNode
  ) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8 rounded-md', active && 'bg-accent')}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon}
    </Button>
  )

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/30 p-1">
        {toolbarButton(
          'Bold',
          () => editor.chain().focus().toggleBold().run(),
          editor.isActive('bold'),
          !editor.can().chain().toggleBold().run(),
          <Bold className="h-4 w-4" />
        )}
        {toolbarButton(
          'Italic',
          () => editor.chain().focus().toggleItalic().run(),
          editor.isActive('italic'),
          !editor.can().chain().toggleItalic().run(),
          <Italic className="h-4 w-4" />
        )}
        {toolbarButton(
          'Strikethrough',
          () => editor.chain().focus().toggleStrike().run(),
          editor.isActive('strike'),
          !editor.can().chain().toggleStrike().run(),
          <Strikethrough className="h-4 w-4" />
        )}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {toolbarButton(
          'Bulleted list',
          () => editor.chain().focus().toggleBulletList().run(),
          editor.isActive('bulletList'),
          !editor.can().chain().toggleBulletList().run(),
          <List className="h-4 w-4" />
        )}
        {toolbarButton(
          'Numbered list',
          () => editor.chain().focus().toggleOrderedList().run(),
          editor.isActive('orderedList'),
          !editor.can().chain().toggleOrderedList().run(),
          <ListOrdered className="h-4 w-4" />
        )}
        {toolbarButton(
          'Blockquote',
          () => editor.chain().focus().toggleBlockquote().run(),
          editor.isActive('blockquote'),
          !editor.can().chain().toggleBlockquote().run(),
          <Quote className="h-4 w-4" />
        )}
        {toolbarButton(
          'Inline code',
          () => editor.chain().focus().toggleCode().run(),
          editor.isActive('code'),
          !editor.can().chain().toggleCode().run(),
          <Code className="h-4 w-4" />
        )}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {toolbarButton(
          'Undo',
          () => editor.chain().focus().undo().run(),
          false,
          !editor.can().chain().undo().run(),
          <Undo2 className="h-4 w-4" />
        )}
        {toolbarButton(
          'Redo',
          () => editor.chain().focus().redo().run(),
          false,
          !editor.can().chain().redo().run(),
          <Redo2 className="h-4 w-4" />
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
