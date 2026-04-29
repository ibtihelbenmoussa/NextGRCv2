// resources/js/pages/Requirements/Edit.tsx
import { useState, useEffect, useRef } from 'react'
import { Head, Link, useForm, usePage, router } from '@inertiajs/react'
import { route } from 'ziggy-js'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, Calendar as CalendarIcon, ListTodo, FileText,
  Tag as TagIcon, FileUp, Paperclip, X, Upload, File,
  AlertCircle, Download, Trash2, ShieldCheck, Lightbulb,
  BookOpen, CheckCircle2, Info,
} from 'lucide-react'
import { MultiSelect } from '@/components/ui/multi-select'

interface Framework { id: number; code: string; name: string }
interface Process   { id: number; name: string; code?: string }
interface Tag       { id: number; name: string }
interface GapQuestion { id?: number; text: string }

interface ExistingDocument {
  id: number; name: string; file_name: string
  file_size: number; mime_type: string
  category: string | null; description: string | null
}

interface Requirement {
  id: number; code: string; title: string
  description: string | null; type: string; status: string
  priority: string; frequency: string
  framework_id: number | null; process_id: number | null
  effective_date: string | null; completion_date: string | null
  compliance_level: string; attachments: string | null
  auto_validate: boolean; documents?: ExistingDocument[]
}

interface PageProps {
  requirement: Requirement
  frameworks: Framework[]
  processes: Process[]
  tags: Tag[]
  selectedTagIds: string[]
  gapQuestions: GapQuestion[]
  flash?: { success?: string; error?: string }
  [key: string]: any
}

const COMPLIANCE_LEVELS = [
  { value: 'Mandatory',   label: 'Mandatory',   icon: ShieldCheck, color: 'red'   as const, description: 'Required by law, regulation, or binding standard.', badge: 'Required' },
  { value: 'Recommended', label: 'Recommended', icon: Lightbulb,   color: 'amber' as const, description: 'Strongly advised by industry best practices.',        badge: 'Best practice' },
  { value: 'Optional',    label: 'Optional',    icon: BookOpen,    color: 'teal'  as const, description: 'Voluntary measure that enhances compliance posture.',  badge: 'Voluntary' },
]

