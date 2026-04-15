import { useState, useEffect } from 'react'
import { Head, Link, useForm, usePage, router } from '@inertiajs/react'
import { route } from 'ziggy-js'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronDown,
  Calendar as CalendarIcon,
  ListTodo,
  FileText,
  Tag as TagIcon,
  FileUp,
  ShieldCheck,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Info,
  ClipboardList,
} from 'lucide-react'
import { format } from 'date-fns'
import { MultiSelect } from '@/components/ui/multi-select'
import { CardUpload, type FileUploadItem } from '@/components/card-upload'

interface Framework { id: number; code: string; name: string }
interface Process    { id: number; name: string; code?: string }
interface Tag        { id: number; name: string }

const COMPLIANCE_LEVELS = [
  {
    value: 'Mandatory', label: 'Mandatory', icon: ShieldCheck, color: 'red' as const,
    description: 'Required by law, regulation, or binding standard. Non-compliance may result in legal penalties or sanctions.',
    badge: 'Required',
  },
  {
    value: 'Recommended', label: 'Recommended', icon: Lightbulb, color: 'amber' as const,
    description: 'Strongly advised by industry best practices or regulatory guidance. Non-compliance carries reputational or audit risk.',
    badge: 'Best practice',
  },
  {
    value: 'Optional', label: 'Optional', icon: BookOpen, color: 'teal' as const,
    description: 'Voluntary measure that enhances overall compliance posture. Adopted at the discretion of the organisation.',
    badge: 'Voluntary',
  },
]

const LEVEL_COLORS = {
  red: {
    border: 'border-red-200 dark:border-red-800',
    borderActive: 'border-red-500 dark:border-red-400',
    bg: 'bg-red-50 dark:bg-red-950',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    ring: 'ring-red-400',
  },
  amber: {
    border: 'border-amber-200 dark:border-amber-800',
    borderActive: 'border-amber-500 dark:border-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    ring: 'ring-amber-400',
  },
  teal: {
    border: 'border-teal-200 dark:border-teal-800',
    borderActive: 'border-teal-500 dark:border-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950',
    icon: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-900',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    ring: 'ring-teal-400',
  },
}

