"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import {TextStyle} from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Placeholder from "@tiptap/extension-placeholder"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold, Italic, Underline as U,
  Strikethrough, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon,
  Image as ImageIcon, Sun, Moon
} from "lucide-react"

interface Props {
  value?: string
  onChange?: (value: string) => void
}

export default function WordEditor({ value = "", onChange }: Props) {
  const [dark, setDark] = useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Image,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start typing..." }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] focus:outline-none",
      },
    },
  })

  if (!editor) return null

  return (
    <div className={dark ? "dark" : ""}>
      <div className="border rounded-xl shadow bg-white dark:bg-zinc-900">

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2 border-b p-3 bg-gray-100 dark:bg-zinc-800">

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().undo().run()}>
            <Undo size={16}/>
          </Button>

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().redo().run()}>
            <Redo size={16}/>
          </Button>

          <select
            className="border rounded px-2 py-1 text-sm bg-transparent"
            onChange={(e) => {
              const v = e.target.value
              if (v === "p") editor.chain().focus().setParagraph().run()
              if (v === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run()
              if (v === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run()
              if (v === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run()
            }}
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={16}/>
          </Button>

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={16}/>
          </Button>

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <U size={16}/>
          </Button>

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={16}/>
          </Button>

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={16}/>
          </Button>

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={16}/>
          </Button>

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft size={16}/>
          </Button>

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter size={16}/>
          </Button>

          <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight size={16}/>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const url = prompt("Enter URL")
              if (url) editor.chain().focus().setLink({ href: url }).run()
            }}
          >
            <LinkIcon size={16}/>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const url = prompt("Image URL")
              if (url) editor.chain().focus().setImage({ src: url }).run()
            }}
          >
            <ImageIcon size={16}/>
          </Button>

          <input
            type="color"
            onInput={(e:any) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
          />

          <Button size="sm" variant="ghost" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </Button>
        </div>

        {/* CONTENT */}
        <div className="p-6 prose max-w-none dark:prose-invert">
          <EditorContent editor={editor}/>
        </div>

        {/* SAVE BUTTON */}
        
      </div>
    </div>
  )
}