const LEVEL_COLORS = {
  red:   { border: 'border-red-200 dark:border-red-800',   borderActive: 'border-red-500 dark:border-red-400',   bg: 'bg-red-50 dark:bg-red-950',   icon: 'text-red-600 dark:text-red-400',   iconBg: 'bg-red-100 dark:bg-red-900',   badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  amber: { border: 'border-amber-200 dark:border-amber-800', borderActive: 'border-amber-500 dark:border-amber-400', bg: 'bg-amber-50 dark:bg-amber-950', icon: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  teal:  { border: 'border-teal-200 dark:border-teal-800',  borderActive: 'border-teal-500 dark:border-teal-400',  bg: 'bg-teal-50 dark:bg-teal-950',  icon: 'text-teal-600 dark:text-teal-400',  iconBg: 'bg-teal-100 dark:bg-teal-900',  badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
}

const MAX_SIZE_MB = 10
const MAX_FILES   = 10

interface DocEntry { file: File; category: string; description: string; error?: string }

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/'))                            return '🖼️'
  if (mimeType === 'application/pdf')                           return '📄'
  if (mimeType.includes('word'))                                return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  return '📎'
}

const toArray = <T,>(val: T[] | Record<string, T> | null | undefined): T[] => {
  if (!val) return []
  if (Array.isArray(val)) return val
  return Object.values(val)
}

export default function EditRequirement() {
  const { props } = usePage<PageProps>()
  const { requirement, frameworks = [] } = props

  const tags: Tag[]              = toArray(props.tags)
  const selectedTagIds: string[] = toArray(props.selectedTagIds)
  const existingDocs: ExistingDocument[] = toArray(requirement?.documents)

  const formatDateString = (date: string | null) => (date ? date.split('T')[0] : '')

  const { data, setData, processing, errors, setError, clearErrors } = useForm({
    code:             requirement?.code             || '',
    title:            requirement?.title            || '',
    description:      requirement?.description      || '',
    type:             requirement?.type             || '',
    status:           requirement?.status           || '',
    priority:         requirement?.priority         || '',
    frequency:        requirement?.frequency        || '',
    framework_id:     requirement?.framework_id?.toString() || '',
    process_id:       requirement?.process_id?.toString()   || '',
    tags:             selectedTagIds,
    effective_date:   formatDateString(requirement?.effective_date),
    completion_date:  formatDateString(requirement?.completion_date),
    compliance_level: requirement?.compliance_level || '',
    attachments:      requirement?.attachments      || '',
    auto_validate:    requirement?.auto_validate    ?? false,
  })

  // ── Gap Questions state ──────────────────────────────────────────────────
  const [gapQuestions, setGapQuestions] = useState<{ text: string }[]>(
    toArray(props.gapQuestions).map(q => ({ text: q.text }))
  )

  const addGapQuestion    = () => setGapQuestions(prev => [...prev, { text: '' }])
  const removeGapQuestion = (i: number) => setGapQuestions(prev => prev.filter((_, idx) => idx !== i))
  const updateGapQuestion = (i: number, value: string) =>
    setGapQuestions(prev => prev.map((q, idx) => idx === i ? { text: value } : q))

  // ── Processes ────────────────────────────────────────────────────────────
  const [processes,        setProcesses]        = useState<Process[]>(toArray(props.processes))
  const [loadingProcesses, setLoadingProcesses] = useState(false)
  const [initialFrameworkId]                    = useState(requirement?.framework_id?.toString() || '')

  useEffect(() => {
    if (!data.framework_id) { setProcesses([]); setData('process_id', ''); return }
    if (data.framework_id === initialFrameworkId) return
    setLoadingProcesses(true)
    setData('process_id', '')
    router.get(route('requirements.processes-by-framework', data.framework_id), {}, {
      preserveState: true, preserveScroll: true, only: ['processes'],
      onSuccess: (page) => setProcesses((page.props.processes as Process[]) || []),
      onFinish:  () => setLoadingProcesses(false),
    })
  }, [data.framework_id])

  // ── New documents ────────────────────────────────────────────────────────
  const [docs,     setDocs]     = useState<DocEntry[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef            = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | File[]) => {
    const arr       = Array.from(files)
    const remaining = MAX_FILES - docs.length
    if (remaining <= 0) return
    const next: DocEntry[] = arr.slice(0, remaining).map(file => ({
      file, category: '', description: '',
      error: file.size > MAX_SIZE_MB * 1024 * 1024 ? `File exceeds ${MAX_SIZE_MB} MB` : undefined,
    }))
    setDocs(prev => [...prev, ...next])
  }

  const removeDoc  = (idx: number) => setDocs(prev => prev.filter((_, i) => i !== idx))
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  // ── Delete existing doc ──────────────────────────────────────────────────
  const [deletingDocId,   setDeletingDocId]   = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [flash,     setFlash]     = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [flashOpen, setFlashOpen] = useState(false)

  const handleDeleteExisting = (docId: number) => {
    setDeletingDocId(docId)
    router.delete(
      route('requirements.documents.destroy', { requirement: requirement.id, document: docId }),
      {
        preserveScroll: true,
        onSuccess: () => setConfirmDeleteId(null),
        onError:   () => { setFlash({ type: 'error', message: 'Failed to delete document.' }); setFlashOpen(true) },
        onFinish:  () => setDeletingDocId(null),
      }
    )
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    const ve: Record<string, string> = {}
    if (!data.code.trim())      ve.code             = 'Code is required'
    if (!data.title.trim())     ve.title            = 'Title is required'
    if (!data.type)             ve.type             = 'Type is required'
    if (!data.status)           ve.status           = 'Status is required'
    if (!data.priority)         ve.priority         = 'Priority is required'
    if (!data.frequency)        ve.frequency        = 'Frequency is required'
    if (!data.framework_id)     ve.framework_id     = 'Framework is required'
    if (!data.compliance_level) ve.compliance_level = 'Compliance level is required'
    if (Object.keys(ve).length) { Object.entries(ve).forEach(([k, m]) => setError(k as any, m)); return }

    const formData = new FormData()
    formData.append('_method',          'PUT')
    formData.append('code',             data.code)
    formData.append('title',            data.title)
    formData.append('description',      data.description)
    formData.append('type',             data.type)
    formData.append('status',           data.status)
    formData.append('priority',         data.priority)
    formData.append('frequency',        data.frequency)
    formData.append('framework_id',     data.framework_id)
    formData.append('process_id',       data.process_id === 'none' ? '' : (data.process_id || ''))
    formData.append('effective_date',   data.effective_date)
    formData.append('completion_date',  data.completion_date)
    formData.append('compliance_level', data.compliance_level)
    formData.append('attachments',      data.attachments)
    formData.append('auto_validate',    data.auto_validate ? '1' : '0')
    data.tags.forEach(t => formData.append('tags[]', t))

    // ✅ Gap Questions
    formData.append('gap_questions', JSON.stringify(gapQuestions))

    // Documents
    let uploadIndex = 0
    docs.forEach(d => {
      if (d.error) return
      formData.append(`documents[${uploadIndex}]`,             d.file)
      formData.append(`document_categories[${uploadIndex}]`,   d.category)
      formData.append(`document_descriptions[${uploadIndex}]`, d.description)
      uploadIndex++
    })

    router.post(route('requirements.update', requirement.id), formData, {
      preserveScroll: true,
      onSuccess: () => router.visit(route('requirements.index'), { method: 'get', preserveState: false }),
      onError:   () => { setFlash({ type: 'error', message: 'Error updating requirement.' }); setFlashOpen(true) },
    })
  }

  const validDocs  = docs.filter(d => !d.error)
  const hasInvalid = docs.some(d => !!d.error)
  const docToDelete = existingDocs.find(d => d.id === confirmDeleteId)

  const steps = [
    { label: 'Basic info', icon: ListTodo },
    { label: 'Details',    icon: FileText },
    { label: 'Documents',  icon: FileUp },
    { label: 'Gap Questions', icon: ListTodo },
  ]

  return (
    <AppLayout breadcrumbs={[
      { title: 'Requirements', href: route('requirements.index') },
      { title: 'Edit', href: '' },
    ]}>
      <Head title="Edit Requirement" />

      {/* Flash dialog */}
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

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete document?</DialogTitle></DialogHeader>
          <p className="py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{docToDelete?.file_name}</span> will be permanently removed.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deletingDocId === confirmDeleteId}
              onClick={() => confirmDeleteId && handleDeleteExisting(confirmDeleteId)}>
              {deletingDocId === confirmDeleteId ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 p-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit Requirement</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modify <span className="font-medium text-foreground">{requirement?.title || '…'}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href={route('requirements.index')}><ChevronLeft className="mr-1.5 h-4 w-4" />Back</Link>
          </Button>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
                </div>
                {i < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
              </div>
            )
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* SECTION 1 — Basic Information */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <ListTodo className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                  <CardDescription className="text-xs">Fields marked * are required</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-sm">Code <span className="text-destructive">*</span></Label>
                  <Input id="code" placeholder="REQ-001" value={data.code}
                    onChange={e => { setData('code', e.target.value.toUpperCase().trim()); clearErrors('code') }}
                    className={cn('font-mono', errors.code && 'border-destructive')} />
                  {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-sm">Title <span className="text-destructive">*</span></Label>
                  <Input id="title" placeholder="Data Protection Impact Assessment" value={data.title}
                    onChange={e => { setData('title', e.target.value); clearErrors('title') }}
                    className={cn(errors.title && 'border-destructive')} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Framework <span className="text-destructive">*</span></Label>
                <Select value={data.framework_id} onValueChange={v => { setData('framework_id', v); clearErrors('framework_id') }}>
                  <SelectTrigger className={cn(errors.framework_id && 'border-destructive')}>
                    <SelectValue placeholder="Select a framework…" />
                  </SelectTrigger>
                  <SelectContent>
                    {toArray(frameworks).map(fw => (
                      <SelectItem key={fw.id} value={fw.id.toString()}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{fw.code}</span>{fw.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.framework_id && <p className="text-xs text-destructive">{errors.framework_id}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Process (optional)</Label>
                <Select value={data.process_id || 'none'} onValueChange={v => setData('process_id', v === 'none' ? '' : v)}
                  disabled={!data.framework_id || loadingProcesses}>
                  <SelectTrigger><SelectValue placeholder={!data.framework_id ? 'Select a framework first' : loadingProcesses ? 'Loading…' : 'No specific process'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific process</SelectItem>
                    {processes.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.code && <span className="font-mono text-xs text-muted-foreground mr-2">{p.code}</span>}{p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t" />

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Type <span className="text-destructive">*</span></Label>
                  <Select value={data.type} onValueChange={v => { setData('type', v); clearErrors('type') }}>
                    <SelectTrigger className={cn(errors.type && 'border-destructive')}><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regulatory">Regulatory</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="contractual">Contractual</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Status <span className="text-destructive">*</span></Label>
                  <Select value={data.status} onValueChange={v => { setData('status', v); clearErrors('status') }}>
                    <SelectTrigger className={cn(errors.status && 'border-destructive')}><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Priority <span className="text-destructive">*</span></Label>
                  <Select value={data.priority} onValueChange={v => { setData('priority', v); clearErrors('priority') }}>
                    <SelectTrigger className={cn(errors.priority && 'border-destructive')}><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && <p className="text-xs text-destructive">{errors.priority}</p>}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Frequency <span className="text-destructive">*</span></Label>
                  <Select value={data.frequency} onValueChange={v => { setData('frequency', v); clearErrors('frequency') }}>
                    <SelectTrigger className={cn(errors.frequency && 'border-destructive')}><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="continuous">Continuous</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.frequency && <p className="text-xs text-destructive">{errors.frequency}</p>}
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                <Switch id="auto-validate" checked={data.auto_validate}
                  onCheckedChange={checked => setData('auto_validate', checked)} className="mt-0.5" />
                <div>
                  <Label htmlFor="auto-validate" className="text-sm font-medium cursor-pointer">Auto-validate tests</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Automatically accept tests created from predefined test templates.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2 — Details & Context */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Details & Context</CardTitle>
                  <CardDescription className="text-xs">Description, compliance level and scheduling</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-1.5">
                <Label className="text-sm">Description</Label>
                <Textarea placeholder="Detailed explanation…" value={data.description}
                  onChange={e => setData('description', e.target.value)} className="min-h-[130px] resize-y" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Compliance Level <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground mb-3">Choose the obligation strength of this requirement.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {COMPLIANCE_LEVELS.map(level => {
                    const Icon = level.icon
                    const colors = LEVEL_COLORS[level.color]
                    const isSelected = data.compliance_level === level.value
                    return (
                      <button key={level.value} type="button"
                        onClick={() => { setData('compliance_level', level.value); clearErrors('compliance_level') }}
                        className={cn('relative text-left rounded-xl border-2 p-4 transition-all duration-150 focus:outline-none',
                          colors.border, isSelected ? [colors.borderActive, colors.bg] : 'border-border bg-background hover:bg-muted/40')}>
                        {isSelected && <CheckCircle2 className={cn('absolute top-3 right-3 h-4 w-4', colors.icon)} />}
                        <div className={cn('inline-flex items-center justify-center rounded-lg p-2 mb-3', colors.iconBg)}>
                          <Icon className={cn('h-4 w-4', colors.icon)} />
                        </div>
                        <span className={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2', colors.badge)}>{level.badge}</span>
                        <p className="text-sm font-semibold mb-1">{level.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{level.description}</p>
                      </button>
                    )
                  })}
                </div>
                {errors.compliance_level && <p className="text-xs text-destructive mt-1">{errors.compliance_level}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" />Effective Date</Label>
                <Input type="date" value={data.effective_date}
                  onChange={e => setData('effective_date', e.target.value)}
                  className={cn(errors.effective_date && 'border-destructive')} />
                {errors.effective_date
                  ? <p className="text-xs text-destructive">{errors.effective_date}</p>
                  : <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="h-3 w-3 shrink-0" />You can adjust the effective date manually in edit mode.</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5"><TagIcon className="h-3.5 w-3.5" />Tags</Label>
                <MultiSelect options={tags.map(tag => ({ value: tag.id.toString(), label: tag.name }))}
                  value={data.tags} onValueChange={selected => setData('tags', selected)} placeholder="Select relevant tags…" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5"><FileUp className="h-3.5 w-3.5" />Attachments (URLs)</Label>
                <Textarea placeholder={"One link per line\nhttps://drive.google.com/file/…"}
                  value={data.attachments} onChange={e => setData('attachments', e.target.value)}
                  className="min-h-[90px] resize-y font-mono text-xs" />
                <p className="text-xs text-muted-foreground">Supported: Google Drive, SharePoint, OneDrive, and similar links.</p>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3 — Documents */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Paperclip className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Documents</CardTitle>
                  <CardDescription className="text-xs">Attach files (optional, max {MAX_FILES} files, {MAX_SIZE_MB} MB each)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {existingDocs.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Existing documents ({existingDocs.length})</p>
                  {existingDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3">
                      <span className="text-xl leading-none shrink-0">{fileIcon(doc.mime_type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.file_name}</p>
                        <span className="text-xs text-muted-foreground">{formatBytes(doc.file_size)}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={route('requirements.documents.download', { requirement: requirement.id, document: doc.id })}
                          target="_blank" rel="noopener noreferrer"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                          <Download className="h-4 w-4" />
                        </a>
                        <button type="button" onClick={() => setConfirmDeleteId(doc.id)}
                          disabled={deletingDocId === doc.id}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                {existingDocs.length > 0 && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Add new documents</p>}
                <div onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn('flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors select-none',
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/40')}>
                  <div className="rounded-full bg-muted p-3"><Upload className="h-6 w-6 text-muted-foreground" /></div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Drop files here or <span className="text-primary underline underline-offset-2">browse</span></p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, images — up to {MAX_SIZE_MB} MB each</p>
                  </div>
                  <input ref={fileInputRef} type="file" multiple className="hidden"
                    onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
                </div>
              </div>

              {docs.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">
                    {validDocs.length} file{validDocs.length !== 1 ? 's' : ''} ready to upload
                    {hasInvalid && <span className="ml-2 text-destructive font-medium">· {docs.length - validDocs.length} invalid</span>}
                  </p>
                  <div className="space-y-3">
                    {docs.map((doc, idx) => (
                      <div key={idx} className={cn('rounded-lg border p-4', doc.error ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/20')}>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0 rounded-md bg-background p-1.5 shadow-sm border">
                            <File className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-tight">{doc.file.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(doc.file.size)}</p>
                            {doc.error && <p className="flex items-center gap-1 text-xs text-destructive mt-1"><AlertCircle className="h-3 w-3" />{doc.error}</p>}
                          </div>
                          <button type="button" onClick={() => removeDoc(idx)}
                            className="ml-auto shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* SECTION 4 — Gap Questions */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <ListTodo className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Gap Assessment Questions</CardTitle>
                    <CardDescription className="text-xs">
                      Define the questions used to evaluate maturity for this requirement
                    </CardDescription>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addGapQuestion}>
                  + Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {gapQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/60 rounded-xl">
                  <ListTodo className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No questions yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Click "Add Question" to define gap assessment questions</p>
                </div>
              ) : (
                gapQuestions.map((q, index) => (
                  <div key={index} className="relative rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Question {index + 1}
                      </span>
                      <Button type="button" variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeGapQuestion(index)}>
                        ✕
                      </Button>
                    </div>
                    <Textarea
                      placeholder="e.g. Are access controls formally documented and reviewed?"
                      value={q.text}
                      onChange={e => updateGapQuestion(index, e.target.value)}
                      className="min-h-[80px] resize-y"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">Fields marked <span className="text-destructive">*</span> are required.</p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" disabled={processing} asChild>
                <Link href={route('requirements.index')}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing} className="min-w-[160px]">
                {processing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>Saving…
                  </span>
                ) : 'Save Changes'}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </AppLayout>
  )
}