export default function CreateRequirement() {
  const { props } = usePage<any>()
  const frameworks: Framework[] = props.frameworks ?? []
  const tags: Tag[]             = props.tags       ?? []

  const { data, setData, post, processing, errors, clearErrors, reset, setError } = useForm({
    code:             '',
    title:            '',
    description:      '',
    type:             '',
    status:           '',
    priority:         '',
    frequency:        '',
    framework_id:     '',
    process_ids:      [] as string[],
    tags:             [] as string[],
    effective_date:   new Date().toISOString().split('T')[0],
    completion_date:  '',
    compliance_level: '',
    attachments:      '',
    auto_validate:    false,
    documents:        [] as File[],
    document_categories:   [] as (string | null)[],
    document_descriptions: [] as (string | null)[],
    predefined_test: {
      test_code: '',
      test_name: '',
      objective: '',
      procedure: '',
    },
  })

  const [processes, setProcesses]               = useState<Process[]>([])
  const [loadingProcesses, setLoadingProcesses] = useState(false)
  const [showPredefinedTest, setShowPredefinedTest] = useState(false)

  const handleFilesChange = (files: FileUploadItem[]) => {
    setData({
      ...data,
      documents:             files.map((f) => f.file),
      document_categories:   files.map(() => null),
      document_descriptions: files.map(() => null),
    })
  }

  useEffect(() => {
    if (!data.framework_id) {
      setProcesses([])
      setData('process_ids', [])
      return
    }
    setLoadingProcesses(true)
    router.get(
      route('requirements.processes-by-framework', data.framework_id),
      {},
      {
        preserveState: true,
        preserveScroll: true,
        only: ['processes'],
        onSuccess: (page) => {
          setProcesses((page.props.processes as Process[]) || [])
          setData('process_ids', [])
        },
        onFinish: () => setLoadingProcesses(false),
      }
    )
  }, [data.framework_id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.code.trim())       { setError('code',             'Code is required');             return }
    if (!data.title.trim())      { setError('title',            'Title is required');            return }
    if (!data.type)              { setError('type',             'Type is required');             return }
    if (!data.status)            { setError('status',           'Status is required');           return }
    if (!data.priority)          { setError('priority',         'Priority is required');         return }
    if (!data.frequency)         { setError('frequency',        'Frequency is required');        return }
    if (!data.framework_id)      { setError('framework_id',     'Framework is required');        return }
    if (!data.compliance_level)  { setError('compliance_level', 'Compliance level is required'); return }

    post(route('requirements.store'), {
      forceFormData: true,
      onSuccess: () => reset(),
      onError:   (errs) => console.error('Validation errors:', errs),
    })
  }

  const steps = [
    { label: 'Basic info',      icon: ListTodo      },
    { label: 'Details',         icon: FileText       },
    { label: 'Documents',       icon: FileUp         },
    { label: 'Predefined Test', icon: ClipboardList  },
  ]

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Requirements', href: route('requirements.index') },
        { title: 'Create',       href: '' },
      ]}
    >
      <Head title="Create Requirement" />

      <div className="space-y-6 p-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Requirement</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fill in the sections below to register a compliance requirement.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href={route('requirements.index')}>
              <ChevronLeft className="mr-1.5 h-4 w-4" />Back
            </Link>
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

          {/* ── SECTION 1 — Basic Information ── */}
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

              {/* Code + Title */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-sm">Code <span className="text-destructive">*</span></Label>
                  <Input
                    id="code" placeholder="REQ-001"
                    value={data.code}
                    onChange={(e) => { setData('code', e.target.value.toUpperCase().trim()); clearErrors('code') }}
                    className={cn('font-mono', errors.code && 'border-destructive')}
                  />
                  {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-sm">Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="title" placeholder="Data Protection Impact Assessment"
                    value={data.title}
                    onChange={(e) => { setData('title', e.target.value); clearErrors('title') }}
                    className={cn(errors.title && 'border-destructive')}
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>
              </div>

              {/* Framework */}
              <div className="space-y-1.5">
                <Label className="text-sm">Framework <span className="text-destructive">*</span></Label>
                <Select value={data.framework_id} onValueChange={(v) => { setData('framework_id', v); clearErrors('framework_id') }}>
                  <SelectTrigger className={cn(errors.framework_id && 'border-destructive')}>
                    <SelectValue placeholder="Select a framework…" />
                  </SelectTrigger>
                  <SelectContent>
                    {frameworks.map((fw) => (
                      <SelectItem key={fw.id} value={fw.id.toString()}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{fw.code}</span>{fw.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.framework_id && <p className="text-xs text-destructive">{errors.framework_id}</p>}
              </div>

              {/* Processes — MultiSelect */}
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Processes (optional)</Label>
                <MultiSelect
                  options={processes.map((p) => ({
                    value: p.id.toString(),
                    label: p.code ? `${p.code} — ${p.name}` : p.name,
                  }))}
                  value={data.process_ids}
                  onValueChange={(selected) => setData('process_ids', selected)}
                  placeholder={
                    !data.framework_id
                      ? 'Select a framework first'
                      : loadingProcesses
                      ? 'Loading…'
                      : 'Select processes…'
                  }
                  disabled={!data.framework_id || loadingProcesses}
                />
              </div>

              <div className="border-t" />

              {/* Type + Status + Priority */}
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Type <span className="text-destructive">*</span></Label>
                  <Select value={data.type} onValueChange={(v) => { setData('type', v); clearErrors('type') }}>
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
                  <Select value={data.status} onValueChange={(v) => { setData('status', v); clearErrors('status') }}>
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
                  <Select value={data.priority} onValueChange={(v) => { setData('priority', v); clearErrors('priority') }}>
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

              {/* Frequency */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Frequency <span className="text-destructive">*</span></Label>
                  <Select value={data.frequency} onValueChange={(v) => { setData('frequency', v); clearErrors('frequency') }}>
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

              {/* Auto-validate */}
              <div className="flex items-start gap-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                <Switch
                  id="auto-validate"
                  checked={data.auto_validate}
                  onCheckedChange={(checked) => setData('auto_validate', checked)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="auto-validate" className="text-sm font-medium cursor-pointer">Auto-validate tests</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Automatically accept tests created from predefined test templates.</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* ── SECTION 2 — Details & Context ── */}
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

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-sm">Description</Label>
                <Textarea
                  placeholder="Detailed explanation of the requirement, scope, applicability, responsibilities…"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="min-h-[130px] resize-y"
                />
              </div>

              {/* Compliance Level */}
              <div className="space-y-2">
                <Label className="text-sm">Compliance Level <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground mb-3">Choose the obligation strength of this requirement.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {COMPLIANCE_LEVELS.map((level) => {
                    const Icon    = level.icon
                    const colors  = LEVEL_COLORS[level.color]
                    const isSelected = data.compliance_level === level.value
                    return (
                      <button
                        key={level.value} type="button"
                        onClick={() => { setData('compliance_level', level.value); clearErrors('compliance_level') }}
                        className={cn(
                          'relative text-left rounded-xl border-2 p-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                          colors.border,
                          isSelected ? [colors.borderActive, colors.bg] : 'border-border bg-background hover:bg-muted/40'
                        )}
                      >
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

              {/* Effective Date */}
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />Effective Date
                </Label>
                <Button type="button" variant="outline" disabled className="w-full justify-start text-left font-normal cursor-not-allowed opacity-50">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(new Date(), 'PPP')}
                </Button>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3 w-3 shrink-0" />The effective date is automatically set to today's date.
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <TagIcon className="h-3.5 w-3.5" />Tags
                </Label>
                <MultiSelect
                  options={tags.map((tag) => ({ value: tag.id.toString(), label: tag.name }))}
                  value={data.tags}
                  onValueChange={(selected) => setData('tags', selected)}
                  placeholder="Select relevant tags…"
                />
              </div>

              {/* Attachments */}
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <FileUp className="h-3.5 w-3.5" />Attachments (URLs)
                </Label>
                <Textarea
                  placeholder={"One link per line\nhttps://drive.google.com/file/…"}
                  value={data.attachments}
                  onChange={(e) => setData('attachments', e.target.value)}
                  className="min-h-[90px] resize-y font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">Supported: Google Drive, SharePoint, OneDrive, and similar links.</p>
              </div>

            </CardContent>
          </Card>

          {/* ── SECTION 3 — Documents ── */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Documents</CardTitle>
                  <CardDescription className="text-xs">Attach files related to this requirement (optional, max 10 MB each)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <CardUpload
                maxFiles={10} maxSize={10 * 1024 * 1024} accept="*" multiple simulateUpload
                onFilesChange={handleFilesChange}
                labels={{
                  dropzone: 'Drag & drop files here, or click to select',
                  browse: 'Browse files', maxSize: 'Max file size: 10 MB',
                  filesCount: 'files uploaded', addFiles: 'Add more files', removeAll: 'Remove all',
                }}
              />
              {errors.documents && <p className="text-xs text-destructive mt-2">{errors.documents}</p>}
            </CardContent>
          </Card>

          {/* ── SECTION 4 — Predefined Test ── */}
          <Card className="border shadow-sm">
            <CardHeader
              className="pb-2 border-b cursor-pointer select-none"
              onClick={() => setShowPredefinedTest((prev) => !prev)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Predefined Test</CardTitle>
                    <CardDescription className="text-xs">
                      Define a standard test procedure for this requirement (optional)
                    </CardDescription>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    showPredefinedTest && 'rotate-180'
                  )}
                />
              </div>
            </CardHeader>

            {showPredefinedTest && (
              <CardContent className="pt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Test Code</Label>
                    <Input
                      placeholder="TC-001"
                      value={data.predefined_test.test_code}
                      onChange={(e) => setData('predefined_test', {
                        ...data.predefined_test,
                        test_code: e.target.value.toUpperCase().trim(),
                      })}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Test Name</Label>
                    <Input
                      placeholder="Data encryption verification"
                      value={data.predefined_test.test_name}
                      onChange={(e) => setData('predefined_test', {
                        ...data.predefined_test,
                        test_name: e.target.value,
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Objective</Label>
                  <Textarea
                    placeholder="What this test aims to verify or validate…"
                    value={data.predefined_test.objective}
                    onChange={(e) => setData('predefined_test', {
                      ...data.predefined_test,
                      objective: e.target.value,
                    })}
                    className="min-h-[100px] resize-y"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Procedure</Label>
                  <Textarea
                    placeholder="Step-by-step instructions to execute this test…"
                    value={data.predefined_test.procedure}
                    onChange={(e) => setData('predefined_test', {
                      ...data.predefined_test,
                      procedure: e.target.value,
                    })}
                    className="min-h-[130px] resize-y"
                  />
                </div>

             
              </CardContent>
            )}
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Fields marked <span className="text-destructive">*</span> are required.
            </p>
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
                    </svg>
                    Creating…
                  </span>
                ) : 'Create Requirement'}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </AppLayout>
  )
}