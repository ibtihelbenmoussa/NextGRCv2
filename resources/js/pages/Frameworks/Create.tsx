// resources/js/pages/Frameworks/Create.tsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { Head, Link, useForm, usePage, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CardUpload, type FileUploadItem } from '@/components/card-upload'
import { route } from 'ziggy-js'                    // ← Ajouté
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
  Layers, ChevronRight, ChevronDown, Minus,FileUp,           // ← AJOUTÉ ICI
} from 'lucide-react'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Jurisdiction { id: number; name: string }
interface Tag { id: number; name: string }
interface Process { id: number; name: string; code: string; macro_process_id: number }
interface MacroProcess { id: number; name: string; code: string; business_unit_id: number; processes: Process[] }
interface BusinessUnit { id: number; name: string; code: string; macro_processes: MacroProcess[] }

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

  if (!open) return null

  return (
    <>
      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl border bg-background shadow-xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Delete item?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">"{confirmDelete.name}"</span> will be permanently removed.
                </p>
              </div>
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 text-sm font-medium rounded-lg border border-input bg-background hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 text-sm font-semibold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg flex flex-col max-h-[85vh] rounded-2xl border bg-background shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
              >
                {icon}
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0 ml-4"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Selected pills */}
          {selectedCount > 0 && (
            <div className="px-6 pt-3 pb-0 flex flex-wrap gap-1.5">
              {selectedIds.map(id => {
                const item = items.find(i => i.id.toString() === id)
                if (!item) return null
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border"
                    style={{
                      background: `${accentFrom}15`,
                      borderColor: `${accentFrom}35`,
                      color: accentFrom,
                    }}
                  >
                    {item.name}
                    <button onClick={() => onToggle(item)} className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          {/* Search */}
          <div className="px-6 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-9 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring/50 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5 px-0.5">
              <span className="text-xs text-muted-foreground">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
              {selectedCount > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${accentFrom}15`, color: accentFrom }}
                >
                  {selectedCount} selected
                </span>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 pb-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No results for "{search}"</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map(item => {
                  const isSelected = selectedIds.includes(item.id.toString())
                  const isEditing = editingItem?.id === item.id
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all',
                        isSelected
                          ? 'border-input bg-accent/40'
                          : 'border-transparent hover:border-input hover:bg-accent/30'
                      )}
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
                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                            autoFocus
                          />
                          <button
                            onClick={handleEdit}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                            style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingItem(null); setEditingName('') }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button className="flex items-center gap-3 flex-1 text-left min-w-0" onClick={() => onToggle(item)}>
                            {/* Checkbox */}
                            <div
                              className={cn(
                                'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                isSelected ? 'border-transparent' : 'border-input bg-background'
                              )}
                              style={isSelected ? { background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`, borderColor: accentFrom } : {}}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                            </div>
                            <span className={cn('text-sm font-medium truncate', isSelected ? 'text-foreground' : 'text-foreground/80')}>
                              {item.name}
                            </span>
                          </button>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                            <button
                              onClick={() => { setEditingItem(item); setEditingName(item.name) }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(item)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/30 space-y-3">
            {/* Add new */}
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Add new item..."
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring/50 transition-all"
              />
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            {/* Done */}
            <button
              onClick={() => onOpenChange(false)}
              className="w-full py-2.5 rounded-lg text-sm font-semibold border border-input bg-background hover:bg-accent text-foreground transition-colors"
            >
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

  // ── IDs matchés — on garde les objets ORIGINAUX, on filtre seulement la visibilité ──
  const matchedBUIds = useMemo(() => {
    if (!q) return null
    const ids = new Set<number>()
    businessUnits.forEach(bu => {
      const buMatch = bu.name.toLowerCase().includes(q) || bu.code.toLowerCase().includes(q)
      if (buMatch) { ids.add(bu.id); return }
      bu.macro_processes.forEach(mp => {
        const mpMatch = mp.name.toLowerCase().includes(q) || mp.code.toLowerCase().includes(q)
        if (mpMatch) { ids.add(bu.id); return }
        mp.processes.forEach(p => {
          if (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) ids.add(bu.id)
        })
      })
    })
    return ids
  }, [businessUnits, q])

  const matchedMPIds = useMemo(() => {
    if (!q) return null
    const ids = new Set<number>()
    businessUnits.forEach(bu => {
      const buMatch = bu.name.toLowerCase().includes(q) || bu.code.toLowerCase().includes(q)
      bu.macro_processes.forEach(mp => {
        const mpMatch = mp.name.toLowerCase().includes(q) || mp.code.toLowerCase().includes(q)
        if (buMatch || mpMatch) { ids.add(mp.id); return }
        mp.processes.forEach(p => {
          if (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) ids.add(mp.id)
        })
      })
    })
    return ids
  }, [businessUnits, q])

  const matchedProcessIds = useMemo(() => {
    if (!q) return null
    const ids = new Set<number>()
    businessUnits.forEach(bu => {
      const buMatch = bu.name.toLowerCase().includes(q) || bu.code.toLowerCase().includes(q)
      bu.macro_processes.forEach(mp => {
        const mpMatch = mp.name.toLowerCase().includes(q) || mp.code.toLowerCase().includes(q)
        mp.processes.forEach(p => {
          if (buMatch || mpMatch || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
            ids.add(p.id)
        })
      })
    })
    return ids
  }, [businessUnits, q])

  const visibleBUs = q ? businessUnits.filter(bu => matchedBUIds?.has(bu.id)) : businessUnits

  if (businessUnits.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        Aucune business unit disponible dans cette organisation.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search business units, macro-processes or processes..."
          className="pl-8 pr-8 h-9 text-sm"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Tree — objets originaux, visibilité filtrée par IDs */}
      <div className={cn('rounded-xl border overflow-hidden', error ? 'border-destructive' : 'border-input')}>
        {visibleBUs.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm italic">
            No matching processes found.
          </div>
        ) : visibleBUs.map((bu, buIdx) => {
          const buExpanded = expandedBUs.has(bu.id) || !!q
          const buState = getBUState(bu)
          const buCount = countSelectedInBU(bu)

          return (
            <div key={bu.id} className={cn(buIdx > 0 && 'border-t border-input')}>
              {/* BU row */}
              <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-accent/40 transition-colors group">
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

              {/* MacroProcesses */}
              {buExpanded && (
                <div className="border-t border-input/50 bg-muted/20">
                  {bu.macro_processes.length === 0 ? (
                    <p className="px-12 py-2.5 text-xs text-muted-foreground italic">Aucun macro-processus</p>
                  ) : bu.macro_processes
                      .filter(mp => !q || matchedMPIds?.has(mp.id))
                      .map((mp, mpIdx) => {
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

                            {/* Processes */}
                            {mpExpanded && (
                              <div className="border-t border-input/20 bg-muted/30">
                                {mp.processes.length === 0 ? (
                                  <p className="px-20 py-2 text-xs text-muted-foreground italic">Aucun processus</p>
                                ) : mp.processes
                                    .filter(p => !q || matchedProcessIds?.has(p.id))
                                    .map(process => {
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
                                            <span className={cn(
                                              'text-sm font-medium truncate block',
                                              isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'
                                            )}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateFramework() {
  const { props } = usePage<any>()
  const jurisdictions: Jurisdiction[] = props.jurisdictions ?? []
  const allTags: Tag[] = props.tags ?? []
  const businessUnits: BusinessUnit[] = props.businessUnits ?? []

  const { data, setData, post, processing, errors, setError, clearErrors, reset } = useForm({
    code: '', name: '', version: '', type: '', status: 'draft', publisher: '',
    jurisdictions: [] as string[],
    processes: [] as string[],
    release_date: '', effective_date: '', retired_date: '',
    description: '', language: '', url_reference: '',
    tags: [] as string[],
    documents: [] as File[],
    document_categories: [] as (string | null)[],
    document_descriptions: [] as (string | null)[],
  })

  const [jurisdictionsDialogOpen, setJurisdictionsDialogOpen] = useState(false)
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false)
  const [flashOpen, setFlashOpen] = useState(false)
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [effectiveOpen, setEffectiveOpen] = useState(false)
  const [retiredOpen, setRetiredOpen] = useState(false)

  const [jurisdictionsList, setJurisdictionsList] = useState<Jurisdiction[]>(jurisdictions)
  const [tagsList, setTagsList] = useState<Tag[]>(allTags)

  useEffect(() => {
    if (props.flash?.success || props.flash?.error) {
      setFlash({ type: props.flash.success ? 'success' : 'error', message: props.flash.success || props.flash.error })
      setFlashOpen(true)
    }
  }, [props.flash])

  const processesRef = useRef<string[]>([])
  useEffect(() => { processesRef.current = data.processes }, [data.processes])

  const jurisdictionsRef = useRef<string[]>([])
  const tagsRef = useRef<string[]>([])
  useEffect(() => { jurisdictionsRef.current = data.jurisdictions }, [data.jurisdictions])
  useEffect(() => { tagsRef.current = data.tags }, [data.tags])


  const handleFilesChange = (files: FileUploadItem[]) => {
    setData({
      ...data,
      documents: files.map((f) => f.file),
      document_categories: files.map(() => null),
      document_descriptions: files.map(() => null),
    })
  }
  const toggleProcess = (process: Process) => {
    const idStr = process.id.toString()
    const current = processesRef.current
    const next = current.includes(idStr)
      ? current.filter(id => id !== idStr)
      : [...current, idStr]
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
    post('/frameworks', {
      onSuccess: () => {
        reset()
        setReleaseOpen(false); setEffectiveOpen(false); setRetiredOpen(false)
      },
    })
  }

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

  const allProcesses = businessUnits.flatMap(bu => bu.macro_processes.flatMap(mp => mp.processes))
  const selectedProcesses = allProcesses.filter(p => data.processes.includes(p.id.toString()))

  return (
    <AppLayout breadcrumbs={[{ title: 'Frameworks', href: '/frameworks' }, { title: 'Create', href: '' }]}>
      <Head title="Create Framework" />

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

      <ManageDialog open={jurisdictionsDialogOpen} onOpenChange={setJurisdictionsDialogOpen}
        title="Manage Jurisdictions" description="Select geographic scopes for this framework"
  icon={<TagIcon className="h-5 w-5" />} accentFrom="#6366f1" accentTo="#8b5cf6"
        items={jurisdictionsList} selectedIds={data.jurisdictions}
        onToggle={toggleJurisdiction} onAdd={createJurisdiction} onEdit={updateJurisdiction} onDelete={deleteJurisdiction} />
      <ManageDialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}
        title="Manage Tags" description="Categorize and label this framework"
  icon={<TagIcon className="h-5 w-5" />} accentFrom="#6366f1" accentTo="#8b5cf6"
        items={tagsList} selectedIds={data.tags}
        onToggle={toggleTag} onAdd={createTag} onEdit={updateTag} onDelete={deleteTag} />

      <div className="space-y-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Framework</h1>
            <p className="text-muted-foreground mt-1.5">Add a new compliance, regulatory, contractual or internal framework</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/frameworks"><ChevronLeft className="mr-2 h-4 w-4" />Back</Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic Information */}
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
                  <Label htmlFor="code">Code <span className="text-destructive text-base">*</span></Label>
                  <Input id="code" value={data.code} onChange={e => { setData('code', e.target.value.toUpperCase().trim()); clearErrors('code') }} className={cn(errors.code && 'border-destructive')} placeholder="e.g. ISO27001, GDPR, NIST-CSF" />
                  {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name <span className="text-destructive text-base">*</span></Label>
                  <Input id="name" value={data.name} onChange={e => { setData('name', e.target.value); clearErrors('name') }} className={cn(errors.name && 'border-destructive')} placeholder="e.g. ISO/IEC 27001:2022 – Information Security" />
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
                  <Label>Status <span className="text-destructive text-base">*</span></Label>
                  <Select value={data.status} onValueChange={v => { setData('status', v); clearErrors('status') }}>
                    <SelectTrigger className={cn(errors.status && 'border-destructive')}><SelectValue placeholder="Select status..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Publisher</Label>
                <Input value={data.publisher} onChange={e => setData('publisher', e.target.value)} placeholder="ISO, NIST, European Union, Internal..." />
              </div>
            </CardContent>
          </Card>

          {/* Jurisdictions & Tags */}
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
                  <Label>Jurisdictions <span className="text-destructive text-base">*</span></Label>
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

          {/* Process Scope */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5"><Layers className="h-5 w-5 text-primary" /></div>
                <div>
                  <CardTitle>Process Scope</CardTitle>
                  <CardDescription>Select the business units, macro-processes and processes covered by this framework</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              {selectedProcesses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 self-center mr-1">
                    {selectedProcesses.length} process{selectedProcesses.length > 1 ? 'es' : ''} selected:
                  </span>
                  {selectedProcesses.map(p => (
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

          {/* Important Dates */}
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
                  { label: 'Release Date',           field: 'release_date'   as const, open: releaseOpen,    setOpen: setReleaseOpen },
                  { label: 'Effective Date',          field: 'effective_date' as const, open: effectiveOpen,  setOpen: setEffectiveOpen },
                  { label: 'Retired Date (optional)', field: 'retired_date'   as const, open: retiredOpen,    setOpen: setRetiredOpen },
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description & Reference */}
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
                <Textarea value={data.description} onChange={e => setData('description', e.target.value)} placeholder="Purpose of the framework, main requirements, applicability, responsibilities..." className="min-h-[160px] resize-y" />
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

          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Documents</CardTitle>
                  <CardDescription className="text-xs">
                    Attach files related to this framework (optional, max 10 MB each)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
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
                <p className="text-xs text-destructive mt-2">{errors.documents}</p>
              )}
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