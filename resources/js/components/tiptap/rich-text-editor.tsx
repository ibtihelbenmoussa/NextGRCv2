"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"

import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
} from "lucide-react"

export default function RichEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Ecrire ici...",
      }),
    ],

    content: "", // ✅ CONTENU VIDE

    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      console.log(html) // ici tu peux envoyer à Laravel
    },
  })

  if (!editor) return null

  return (
    <div className="w-full rounded-xl border bg-black text-white shadow-xl">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 p-3 bg-zinc-900">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-zinc-700" : ""}
        >
          <Bold size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-zinc-700" : ""}
        >
          <Italic size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "bg-zinc-700" : ""}
        >
          <UnderlineIcon size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const url = prompt("Enter URL")
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
        >
          <LinkIcon size={16} />
        </Button>
      </div>

      {/* EDITOR */}
      <div className="p-6 min-h-[400px] prose prose-invert max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}