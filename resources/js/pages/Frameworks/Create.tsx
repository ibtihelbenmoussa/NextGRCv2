// resources/js/pages/Frameworks/Create.tsx
import { useState, useEffect, useRef } from 'react'
import { Head, Link, useForm, usePage, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Building2,
  Globe,
  Tag as TagIcon,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
} from 'lucide-react'
import { format } from 'date-fns'

interface Jurisdiction {
  id: number
  name: string
}

interface Tag {
  id: number
  name: string
}

// ─── Glassmorphism Manage Dialog ──────────────────────────────────────────────
interface ManageDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: string
  icon: React.ReactNode
  accentFrom: string
  accentTo: string
  items: { id: number; name: string }[]
  selectedIds: string[]
  onToggle: (item: { id: number; name: string }) => void
  onAdd: (name: string) => void
  onEdit: (item: { id: number; name: string }, newName: string) => void
  onDelete: (item: { id: number; name: string }) => void
}

function ManageDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  accentFrom,
  accentTo,
  items,
  selectedIds,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
}: ManageDialogProps) {
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [editingItem, setEditingItem] = useState<{ id: number; name: string } | null>(null)
  const [editingName, setEditingName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSearch('')
      setNewName('')
      setEditingItem(null)
      setEditingName('')
      setConfirmDelete(null)
      setTimeout(() => searchRef.current?.focus(), 80)
    }
  }, [open])

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewName('')
  }

  const handleEdit = () => {
    if (!editingItem || !editingName.trim()) return
    onEdit(editingItem, editingName.trim())
    setEditingItem(null)
    setEditingName('')
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    onDelete(confirmDelete)
    setConfirmDelete(null)
  }

  const selectedCount = selectedIds.length

  return (
    <>
      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          onClick={() => setConfirmDelete(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative rounded-2xl shadow-2xl p-6 w-80 border transition-colors
              bg-white border-gray-100
              dark:bg-gray-900 dark:border-gray-700/60"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4
              bg-red-50 dark:bg-red-500/10">
              <Trash2 className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-center font-semibold mb-1 text-gray-900 dark:text-gray-100">
              Delete item?
            </h3>
            <p className="text-center text-sm mb-5 text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-200">
                "{confirmDelete.name}"
              </span>{' '}
              will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors
                  text-gray-600 bg-gray-100 hover:bg-gray-200
                  dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors
                  bg-red-500 hover:bg-red-600
                  dark:bg-red-600 dark:hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Modal ── */}
      <div
        className={cn(
          'fixed inset-0 z-[60] flex items-center justify-center transition-all duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-300',
            open
              ? 'bg-black/40 dark:bg-black/65 backdrop-blur-md'
              : 'bg-transparent backdrop-blur-none'
          )}
          onClick={() => onOpenChange(false)}
        />

        {/* ── Glass Panel ── */}
        <div
          className={cn(
            'relative w-[520px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden transition-all duration-300',
            // Light: white glass  |  Dark: dark-slate glass
            'bg-white/85 dark:bg-gray-900/80',
            'border border-white/70 dark:border-white/10',
            'shadow-[0_40px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.55)]',
            open ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          )}
          style={{
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          }}
        >
          {/* Decorative gradient orbs — visible in both modes */}
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none
              opacity-20 dark:opacity-30"
            style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
          />
          <div
            className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-3xl pointer-events-none
              opacity-10 dark:opacity-20"
            style={{ background: `linear-gradient(135deg, ${accentTo}, ${accentFrom})` }}
          />

          {/* ── Header ── */}
          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
                >
                  <span className="text-white">{icon}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-50">
                    {title}
                  </h2>
                  <p className="text-xs mt-0.5 text-gray-400 dark:text-gray-500">{description}</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110
                  bg-gray-100/80 hover:bg-gray-200/80 text-gray-400 hover:text-gray-600
                  dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selected badges */}
            {selectedCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedIds.map(id => {
                  const item = items.find(i => i.id.toString() === id)
                  if (!item) return null
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${accentFrom}20, ${accentTo}20)`,
                        borderColor: `${accentFrom}45`,
                        color: accentFrom,
                      }}
                    >
                      {item.name}
                      <button
                        onClick={() => onToggle(item)}
                        className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Search ── */}
          <div className="relative px-6 pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4
                text-gray-400 dark:text-gray-500" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-sm focus:outline-none transition-all
                  bg-black/5 border border-black/8 text-gray-800 placeholder-gray-400
                  dark:bg-white/8 dark:border-white/10 dark:text-gray-100 dark:placeholder-gray-600
                  focus:bg-white focus:dark:bg-white/15"
                onFocus={e => {
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${accentFrom}30`
                }}
                onBlur={e => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors
                    text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Count row */}
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-xs text-gray-400 dark:text-gray-600">
                {filtered.length} item{filtered.length !== 1 ? 's' : ''}
              </span>
              {selectedCount > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${accentFrom}18`, color: accentFrom }}
                >
                  {selectedCount} selected
                </span>
              )}
            </div>
          </div>

          {/* ── List ── */}
          <div className="flex-1 overflow-y-auto px-6 pb-3 space-y-1.5">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-gray-600">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No results for "{search}"</p>
              </div>
            ) : (
              filtered.map(item => {
                const isSelected = selectedIds.includes(item.id.toString())
                const isEditing = editingItem?.id === item.id

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-150',
                      isSelected
                        ? 'shadow-sm'
                        : 'bg-white/50 hover:bg-white/80 border-gray-100/80 hover:border-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/8 dark:hover:border-white/15'
                    )}
                    style={isSelected ? {
                      background: `linear-gradient(135deg, ${accentFrom}14, ${accentTo}08)`,
                      borderColor: `${accentFrom}40`,
                    } : {}}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEdit()
                            if (e.key === 'Escape') { setEditingItem(null); setEditingName('') }
                          }}
                          className="flex-1 px-3 py-1.5 text-sm rounded-xl border focus:outline-none transition-all
                            bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                          style={{
                            borderColor: `${accentFrom}55`,
                            boxShadow: `0 0 0 3px ${accentFrom}20`,
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleEdit}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 shadow"
                          style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setEditingItem(null); setEditingName('') }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110
                            text-gray-400 hover:text-gray-600 bg-gray-100
                            dark:text-gray-400 dark:hover:text-gray-200 dark:bg-white/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="flex items-center gap-3 flex-1 text-left"
                          onClick={() => onToggle(item)}
                        >
                          {/* Custom circle checkbox */}
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                            style={isSelected ? {
                              background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
                              borderColor: accentFrom,
                              boxShadow: `0 2px 8px ${accentFrom}55`,
                            } : undefined}
                            // unselected border colour via className to respect dark mode
                            {...(!isSelected && {
                              className: 'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 border-gray-300 dark:border-gray-600'
                            })}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                          </div>
                          <span
                            className={cn(
                              'text-sm font-medium transition-colors',
                              isSelected
                                ? ''
                                : 'text-gray-700 dark:text-gray-300'
                            )}
                            style={isSelected ? { color: accentFrom } : {}}
                          >
                            {item.name}
                          </span>
                        </button>

                        {/* Row actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0">
                          <button
                            onClick={() => { setEditingItem(item); setEditingName(item.name) }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all
                              text-gray-400 hover:text-gray-700 hover:bg-gray-100
                              dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-white/10"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(item)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all
                              text-gray-400 hover:text-red-500 hover:bg-red-50
                              dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/15"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* ── Footer: add new + done ── */}
          <div className="px-6 py-4 mt-auto border-t transition-colors
            bg-white/60 border-black/6
            dark:bg-white/5 dark:border-white/8">
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Add new..."
                className="flex-1 px-4 py-2.5 rounded-2xl text-sm focus:outline-none transition-all border
                  bg-white/90 border-black/10 text-gray-800 placeholder-gray-400
                  dark:bg-white/10 dark:border-white/10 dark:text-gray-100 dark:placeholder-gray-600"
                onFocus={e => {
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${accentFrom}28`
                  e.currentTarget.style.borderColor = `${accentFrom}65`
                }}
                onBlur={e => {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = ''
                }}
              />
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white flex items-center gap-1.5
                  transition-all hover:opacity-90 hover:scale-105 disabled:opacity-40 disabled:scale-100 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
                  boxShadow: `0 4px 14px ${accentFrom}45`,
                }}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="mt-3 w-full py-2.5 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90
                bg-gray-900 dark:bg-gray-700"
            >
              Done — {selectedCount} selected
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateFramework() {
  const { props } = usePage<any>()
  const jurisdictions = props.jurisdictions ?? []
  const allTags = props.tags ?? []

  const { data, setData, post, processing, errors, setError, clearErrors, reset } = useForm({
    code: '',
    name: '',
    version: '',
    type: '',
    status: 'draft',
    publisher: '',
    jurisdictions: [] as string[],
    scope: '',
    release_date: '',
    effective_date: '',
    retired_date: '',
    description: '',
    language: '',
    url_reference: '',
    tags: [] as string[],
  })

  // ─── Dialogs ───
  const [jurisdictionsDialogOpen, setJurisdictionsDialogOpen] = useState(false)
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false)
  const [flashOpen, setFlashOpen] = useState(false)
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // ─── Date popovers ───
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [effectiveOpen, setEffectiveOpen] = useState(false)
  const [retiredOpen, setRetiredOpen] = useState(false)

  // ─── Jurisdictions state ───
  const [jurisdictionsList, setJurisdictionsList] = useState<Jurisdiction[]>(jurisdictions)

  // ─── Tags state ───
  const [tagsList, setTagsList] = useState<Tag[]>(allTags)

  useEffect(() => {
    if (props.flash?.success || props.flash?.error) {
      setFlash({
        type: props.flash.success ? 'success' : 'error',
        message: props.flash.success || props.flash.error,
      })
      setFlashOpen(true)
    }
  }, [props.flash])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    const validationErrors: Record<string, string> = {}
    if (!data.code.trim()) validationErrors.code = 'Code is required'
    if (!data.name.trim()) validationErrors.name = 'Name is required'
    if (!data.type) validationErrors.type = 'Type is required'
    if (!data.status) validationErrors.status = 'Status is required'
    if (data.jurisdictions.length === 0) validationErrors.jurisdictions = 'At least one jurisdiction is required'

    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([key, msg]) => setError(key as any, msg))
      return
    }

    post('/frameworks', {
      onSuccess: () => {
        reset()
        setReleaseOpen(false)
        setEffectiveOpen(false)
        setRetiredOpen(false)
      },
    })
  }

  // ─── Refs — évite le stale-closure quand le modal appelle onToggle ───
  const jurisdictionsRef = useRef<string[]>([])
  const tagsRef = useRef<string[]>([])
  useEffect(() => { jurisdictionsRef.current = data.jurisdictions }, [data.jurisdictions])
  useEffect(() => { tagsRef.current = data.tags }, [data.tags])

  // ─── Jurisdictions Handlers ───
  const toggleJurisdiction = (item: Jurisdiction) => {
    const idStr = item.id.toString()
    const current = jurisdictionsRef.current
    const next = current.includes(idStr)
      ? current.filter(id => id !== idStr)
      : [...current, idStr]
    jurisdictionsRef.current = next
    setData('jurisdictions', next)
  }

  const createJurisdiction = (name: string) => {
    router.post('/jurisdictions', { name }, {
      preserveScroll: true,
      onSuccess: (page: any) => {
        const refreshed = page.props?.jurisdictions ?? []
        setJurisdictionsList(refreshed)
        const created = refreshed.find((j: Jurisdiction) => j.name === name)
        if (created) toggleJurisdiction(created)
      },
    })
  }

  const updateJurisdiction = (item: Jurisdiction, newName: string) => {
    router.put(`/jurisdictions/${item.id}`, { name: newName }, {
      preserveScroll: true,
      onSuccess: (page: any) => {
        setJurisdictionsList(page.props?.jurisdictions ?? [])
      },
    })
  }

  const deleteJurisdiction = (item: Jurisdiction) => {
    router.delete(`/jurisdictions/${item.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setJurisdictionsList(prev => prev.filter(j => j.id !== item.id))
        const next = jurisdictionsRef.current.filter(id => id !== item.id.toString())
        jurisdictionsRef.current = next
        setData('jurisdictions', next)
      },
    })
  }

  // ─── Tags Handlers ───
  const toggleTag = (item: Tag) => {
    const idStr = item.id.toString()
    const current = tagsRef.current
    const next = current.includes(idStr)
      ? current.filter(id => id !== idStr)
      : [...current, idStr]
    tagsRef.current = next
    setData('tags', next)
  }

  const createTag = (name: string) => {
    router.post('/tags', { name }, {
      preserveScroll: true,
      onSuccess: (page: any) => {
        const refreshed = page.props?.tags ?? []
        setTagsList(refreshed)
        const created = refreshed.find((t: Tag) => t.name === name)
        if (created) toggleTag(created)
      },
    })
  }

  const updateTag = (item: Tag, newName: string) => {
    router.put(`/tags/${item.id}`, { name: newName }, {
      preserveScroll: true,
      onSuccess: () => {
        setTagsList(prev => prev.map(t => t.id === item.id ? { ...t, name: newName } : t))
      },
    })
  }

  const deleteTag = (item: Tag) => {
    router.delete(`/tags/${item.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setTagsList(prev => prev.filter(t => t.id !== item.id))
        const next = tagsRef.current.filter(id => id !== item.id.toString())
        tagsRef.current = next
        setData('tags', next)
      },
    })
  }

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Frameworks', href: '/frameworks' },
        { title: 'Create', href: '' },
      ]}
    >
      <Head title="Create Framework" />

      {/* ── Flash Dialog ── */}
      <Dialog open={flashOpen} onOpenChange={setFlashOpen}>
        <DialogContent className={cn(flash?.type === 'success' ? 'border-green-600' : 'border-red-600')}>
          <DialogHeader>
            <DialogTitle className={cn(flash?.type === 'success' ? 'text-green-600' : 'text-red-600')}>
              {flash?.type === 'success' ? 'Success' : 'Error'}
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">{flash?.message}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlashOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Glassmorphism Manage Jurisdictions ── */}
      <ManageDialog
        open={jurisdictionsDialogOpen}
        onOpenChange={setJurisdictionsDialogOpen}
        title="Manage Jurisdictions"
        description="Select geographic scopes for this framework"
        icon={<Globe className="h-5 w-5" />}
        accentFrom="#6366f1"
        accentTo="#8b5cf6"
        items={jurisdictionsList}
        selectedIds={data.jurisdictions}
        onToggle={toggleJurisdiction}
        onAdd={createJurisdiction}
        onEdit={updateJurisdiction}
        onDelete={deleteJurisdiction}
      />

      {/* ── Glassmorphism Manage Tags ── */}
      <ManageDialog
        open={tagsDialogOpen}
        onOpenChange={setTagsDialogOpen}
        title="Manage Tags"
        description="Categorize and label this framework"
        icon={<TagIcon className="h-5 w-5" />}
        accentFrom="#0ea5e9"
        accentTo="#06b6d4"
        items={tagsList}
        selectedIds={data.tags}
        onToggle={toggleTag}
        onAdd={createTag}
        onEdit={updateTag}
        onDelete={deleteTag}
      />

      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Framework</h1>
            <p className="text-muted-foreground mt-1.5">
              Add a new compliance, regulatory, contractual or internal framework
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/frameworks">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Required fields are marked with *</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-2">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Code <span className="text-destructive text-base">*</span></Label>
                  <Input
                    id="code"
                    value={data.code}
                    onChange={e => { setData('code', e.target.value.toUpperCase().trim()); clearErrors('code') }}
                    className={cn(errors.code && 'border-destructive focus-visible:ring-destructive/50')}
                    placeholder="e.g. ISO27001, GDPR, NIST-CSF"
                  />
                  {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name <span className="text-destructive text-base">*</span></Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={e => { setData('name', e.target.value); clearErrors('name') }}
                    className={cn(errors.name && 'border-destructive focus-visible:ring-destructive/50')}
                    placeholder="e.g. ISO/IEC 27001:2022 – Information Security"
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input value={data.version} onChange={e => setData('version', e.target.value)} placeholder="2022, v1.1, 4.0" />
                </div>

                <div className="space-y-2">
                  <Label>Type <span className="text-destructive text-base">*</span></Label>
                  <Select value={data.type} onValueChange={v => { setData('type', v); clearErrors('type') }}>
                    <SelectTrigger className={cn(errors.type && 'border-destructive')}>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="regulation">Regulation / Law</SelectItem>
                      <SelectItem value="contract">Contract / Agreement</SelectItem>
                      <SelectItem value="internal_policy">Internal Policy</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Status <span className="text-destructive text-base">*</span></Label>
                  <Select value={data.status} onValueChange={v => { setData('status', v); clearErrors('status') }}>
                    <SelectTrigger className={cn(errors.status && 'border-destructive')}>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Publisher</Label>
                  <Input value={data.publisher} onChange={e => setData('publisher', e.target.value)} placeholder="ISO, NIST, European Union, Internal..." />
                </div>
                <div className="space-y-2">
                  <Label>Scope / Applicability</Label>
                  <Input value={data.scope} onChange={e => setData('scope', e.target.value)} placeholder="Information Security, All organization, EU entities..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jurisdictions & Tags */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Jurisdictions & Tags</CardTitle>
                  <CardDescription>Geographic scope and categorization</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    Jurisdictions <span className="text-destructive text-base">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { clearErrors('jurisdictions'); setJurisdictionsDialogOpen(true) }}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    {data.jurisdictions.length === 0 ? 'Select' : 'Edit selection'}
                  </Button>
                </div>

                {/* ── Selected jurisdictions display ── */}
                <div
                  onClick={() => { clearErrors('jurisdictions'); setJurisdictionsDialogOpen(true) }}
                  className={cn(
                    'min-h-[44px] w-full rounded-xl border px-3 py-2 cursor-pointer transition-all',
                    'flex flex-wrap gap-1.5 items-center',
                    errors.jurisdictions
                      ? 'border-destructive bg-destructive/5'
                      : 'border-input hover:border-primary/50 bg-background hover:bg-accent/30',
                  )}
                >
                  {data.jurisdictions.length === 0 ? (
                    <span className="text-sm text-muted-foreground select-none">
                      Click to select jurisdictions...
                    </span>
                  ) : (
                    data.jurisdictions.map(id => {
                      const j = jurisdictionsList.find(j => j.id.toString() === id)
                      return j ? (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
                          style={{
                            background: 'linear-gradient(135deg, #6366f120, #8b5cf620)',
                            borderColor: '#6366f145',
                            color: '#6366f1',
                          }}
                        >
                          {j.name}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); toggleJurisdiction(j) }}
                            className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null
                    })
                  )}
                </div>
                {errors.jurisdictions && (
                  <p className="text-sm text-destructive mt-1">{errors.jurisdictions}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <TagIcon className="h-4 w-4" /> Tags
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTagsDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    {data.tags.length === 0 ? 'Select' : 'Edit selection'}
                  </Button>
                </div>

                {/* ── Selected tags display ── */}
                <div
                  onClick={() => setTagsDialogOpen(true)}
                  className="min-h-[44px] w-full rounded-xl border border-input px-3 py-2 cursor-pointer
                    flex flex-wrap gap-1.5 items-center transition-all
                    hover:border-primary/50 bg-background hover:bg-accent/30"
                >
                  {data.tags.length === 0 ? (
                    <span className="text-sm text-muted-foreground select-none">
                      Click to select tags...
                    </span>
                  ) : (
                    data.tags.map(id => {
                      const t = tagsList.find(t => t.id.toString() === id)
                      return t ? (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
                          style={{
                            background: 'linear-gradient(135deg, #0ea5e920, #06b6d420)',
                            borderColor: '#0ea5e945',
                            color: '#0ea5e9',
                          }}
                        >
                          {t.name}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); toggleTag(t) }}
                            className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Important Dates</CardTitle>
                  <CardDescription>Timeline of the framework lifecycle</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  { label: 'Release Date', field: 'release_date' as const, open: releaseOpen, setOpen: setReleaseOpen },
                  { label: 'Effective Date', field: 'effective_date' as const, open: effectiveOpen, setOpen: setEffectiveOpen },
                  { label: 'Retired Date (optional)', field: 'retired_date' as const, open: retiredOpen, setOpen: setRetiredOpen },
                ].map(({ label, field, open, setOpen }) => (
                  <div key={field} className="space-y-2">
                    <Label>{label}</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn('w-full justify-start text-left font-normal h-11', !data[field] && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {data[field] ? format(new Date(data[field]), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={data[field] ? new Date(data[field]) : undefined}
                          onSelect={date => {
                            setData(field, date ? format(date, 'yyyy-MM-dd') : '')
                            setOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description & Reference */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Description & Reference</CardTitle>
                  <CardDescription>Full description and official source</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-2">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={data.description}
                  onChange={e => setData('description', e.target.value)}
                  placeholder="Purpose of the framework, main requirements, applicability, responsibilities..."
                  className="min-h-[160px] resize-y"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={data.language} onValueChange={v => setData('language', v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select language..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Official Reference URL</Label>
                  <Input
                    type="url"
                    value={data.url_reference}
                    onChange={e => setData('url_reference', e.target.value)}
                    placeholder="https://www.iso.org/standard/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-8">
            <Button variant="outline" size="lg" asChild disabled={processing}>
              <Link href="/frameworks">Cancel</Link>
            </Button>
            <Button type="submit" size="lg" disabled={processing} className="min-w-[200px]">
              {processing ? 'Creating...' : 'Create Framework'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}