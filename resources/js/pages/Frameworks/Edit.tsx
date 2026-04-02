// resources/js/pages/Frameworks/Edit.tsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { Head, Link, useForm, usePage, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CardUpload, type FileUploadItem } from '@/components/card-upload'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, Calendar as CalendarIcon, Building2, Globe,
  Tag as TagIcon, FileText, Plus, Pencil, Trash2, Search, X, Check,
  Layers, ChevronRight, ChevronDown, Minus, FileUp, Download, File, AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { route } from 'ziggy-js'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Jurisdiction { id: number; name: string }
interface Tag { id: number; name: string }
interface Process { id: number; name: string; code: string; macro_process_id: number }
interface MacroProcess { id: number; name: string; code: string; business_unit_id: number; processes: Process[] }
interface BusinessUnit { id: number; name: string; code: string; macro_processes: MacroProcess[] }
interface Document {
  id: number
  name: string
  file_name: string
  mime_type: string
  file_size: number
  category: string | null
  description: string | null
}
interface Framework {
  id: number; code: string; name: string; version: string | null; type: string
  status: string; publisher: string | null; release_date: string | null
  effective_date: string | null; retired_date: string | null
  description: string | null; language: string | null; url_reference: string | null
  documents: Document[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('image')) return '🖼️'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️'
  return '📎'
}

// ─── ManageDialog ─────────────────────────────────────────────────────────────
interface ManageDialogProps {
  open: boolean; onOpenChange: (v: boolean) => void
  title: string; description: string; icon: React.ReactNode
  accentFrom: string; accentTo: string
  items: { id: number; name: string }[]
  selectedIds: string[]
  onToggle: (item: { id: number; name: string }) => void
  onAdd: (name: string) => void
  onEdit: (item: { id: number; name: string }, newName: string) => void
  onDelete: (item: { id: number; name: string }) => void
}

function ManageDialog({
  open, onOpenChange, title, description, icon, accentFrom, accentTo,
  items, selectedIds, onToggle, onAdd, onEdit, onDelete,
}: ManageDialogProps) {
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [editingItem, setEditingItem] = useState<{ id: number; name: string } | null>(null)
  const [editingName, setEditingName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSearch(''); setNewName(''); setEditingItem(null)
      setEditingName(''); setConfirmDelete(null)
      setTimeout(() => searchRef.current?.focus(), 80)
    }
  }, [open])

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  const handleAdd = () => { const t = newName.trim(); if (!t) return; onAdd(t); setNewName('') }
  const handleEdit = () => {
    if (!editingItem || !editingName.trim()) return
    onEdit(editingItem, editingName.trim())
    setEditingItem(null); setEditingName('')
  }
  const handleDelete = () => { if (!confirmDelete) return; onDelete(confirmDelete); setConfirmDelete(null) }
  const selectedCount = selectedIds.length

  return (
    <>
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative rounded-2xl shadow-2xl p-6 w-80 border bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-700/60" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50 dark:bg-red-500/10">
              <Trash2 className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-center font-semibold mb-1 text-gray-900 dark:text-gray-100">Delete item?</h3>
            <p className="text-center text-sm mb-5 text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-200">"{confirmDelete.name}"</span> will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-red-500 hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className={cn('fixed inset-0 z-[60] flex items-center justify-center transition-all duration-300', open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}>
        <div className={cn('absolute inset-0 transition-all duration-300', open ? 'bg-black/40 dark:bg-black/65 backdrop-blur-md' : 'bg-transparent backdrop-blur-none')} onClick={() => onOpenChange(false)} />
        <div className={cn('relative w-[520px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden transition-all duration-300 bg-white/85 dark:bg-gray-900/80 border border-white/70 dark:border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.55)]', open ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4')} style={{ backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)' }}>
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 dark:opacity-30" style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }} />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-10 dark:opacity-20" style={{ background: `linear-gradient(135deg, ${accentTo}, ${accentFrom})` }} />

          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}>
                  <span className="text-white">{icon}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-50">{title}</h2>
                  <p className="text-xs mt-0.5 text-gray-400 dark:text-gray-500">{description}</p>
                </div>
              </div>
              <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-gray-100/80 hover:bg-gray-200/80 text-gray-400 hover:text-gray-600 dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            {selectedCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedIds.map(id => {
                  const item = items.find(i => i.id.toString() === id)
                  if (!item) return null
                  return (
                    <span key={id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all" style={{ background: `linear-gradient(135deg, ${accentFrom}20, ${accentTo}20)`, borderColor: `${accentFrom}45`, color: accentFrom }}>
                      {item.name}
                      <button onClick={() => onToggle(item)} className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <div className="relative px-6 pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-sm focus:outline-none transition-all bg-black/5 border border-black/8 text-gray-800 placeholder-gray-400 dark:bg-white/8 dark:border-white/10 dark:text-gray-100 dark:placeholder-gray-600 focus:bg-white focus:dark:bg-white/15"
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px ${accentFrom}30` }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none' }} />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"><X className="h-4 w-4" /></button>}
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-xs text-gray-400 dark:text-gray-600">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
              {selectedCount > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${accentFrom}18`, color: accentFrom }}>{selectedCount} selected</span>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-3 space-y-1.5">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-gray-600">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No results for "{search}"</p>
              </div>
            ) : filtered.map(item => {
              const isSelected = selectedIds.includes(item.id.toString())
              const isEditing = editingItem?.id === item.id
              return (
                <div key={item.id} className={cn('group flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-150', !isSelected && 'bg-white/50 hover:bg-white/80 border-gray-100/80 hover:border-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/8 dark:hover:border-white/15')} style={isSelected ? { background: `linear-gradient(135deg, ${accentFrom}14, ${accentTo}08)`, borderColor: `${accentFrom}40` } : {}}>
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input value={editingName} onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') { setEditingItem(null); setEditingName('') } }}
                        className="flex-1 px-3 py-1.5 text-sm rounded-xl border focus:outline-none bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        style={{ borderColor: `${accentFrom}55`, boxShadow: `0 0 0 3px ${accentFrom}20` }} autoFocus />
                      <button onClick={handleEdit} className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow" style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}><Check className="h-4 w-4" /></button>
                      <button onClick={() => { setEditingItem(null); setEditingName('') }} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-white/10"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <button className="flex items-center gap-3 flex-1 text-left" onClick={() => onToggle(item)}>
                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200', !isSelected && 'border-gray-300 dark:border-gray-600')} style={isSelected ? { background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`, borderColor: accentFrom, boxShadow: `0 2px 8px ${accentFrom}55` } : {}}>
                          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                        </div>
                        <span className={cn('text-sm font-medium transition-colors', !isSelected && 'text-gray-700 dark:text-gray-300')} style={isSelected ? { color: accentFrom } : {}}>{item.name}</span>
                      </button>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                        <button onClick={() => { setEditingItem(item); setEditingName(item.name) }} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/10"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setConfirmDelete(item)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/15"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className="px-6 py-4 mt-auto border-t bg-white/60 border-black/6 dark:bg-white/5 dark:border-white/8">
            <div className="flex gap-2">
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Add new..."
                className="flex-1 px-4 py-2.5 rounded-2xl text-sm focus:outline-none border bg-white/90 border-black/10 text-gray-800 placeholder-gray-400 dark:bg-white/10 dark:border-white/10 dark:text-gray-100 dark:placeholder-gray-600"
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px ${accentFrom}28`; e.currentTarget.style.borderColor = `${accentFrom}65` }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '' }} />
              <button onClick={handleAdd} disabled={!newName.trim()} className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white flex items-center gap-1.5 transition-all hover:opacity-90 hover:scale-105 disabled:opacity-40 disabled:scale-100 shadow-lg" style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`, boxShadow: `0 4px 14px ${accentFrom}45` }}>
                <Plus className="h-4 w-4" />Add
              </button>
            </div>
            <button onClick={() => onOpenChange(false)} className="mt-3 w-full py-2.5 rounded-2xl text-sm font-semibold text-white bg-gray-900 dark:bg-gray-700">
              Done — {selectedCount} selected
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── TriCheckbox ──────────────────────────────────────────────────────────────
type CheckState = 'none' | 'partial' | 'all'

interface TriCheckboxProps {
  state: CheckState
  onChange: () => void
  className?: string
}

function TriCheckbox({ state, onChange, className }: TriCheckboxProps) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onChange() }}
      className={cn(
        'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150',
        state === 'all'
          ? 'border-emerald-500 bg-emerald-500'
          : state === 'partial'
            ? 'border-emerald-400 bg-emerald-100 dark:bg-emerald-500/20'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent',
        className,
      )}
    >
      {state === 'all' && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      {state === 'partial' && <Minus className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />}
    </button>
  )
}

// ─── ProcessSelector ──────────────────────────────────────────────────────────
interface ProcessSelectorProps {
  businessUnits: BusinessUnit[]
  selectedProcessIds: string[]
  onToggleProcess: (process: Process) => void
  onToggleMacroProcess: (mp: MacroProcess) => void
  onToggleBusinessUnit: (bu: BusinessUnit) => void
  error?: string
}

function ProcessSelector({
  businessUnits,
  selectedProcessIds,
  onToggleProcess,
  onToggleMacroProcess,
  onToggleBusinessUnit,
  error,
}: ProcessSelectorProps) {
  const [expandedBUs, setExpandedBUs] = useState<Set<number>>(new Set())
  const [expandedMPs, setExpandedMPs] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (selectedProcessIds.length === 0) return
    const buIds = new Set<number>()
    const mpIds = new Set<number>()
    businessUnits.forEach(bu => {
      bu.macro_processes.forEach(mp => {
        mp.processes.forEach(p => {
          if (selectedProcessIds.includes(p.id.toString())) {
            buIds.add(bu.id)
            mpIds.add(mp.id)
          }
        })
      })
    })
    setExpandedBUs(buIds)
    setExpandedMPs(mpIds)
  }, [])

  const toggleBU = (id: number) => setExpandedBUs(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const toggleMP = (id: number) => setExpandedMPs(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const getBUState = (bu: BusinessUnit): CheckState => {
    const all = bu.macro_processes.flatMap(mp => mp.processes)
    if (all.length === 0) return 'none'
    const selected = all.filter(p => selectedProcessIds.includes(p.id.toString()))
    if (selected.length === 0) return 'none'
    if (selected.length === all.length) return 'all'
    return 'partial'
  }

  const getMPState = (mp: MacroProcess): CheckState => {
    if (mp.processes.length === 0) return 'none'
    const selected = mp.processes.filter(p => selectedProcessIds.includes(p.id.toString()))
    if (selected.length === 0) return 'none'
    if (selected.length === mp.processes.length) return 'all'
    return 'partial'
  }

  const countSelectedInBU = (bu: BusinessUnit) =>
    bu.macro_processes.reduce((acc, mp) =>
      acc + mp.processes.filter(p => selectedProcessIds.includes(p.id.toString())).length, 0)

  const countSelectedInMP = (mp: MacroProcess) =>
    mp.processes.filter(p => selectedProcessIds.includes(p.id.toString())).length

  const q = search.toLowerCase().trim()
  const filteredBUs = q
    ? businessUnits
        .map(bu => ({
          ...bu,
          macro_processes: bu.macro_processes
            .map(mp => ({
              ...mp,
              processes: mp.processes.filter(p =>
                p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
              ),
            }))
            .filter(mp =>
              mp.name.toLowerCase().includes(q) ||
              mp.code.toLowerCase().includes(q) ||
              mp.processes.length > 0
            ),
        }))
        .filter(bu =>
          bu.name.toLowerCase().includes(q) ||
          bu.code.toLowerCase().includes(q) ||
          bu.macro_processes.length > 0
        )
    : businessUnits

  if (businessUnits.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        Aucune business unit disponible.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search processes..."
          className="pl-8 pr-8 h-9 text-sm"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className={cn('rounded-xl border overflow-hidden', error ? 'border-destructive' : 'border-input')}>
        {filteredBUs.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm italic">
            No matching processes found.
          </div>
        ) : filteredBUs.map((bu, buIdx) => {
          const buExpanded = expandedBUs.has(bu.id) || !!q
          const buState = getBUState(bu)
          const buCount = countSelectedInBU(bu)

          return (
            <div key={bu.id} className={cn(buIdx > 0 && 'border-t border-input')}>
              <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-accent/40 transition-colors">
                <TriCheckbox state={buState} onChange={() => onToggleBusinessUnit(bu)} />
                <button type="button" onClick={() => toggleBU(bu.id)} className="flex items-center gap-2.5 flex-1 text-left min-w-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/20">
                    <Building2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate block">{bu.name}</span>
                    {bu.code && <span className="text-xs text-muted-foreground">{bu.code}</span>}
                  </div>
                </button>
                {buCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 flex-shrink-0">
                    {buCount}
                  </span>
                )}
                <button type="button" onClick={() => toggleBU(bu.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                  {buExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {buExpanded && (
                <div className="border-t border-input/50 bg-muted/20">
                  {bu.macro_processes.length === 0 ? (
                    <p className="px-12 py-2.5 text-xs text-muted-foreground italic">Aucun macro-processus</p>
                  ) : bu.macro_processes.map((mp, mpIdx) => {
                    const mpExpanded = expandedMPs.has(mp.id) || !!q
                    const mpState = getMPState(mp)
                    const mpCount = countSelectedInMP(mp)

                    return (
                      <div key={mp.id} className={cn(mpIdx > 0 && 'border-t border-input/30')}>
                        <div className="flex items-center gap-2 pl-8 pr-3 py-2 hover:bg-accent/30 transition-colors">
                          <TriCheckbox state={mpState} onChange={() => onToggleMacroProcess(mp)} />
                          <button type="button" onClick={() => toggleMP(mp.id)} className="flex items-center gap-2.5 flex-1 text-left min-w-0">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/20">
                              <Layers className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-foreground truncate block">{mp.name}</span>
                              {mp.code && <span className="text-xs text-muted-foreground">{mp.code}</span>}
                            </div>
                          </button>
                          {mpCount > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 flex-shrink-0">
                              {mpCount}
                            </span>
                          )}
                          <button type="button" onClick={() => toggleMP(mp.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                            {mpExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        </div>

                        {mpExpanded && (
                          <div className="border-t border-input/20 bg-muted/30">
                            {mp.processes.length === 0 ? (
                              <p className="px-20 py-2 text-xs text-muted-foreground italic">Aucun processus</p>
                            ) : mp.processes.map(process => {
                              const isSelected = selectedProcessIds.includes(process.id.toString())
                              return (
                                <button
                                  key={process.id}
                                  type="button"
                                  onClick={() => onToggleProcess(process)}
                                  className={cn(
                                    'w-full flex items-center gap-2.5 pl-[4.5rem] pr-4 py-2 text-left transition-all',
                                    isSelected ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-accent/20'
                                  )}
                                >
                                  <div className={cn(
                                    'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                    isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600'
                                  )}>
                                    {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className={cn('text-sm font-medium truncate block', isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground')}>
                                      {process.name}
                                    </span>
                                    {process.code && <span className="text-xs text-muted-foreground">{process.code}</span>}
                                  </div>
                                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── ExistingDocumentsList ────────────────────────────────────────────────────
interface ExistingDocumentsListProps {
  frameworkId: number
  documents: Document[]
  onDeleted: (docId: number) => void
}

function ExistingDocumentsList({ frameworkId, documents, onDeleted }: ExistingDocumentsListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  if (documents.length === 0) return null

  const handleDelete = (docId: number) => {
    setDeletingId(docId)
    router.delete(
      route('frameworks.documents.destroy', { framework: frameworkId, document: docId }),
      {
        preserveScroll: true,
        onSuccess: () => {
          onDeleted(docId)
          setConfirmId(null)
        },
        onFinish: () => setDeletingId(null),
      }
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground flex items-center gap-2">
        <File className="h-4 w-4 text-muted-foreground" />
        Existing documents
        <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {documents.length}
        </span>
      </p>

      <div className="divide-y divide-input rounded-xl border border-input overflow-hidden">
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center gap-3 px-4 py-3 bg-background hover:bg-accent/20 transition-colors group">
            {/* Icon */}
            <span className="text-xl flex-shrink-0 select-none" aria-hidden>
              {getFileIcon(doc.mime_type)}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(doc.file_size)}
                {doc.category && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                    {doc.category}
                  </span>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {/* Download */}
              <a
                href={route('frameworks.documents.download', { framework: frameworkId, document: doc.id })}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Download"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-3.5 w-3.5" />
              </a>

              {/* Delete */}
              {confirmId === doc.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="h-7 px-2.5 rounded-lg text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 transition-colors disabled:opacity-50"
                  >
                    {deletingId === doc.id ? '...' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(doc.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EditFramework() {
  const { props } = usePage<any>()
  const {
    framework,
    jurisdictions = [],
    tags = [],
    businessUnits = [],
    selectedJurisdictions = [],
    selectedTags = [],
    selectedProcesses = [],
  } = props

  const { data, setData, put, processing, errors, setError, clearErrors } = useForm({
    code:           framework.code           || '',
    name:           framework.name           || '',
    version:        framework.version        || '',
    type:           framework.type           || '',
    status:         framework.status         || '',
    publisher:      framework.publisher      || '',
    release_date:   framework.release_date   ? framework.release_date.split('T')[0]   : '',
    effective_date: framework.effective_date ? framework.effective_date.split('T')[0] : '',
    retired_date:   framework.retired_date   ? framework.retired_date.split('T')[0]   : '',
    description:    framework.description    || '',
    language:       framework.language       || '',
    url_reference:  framework.url_reference  || '',
    jurisdictions:  selectedJurisdictions.map(String) as string[],
    tags:           selectedTags.map(String)           as string[],
    processes:      selectedProcesses.map(String)      as string[],
    // ── Nouveaux documents à uploader ──
    documents:             [] as File[],
    document_categories:   [] as (string | null)[],
    document_descriptions: [] as (string | null)[],
  })

  // Documents existants (gérés en local pour suppression optimiste)
  const [existingDocuments, setExistingDocuments] = useState<Document[]>(
    framework.documents ?? []
  )

  const [jurisdictionsDialogOpen, setJurisdictionsDialogOpen] = useState(false)
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false)
  const [flashOpen, setFlashOpen] = useState(false)
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [effectiveOpen, setEffectiveOpen] = useState(false)
  const [retiredOpen, setRetiredOpen] = useState(false)

  const [jurisdictionsList, setJurisdictionsList] = useState<Jurisdiction[]>(jurisdictions)
  const [tagsList, setTagsList] = useState<Tag[]>(tags)

  useEffect(() => {
    if (props.flash?.success || props.flash?.error) {
      setFlash({ type: props.flash.success ? 'success' : 'error', message: props.flash.success || props.flash.error })
      setFlashOpen(true)
    }
  }, [props.flash])

// ─── Refs stale-closure fix ───────────────────────────────────────────────
  const jurisdictionsRef = useRef<string[]>([])
  const tagsRef = useRef<string[]>([])
  const processesRef = useRef<string[]>([])
  useEffect(() => { jurisdictionsRef.current = data.jurisdictions }, [data.jurisdictions])
  useEffect(() => { tagsRef.current = data.tags }, [data.tags])
  useEffect(() => { processesRef.current = data.processes }, [data.processes])

  // ─── Clear stale server errors on mount ──────────────────────────────────
  useEffect(() => { clearErrors() }, [])

  // ─── Documents handlers ───────────────────────────────────────────────────
  const handleFilesChange = (files: FileUploadItem[]) => {
    setData(prev => ({
  ...prev,
  documents: files.map(f => f.file),
  document_categories: files.map(() => null),
  document_descriptions: files.map(() => null),
}))
  }

  const handleDocumentDeleted = (docId: number) => {
    setExistingDocuments(prev => prev.filter(d => d.id !== docId))
  }

  // ─── Process handlers ─────────────────────────────────────────────────────
  const toggleProcess = (process: Process) => {
    const idStr = process.id.toString()
    const next = processesRef.current.includes(idStr)
      ? processesRef.current.filter(id => id !== idStr)
      : [...processesRef.current, idStr]
    processesRef.current = next
    setData('processes', next)
  }

  const toggleMacroProcess = (mp: MacroProcess) => {
    const procIds = mp.processes.map(p => p.id.toString())
    const current = processesRef.current
    const allSelected = procIds.every(id => current.includes(id))
    const next = allSelected
      ? current.filter(id => !procIds.includes(id))
      : [...current, ...procIds.filter(id => !current.includes(id))]
    processesRef.current = next
    setData('processes', next)
  }

  const toggleBusinessUnit = (bu: BusinessUnit) => {
    const allProcIds = bu.macro_processes.flatMap(mp => mp.processes.map(p => p.id.toString()))
    const current = processesRef.current
    const allSelected = allProcIds.every(id => current.includes(id))
    const next = allSelected
      ? current.filter(id => !allProcIds.includes(id))
      : [...current, ...allProcIds.filter(id => !current.includes(id))]
    processesRef.current = next
    setData('processes', next)
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()
    const errs: Record<string, string> = {}
    if (!data.code.trim())               errs.code          = 'Code is required'
    if (!data.name.trim())               errs.name          = 'Name is required'
    if (!data.type)                      errs.type          = 'Type is required'
    if (!data.status)                    errs.status        = 'Status is required'
    if (data.jurisdictions.length === 0) errs.jurisdictions = 'At least one jurisdiction is required'
    if (Object.keys(errs).length > 0) {
      Object.entries(errs).forEach(([k, v]) => setError(k as any, v))
      return
    }
    put(`/frameworks/${framework.id}`, {
      preserveScroll: true,
      onSuccess: () => router.visit('/frameworks'),
    })
  }

  // ─── Jurisdiction handlers ────────────────────────────────────────────────
  const toggleJurisdiction = (item: Jurisdiction) => {
    const idStr = item.id.toString()
    const next = jurisdictionsRef.current.includes(idStr)
      ? jurisdictionsRef.current.filter(id => id !== idStr)
      : [...jurisdictionsRef.current, idStr]
    jurisdictionsRef.current = next; setData('jurisdictions', next)
  }
  const createJurisdiction = (name: string) => {
    router.post('/jurisdictions', { name }, { preserveScroll: true, onSuccess: (page: any) => {
      const r = page.props?.jurisdictions ?? []
      setJurisdictionsList(r)
      const c = r.find((j: Jurisdiction) => j.name === name)
      if (c) toggleJurisdiction(c)
    }})
  }
  const updateJurisdiction = (item: Jurisdiction, newName: string) => {
    router.put(`/jurisdictions/${item.id}`, { name: newName }, { preserveScroll: true, onSuccess: (page: any) => setJurisdictionsList(page.props?.jurisdictions ?? []) })
  }
  const deleteJurisdiction = (item: Jurisdiction) => {
    router.delete(`/jurisdictions/${item.id}`, { preserveScroll: true, onSuccess: () => {
      setJurisdictionsList(prev => prev.filter(j => j.id !== item.id))
      const next = jurisdictionsRef.current.filter(id => id !== item.id.toString())
      jurisdictionsRef.current = next; setData('jurisdictions', next)
    }})
  }

  // ─── Tag handlers ─────────────────────────────────────────────────────────
  const toggleTag = (item: Tag) => {
    const idStr = item.id.toString()
    const next = tagsRef.current.includes(idStr)
      ? tagsRef.current.filter(id => id !== idStr)
      : [...tagsRef.current, idStr]
    tagsRef.current = next; setData('tags', next)
  }
  const createTag = (name: string) => {
    router.post('/tags', { name }, { preserveScroll: true, onSuccess: (page: any) => {
      const r = page.props?.tags ?? []
      setTagsList(r)
      const c = r.find((t: Tag) => t.name === name)
      if (c) toggleTag(c)
    }})
  }
  const updateTag = (item: Tag, newName: string) => {
    router.put(`/tags/${item.id}`, { name: newName }, { preserveScroll: true, onSuccess: () => setTagsList(prev => prev.map(t => t.id === item.id ? { ...t, name: newName } : t)) })
  }
  const deleteTag = (item: Tag) => {
    router.delete(`/tags/${item.id}`, { preserveScroll: true, onSuccess: () => {
      setTagsList(prev => prev.filter(t => t.id !== item.id))
      const next = tagsRef.current.filter(id => id !== item.id.toString())
      tagsRef.current = next; setData('tags', next)
    }})
  }

const allProcesses = useMemo(() =>
  (businessUnits as BusinessUnit[])
    .flatMap(bu => bu.macro_processes.flatMap(mp => mp.processes)),
[businessUnits])
  const selectedProcessesList = allProcesses.filter(p => data.processes.includes(p.id.toString()))

  return (
    <AppLayout breadcrumbs={[{ title: 'Frameworks', href: '/frameworks' }, { title: framework.name || 'Edit', href: '' }]}>
      <Head title={`Edit ${framework.name}`} />

      {/* Flash */}
      <Dialog open={flashOpen} onOpenChange={setFlashOpen}>
        <DialogContent className={cn(flash?.type === 'success' ? 'border-green-600' : 'border-red-600')}>
          <DialogHeader>
            <DialogTitle className={cn(flash?.type === 'success' ? 'text-green-600' : 'text-red-600')}>
              {flash?.type === 'success' ? 'Success' : 'Error'}
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">{flash?.message}</p>
          <DialogFooter><Button variant="outline" onClick={() => setFlashOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Dialogs */}
      <ManageDialog open={jurisdictionsDialogOpen} onOpenChange={setJurisdictionsDialogOpen}
        title="Manage Jurisdictions" description="Select geographic scopes for this framework"
        icon={<Globe className="h-5 w-5" />} accentFrom="#6366f1" accentTo="#8b5cf6"
        items={jurisdictionsList} selectedIds={data.jurisdictions}
        onToggle={toggleJurisdiction} onAdd={createJurisdiction} onEdit={updateJurisdiction} onDelete={deleteJurisdiction} />
      <ManageDialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}
        title="Manage Tags" description="Categorize and label this framework"
        icon={<TagIcon className="h-5 w-5" />} accentFrom="#0ea5e9" accentTo="#06b6d4"
        items={tagsList} selectedIds={data.tags}
        onToggle={toggleTag} onAdd={createTag} onEdit={updateTag} onDelete={deleteTag} />

      <div className="space-y-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Framework</h1>
            <p className="text-muted-foreground mt-1.5">Update <span className="font-medium text-foreground">{framework.name}</span></p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/frameworks"><ChevronLeft className="mr-2 h-4 w-4" />Back</Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── Basic Information ── */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5"><Building2 className="h-5 w-5 text-primary" /></div>
                <div><CardTitle>Basic Information</CardTitle><CardDescription>Required fields are marked with *</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Code <span className="text-destructive">*</span></Label>
                  <Input value={data.code} onChange={e => { setData('code', e.target.value.toUpperCase()); clearErrors('code') }} className={cn(errors.code && 'border-destructive')} placeholder="e.g. ISO27001" />
                  {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Name <span className="text-destructive">*</span></Label>
                  <Input value={data.name} onChange={e => { setData('name', e.target.value); clearErrors('name') }} className={cn(errors.name && 'border-destructive')} placeholder="e.g. ISO/IEC 27001:2022" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input value={data.version} onChange={e => setData('version', e.target.value)} placeholder="2022, v1.1" />
                </div>
                <div className="space-y-2">
                  <Label>Type <span className="text-destructive">*</span></Label>
                  <Select value={data.type} onValueChange={v => { setData('type', v); clearErrors('type') }}>
                    <SelectTrigger className={cn(errors.type && 'border-destructive')}><SelectValue placeholder="Select type..." /></SelectTrigger>
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
                  <Label>Status <span className="text-destructive">*</span></Label>
                  <Select value={data.status} onValueChange={v => { setData('status', v); clearErrors('status') }}>
                    <SelectTrigger className={cn(errors.status && 'border-destructive')}><SelectValue placeholder="Select status..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Publisher</Label>
                <Input value={data.publisher} onChange={e => setData('publisher', e.target.value)} placeholder="ISO, NIST, European Union..." />
              </div>
            </CardContent>
          </Card>

          {/* ── Jurisdictions & Tags ── */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5"><Globe className="h-5 w-5 text-primary" /></div>
                <div><CardTitle>Jurisdictions & Tags</CardTitle><CardDescription>Geographic scope and categorization</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Jurisdictions <span className="text-destructive">*</span></Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => { clearErrors('jurisdictions'); setJurisdictionsDialogOpen(true) }}>
                    <Plus className="h-4 w-4 mr-1.5" />{data.jurisdictions.length === 0 ? 'Select' : 'Edit selection'}
                  </Button>
                </div>
                <div onClick={() => { clearErrors('jurisdictions'); setJurisdictionsDialogOpen(true) }} className={cn('min-h-[44px] w-full rounded-xl border px-3 py-2 cursor-pointer transition-all flex flex-wrap gap-1.5 items-center', errors.jurisdictions ? 'border-destructive bg-destructive/5' : 'border-input hover:border-primary/50 bg-background hover:bg-accent/30')}>
                  {data.jurisdictions.length === 0
                    ? <span className="text-sm text-muted-foreground">Click to select jurisdictions...</span>
                    : data.jurisdictions.map(id => {
                        const j = jurisdictionsList.find(j => j.id.toString() === id)
                        return j ? (
                          <span key={id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ background: 'linear-gradient(135deg, #6366f120, #8b5cf620)', borderColor: '#6366f145', color: '#6366f1' }}>
                            {j.name}
                            <button type="button" onClick={e => { e.stopPropagation(); toggleJurisdiction(j) }} className="ml-0.5 opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
                          </span>
                        ) : null
                      })}
                </div>
                {errors.jurisdictions && <p className="text-sm text-destructive">{errors.jurisdictions}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label><TagIcon className="h-4 w-4 inline mr-1.5" />Tags</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setTagsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />{data.tags.length === 0 ? 'Select' : 'Edit selection'}
                  </Button>
                </div>
                <div onClick={() => setTagsDialogOpen(true)} className="min-h-[44px] w-full rounded-xl border border-input px-3 py-2 cursor-pointer flex flex-wrap gap-1.5 items-center transition-all hover:border-primary/50 bg-background hover:bg-accent/30">
                  {data.tags.length === 0
                    ? <span className="text-sm text-muted-foreground">Click to select tags...</span>
                    : data.tags.map(id => {
                        const t = tagsList.find(t => t.id.toString() === id)
                        return t ? (
                          <span key={id} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ background: 'linear-gradient(135deg, #0ea5e920, #06b6d420)', borderColor: '#0ea5e945', color: '#0ea5e9' }}>
                            {t.name}
                            <button type="button" onClick={e => { e.stopPropagation(); toggleTag(t) }} className="ml-0.5 opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
                          </span>
                        ) : null
                      })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Process Scope ── */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5"><Layers className="h-5 w-5 text-primary" /></div>
                <div>
                  <CardTitle>Process Scope</CardTitle>
                  <CardDescription>Business units, macro-processes and processes covered by this framework</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              {selectedProcessesList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 self-center mr-1">
                    {selectedProcessesList.length} process{selectedProcessesList.length > 1 ? 'es' : ''} selected:
                  </span>
                  {selectedProcessesList.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-white dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                      {p.name}
                      <button type="button" onClick={() => toggleProcess(p)} className="ml-0.5 opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <ProcessSelector
                businessUnits={businessUnits}
                selectedProcessIds={data.processes}
                onToggleProcess={toggleProcess}
                onToggleMacroProcess={toggleMacroProcess}
                onToggleBusinessUnit={toggleBusinessUnit}
                error={errors.processes}
              />
              {errors.processes && <p className="text-sm text-destructive">{errors.processes}</p>}
            </CardContent>
          </Card>

          {/* ── Important Dates ── */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5"><CalendarIcon className="h-5 w-5 text-primary" /></div>
                <div><CardTitle>Important Dates</CardTitle><CardDescription>Timeline of the framework lifecycle</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  { label: 'Release Date',            field: 'release_date'   as const, open: releaseOpen,   setOpen: setReleaseOpen   },
                  { label: 'Effective Date',           field: 'effective_date' as const, open: effectiveOpen, setOpen: setEffectiveOpen },
                  { label: 'Retired Date (optional)',  field: 'retired_date'   as const, open: retiredOpen,   setOpen: setRetiredOpen   },
                ].map(({ label, field, open, setOpen }) => (
                  <div key={field} className="space-y-2">
                    <Label>{label}</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal h-11', !data[field] && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />{data[field] ? format(new Date(data[field]), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={data[field] ? new Date(data[field]) : undefined} onSelect={date => { setData(field, date ? format(date, 'yyyy-MM-dd') : ''); setOpen(false) }} initialFocus />
                      </PopoverContent>
                    </Popover>
                    {errors[field] && <p className="text-sm text-destructive">{errors[field]}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Description & Reference ── */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5"><FileText className="h-5 w-5 text-primary" /></div>
                <div><CardTitle>Description & Reference</CardTitle><CardDescription>Full description and official source</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={data.description} onChange={e => setData('description', e.target.value)} placeholder="Purpose of the framework..." className="min-h-[160px] resize-y" />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={data.language} onValueChange={v => setData('language', v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select language..." /></SelectTrigger>
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
                  <Input type="url" value={data.url_reference} onChange={e => setData('url_reference', e.target.value)} placeholder="https://www.iso.org/standard/..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Documents ─────────────────────────────────────────────────────── */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Documents</CardTitle>
                  <CardDescription className="text-xs">
                    Manage attached files for this framework (max 10 MB each)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Documents existants */}
              <ExistingDocumentsList
                frameworkId={framework.id}
                documents={existingDocuments}
                onDeleted={handleDocumentDeleted}
              />

              {/* Séparateur si des docs existants sont présents */}
              {existingDocuments.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium px-2">Add new files</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {/* Upload de nouveaux fichiers */}
              <CardUpload
                maxFiles={10}
                maxSize={10 * 1024 * 1024}
                accept="*"
                multiple={true}
                simulateUpload={true}
                onFilesChange={handleFilesChange}
                labels={{
                  dropzone: 'Drag & drop files here, or click to select',
                  browse: 'Browse files',
                  maxSize: 'Max file size: 10 MB',
                  filesCount: 'files uploaded',
                  addFiles: 'Add more files',
                  removeAll: 'Remove all',
                }}
              />

              {errors.documents && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.documents}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-4 pt-8">
            <Button variant="outline" size="lg" asChild disabled={processing}>
              <Link href="/frameworks">Cancel</Link>
            </Button>
            <Button type="submit" size="lg" disabled={processing} className="min-w-[200px]">
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}