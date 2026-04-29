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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
  Scale,
  Building2,
  Handshake,
  Zap,
  FileEdit,
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { MultiSelect } from '@/components/ui/multi-select'
import { CardUpload, type FileUploadItem } from '@/components/card-upload'

interface Framework { id: number; code: string; name: string; effective_date?: string | null }
interface Process { id: number; name: string; code?: string }
interface Tag { id: number; name: string }

const PINK_CARD = 'border-border shadow-sm'

function InfoTooltip({
  icon: Icon,
  title,
  badge,
  badgeColor,
  description,
  hint,
}: {
  icon: React.ElementType
  title: string
  badge: string
  badgeColor: 'blue' | 'amber' | 'teal' | 'green' | 'rose' | 'slate'
  description: string
  hint?: string
}) {
  const colorMap = {
    blue: { bar: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 ring-blue-500/20', icon: 'text-blue-400' },
    amber: { bar: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/20', icon: 'text-amber-400' },
    teal: { bar: 'bg-teal-500', badge: 'bg-teal-500/10 text-teal-400 ring-teal-500/20', icon: 'text-teal-400' },
    green: { bar: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20', icon: 'text-emerald-400' },
    rose: { bar: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 ring-rose-500/20', icon: 'text-rose-400' },
    slate: { bar: 'bg-slate-500', badge: 'bg-slate-500/10 text-slate-400 ring-slate-500/20', icon: 'text-slate-400' },
  }
  const c = colorMap[badgeColor]

  return (
    <div className="relative flex overflow-hidden rounded-xl border border-border/40 bg-background shadow-xl w-[240px]">
      <div className={cn('w-1 shrink-0', c.bar)} />
      <div className="flex flex-col gap-2 px-3 py-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4 shrink-0', c.icon)} />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <span className={cn('self-start text-[10px] font-medium px-2 py-0.5 rounded-full ring-1', c.badge)}>
          {badge}
        </span>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        {hint && (
          <p className="text-[10px] text-muted-foreground/60 border-t border-border/30 pt-1.5 mt-0.5">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}

type OptionDef = {
  value: string
  label: string
  icon: React.ElementType
  badge: string
  badgeColor: 'blue' | 'amber' | 'teal' | 'green' | 'rose' | 'slate'
  description: string
  hint?: string
}

function SelectWithTooltips({
  options,
  value,
  onValueChange,
  hasError,
  placeholder = 'Select…',
}: {
  options: OptionDef[]
  value: string
  onValueChange: (v: string) => void
  hasError?: boolean
  placeholder?: string
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(hasError && 'border-destructive')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => {
            const Icon = opt.icon
            return (
              <Tooltip key={opt.value}>
                <TooltipTrigger asChild>
                  <SelectItem value={opt.value}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {opt.label}
                    </span>
                  </SelectItem>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="start"
                  sideOffset={10}
                  className="p-0 border-0 bg-transparent shadow-none"
                >
                  <InfoTooltip
                    icon={opt.icon}
                    title={opt.label}
                    badge={opt.badge}
                    badgeColor={opt.badgeColor}
                    description={opt.description}
                    hint={opt.hint}
                  />
                </TooltipContent>
              </Tooltip>
            )
          })}
        </SelectContent>
      </Select>
    </TooltipProvider>
  )
}

const TYPE_OPTIONS: OptionDef[] = [
  {
    value: 'regulatory',
    label: 'Regulatory',
    icon: Scale,
    badge: 'External obligation',
    badgeColor: 'blue',
    description: 'Imposed by a law or binding authority (GDPR, ISO 27001, SOX…). Non-compliance may trigger legal penalties.',
    hint: 'Ex: GDPR Art. 32 · SOX §404 · NIS2',
  },
  {
    value: 'internal',
    label: 'Internal',
    icon: Building2,
    badge: 'Self-imposed',
    badgeColor: 'amber',
    description: 'Defined by the organisation itself — policies or governance rules. No external authority mandates it.',
    hint: 'Ex: Information security policy · HR code of conduct',
  },
  {
    value: 'contractual',
    label: 'Contractual',
    icon: Handshake,
    badge: 'Agreement-based',
    badgeColor: 'teal',
    description: 'Arising from a signed contract or SLA with a client, partner, or vendor. Breach may trigger financial consequences.',
    hint: 'Ex: SLA uptime clause · DPA with data processors',
  },
]

const STATUS_OPTIONS: OptionDef[] = [
  {
    value: 'active',
    label: 'Active',
    icon: Zap,
    badge: 'In force',
    badgeColor: 'green',
    description: 'The requirement is currently enforced and must be complied with. Tests and validations are expected.',
    hint: 'Visible in dashboards and compliance tracking.',
  },
  {
    value: 'draft',
    label: 'Draft',
    icon: FileEdit,
    badge: 'Work in progress',
    badgeColor: 'amber',
    description: 'The requirement is being defined and is not yet enforced. No tests will be generated until activated.',
    hint: 'Use for requirements pending review or approval.',
  },
  {
    value: 'archived',
    label: 'Archived',
    icon: Archive,
    badge: 'Inactive',
    badgeColor: 'slate',
    description: 'The requirement has been retired or superseded. Preserved for historical audit purposes only.',
    hint: 'Archived requirements are hidden from active views.',
  },
]

const PRIORITY_OPTIONS: OptionDef[] = [
  {
    value: 'low',
    label: 'Low',
    icon: ArrowDown,
    badge: 'Minor impact',
    badgeColor: 'teal',
    description: 'Failure to comply has limited impact on operations or reputation. Can be addressed in regular review cycles.',
    hint: 'Typically monitored quarterly or yearly.',
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: ArrowRight,
    badge: 'Moderate impact',
    badgeColor: 'amber',
    description: 'Non-compliance may cause operational disruption or audit findings. Should be addressed within the current cycle.',
    hint: 'Escalate if unresolved after two review cycles.',
  },
  {
    value: 'high',
    label: 'High',
    icon: ArrowUp,
    badge: 'Critical',
    badgeColor: 'rose',
    description: 'Immediate risk to compliance posture, legal standing, or business continuity. Requires urgent attention.',
    hint: 'Triggers alerts and is flagged in executive reports.',
  },
]

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
  },
  amber: {
    border: 'border-amber-200 dark:border-amber-800',
    borderActive: 'border-amber-500 dark:border-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  teal: {
    border: 'border-teal-200 dark:border-teal-800',
    borderActive: 'border-teal-500 dark:border-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950',
    icon: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-900',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  },
}

export default function CreateRequirement() {
  const { props } = usePage<any>()
  const frameworks: Framework[] = props.frameworks ?? []
  const tags: Tag[] = props.tags ?? []

  const today = new Date().toISOString().split('T')[0]

  const { data, setData, post, processing, errors, clearErrors, reset, setError } = useForm({
    code: '',
    title: '',
    description: '',
    type: '',
    status: '',
    priority: '',
    frequency: '',
    framework_id: '',
    process_ids: [] as string[],
    tags: [] as string[],
    effective_date: today,
    completion_date: '',
    compliance_level: '',
    attachments: '',
    auto_validate: false,
    documents: [] as File[],
    document_categories: [] as (string | null)[],
    document_descriptions: [] as (string | null)[],
    predefined_test: {
      test_name: '',
      objective: '',
      procedure: '',
    },
    gap_questions: [] as { text: string }[],

  })

  const [processes, setProcesses] = useState<Process[]>([])
  const [loadingProcesses, setLoadingProcesses] = useState(false)
  const [showPredefinedTest, setShowPredefinedTest] = useState(false)
  const [effectiveDateOpen, setEffectiveDateOpen] = useState(false)

  const [gapQuestions, setGapQuestions] = useState<{
    text: string

  }[]>([])

  // Helper : framework actuellement sélectionné
  const selectedFw = frameworks.find(fw => fw.id.toString() === data.framework_id) ?? null
  const fwEffectiveDate = selectedFw?.effective_date?.trim()
    ? selectedFw.effective_date.trim().substring(0, 10)
    : null
  const hasInheritedDate = !!fwEffectiveDate

  const handleFilesChange = (files: FileUploadItem[]) => {
    setData({
      ...data,
      documents: files.map((f) => f.file),
      document_categories: files.map(() => null),
      document_descriptions: files.map(() => null),
    })
  }

  useEffect(() => {
    if (!data.framework_id) {
      setProcesses([])
      setData(prev => ({ ...prev, process_ids: [], effective_date: today }))
      return
    }

    // Récupérer la date effective du framework sélectionné
    const fw = frameworks.find(fw => fw.id.toString() === data.framework_id)
    // Extraire uniquement YYYY-MM-DD (Laravel peut renvoyer "2026-04-30 00:00:00")
    const rawDate = fw?.effective_date?.trim() || null
    const inheritedDate = rawDate ? rawDate.substring(0, 10) : null

    // Pré-remplir effective_date avec celle du framework (ou aujourd'hui)
    setData(prev => ({
      ...prev,
      effective_date: inheritedDate ?? today,
    }))

    // Charger les processus liés au framework
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
          setData(prev => ({ ...prev, process_ids: [] }))
        },
        onFinish: () => setLoadingProcesses(false),
      }
    )
  }, [data.framework_id])
  const addGapQuestion = () => {
    setGapQuestions(prev => [...prev, { text: '' }])
  }

  const removeGapQuestion = (index: number) => {
    setGapQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const updateGapQuestion = (index: number, value: string) => {
    setGapQuestions(prev => prev.map((q, i) => i === index ? { ...q, text: value } : q))
  }
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  if (!data.code.trim()) { setError('code', 'Code is required'); return }
  if (!data.title.trim()) { setError('title', 'Title is required'); return }
  if (!data.type) { setError('type', 'Type is required'); return }
  if (!data.status) { setError('status', 'Status is required'); return }
  if (!data.priority) { setError('priority', 'Priority is required'); return }
  if (!data.frequency) { setError('frequency', 'Frequency is required'); return }
  if (!data.framework_id) { setError('framework_id', 'Framework is required'); return }
  if (!data.compliance_level) { setError('compliance_level', 'Compliance level is required'); return }

  if (fwEffectiveDate && data.effective_date < fwEffectiveDate) {
    setError('effective_date', `Date must be on or after the framework effective date (${fwEffectiveDate})`)
    return
  }

  const formData = new FormData()

  formData.append('code', data.code)
  formData.append('title', data.title)
  formData.append('description', data.description ?? '')
  formData.append('type', data.type)
  formData.append('status', data.status)
  formData.append('priority', data.priority)
  formData.append('frequency', data.frequency)
  formData.append('framework_id', data.framework_id)
  formData.append('effective_date', data.effective_date ?? '')
  formData.append('completion_date', data.completion_date ?? '')
  formData.append('compliance_level', data.compliance_level)
  formData.append('attachments', data.attachments ?? '')
  formData.append('auto_validate', data.auto_validate ? '1' : '0')

  data.tags.forEach(t => formData.append('tags[]', t))

  data.process_ids.forEach(p => formData.append('process_ids[]', p))

  formData.append('predefined_test[test_name]', data.predefined_test.test_name ?? '')
  formData.append('predefined_test[objective]', data.predefined_test.objective ?? '')
  formData.append('predefined_test[procedure]', data.predefined_test.procedure ?? '')

  // Documents
  data.documents.forEach(file => formData.append('documents[]', file))

  formData.append('gap_questions', JSON.stringify(gapQuestions))

  router.post(route('requirements.store'), formData, {
    onSuccess: () => reset(),
    onError: (errs) => console.error('Validation errors:', errs),
  })
}

  const steps = [
    { label: 'Basic info', icon: ListTodo },
    { label: 'Details', icon: FileText },
    { label: 'Documents', icon: FileUp },
    { label: 'Predefined Test', icon: ClipboardList },
  ]

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Requirements', href: route('requirements.index') },
        { title: 'Create', href: '' },
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
          <Card className={PINK_CARD}>
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

              {/* Processes */}
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
                  <SelectWithTooltips
                    options={TYPE_OPTIONS}
                    value={data.type}
                    onValueChange={(v) => { setData('type', v); clearErrors('type') }}
                    hasError={!!errors.type}
                  />
                  {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Status <span className="text-destructive">*</span></Label>
                  <SelectWithTooltips
                    options={STATUS_OPTIONS}
                    value={data.status}
                    onValueChange={(v) => { setData('status', v); clearErrors('status') }}
                    hasError={!!errors.status}
                  />
                  {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Priority <span className="text-destructive">*</span></Label>
                  <SelectWithTooltips
                    options={PRIORITY_OPTIONS}
                    value={data.priority}
                    onValueChange={(v) => { setData('priority', v); clearErrors('priority') }}
                    hasError={!!errors.priority}
                  />
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
          <Card className={PINK_CARD}>
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
                    const Icon = level.icon
                    const colors = LEVEL_COLORS[level.color]
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

              {/* Effective Date — Popover Calendar */}
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Effective Date
                </Label>

                <Popover open={effectiveDateOpen} onOpenChange={setEffectiveDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-10',
                        !data.effective_date && 'text-muted-foreground',
                        errors.effective_date && 'border-destructive',
                        hasInheritedDate && 'border-primary/40 bg-primary/5'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {data.effective_date
                        ? format(new Date(data.effective_date), 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data.effective_date ? new Date(data.effective_date) : undefined}
                      onSelect={(date) => {
                        setData('effective_date', date ? format(date, 'yyyy-MM-dd') : '')
                        clearErrors('effective_date')
                        setEffectiveDateOpen(false)
                      }}
                      disabled={(date) =>
                        fwEffectiveDate
                          ? date < new Date(fwEffectiveDate)
                          : date < new Date(today)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {errors.effective_date && (
                  <p className="text-xs text-destructive">{errors.effective_date}</p>
                )}

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3 w-3 shrink-0" />
                  {hasInheritedDate
                    ? <>Pre-filled from framework <span className="font-semibold text-foreground">{selectedFw?.code}</span>. You can pick a later date.</>
                    : data.framework_id
                      ? 'This framework has no effective date — using today as minimum.'
                      : "Will be pre-filled once a framework is selected."}
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
          <Card className={PINK_CARD}>
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
          <Card className={PINK_CARD}>
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
                <div className="space-y-1.5">
                  <Label className="text-sm">Test Name</Label>
                  <Input
                    placeholder="e.g. Access Control Verification"
                    value={data.predefined_test.test_name}
                    onChange={(e) =>
                      setData('predefined_test', {
                        ...data.predefined_test,
                        test_name: e.target.value,
                      })
                    }
                    className="h-11"
                  />
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
          {/* ── SECTION 5 — Gap Questions ── */}
          <Card className={PINK_CARD}>
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
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Click "Add Question" to define gap assessment questions
                  </p>
                </div>
              ) : (
                gapQuestions.map((q, index) => (
                  <div key={index} className="relative rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Question {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeGapQuestion(index)}
                      >
                        ✕
                      </Button>
                    </div>
                    <Textarea
                      placeholder="e.g. Are access controls formally documented and reviewed?"
                      value={q.text}
                      onChange={(e) => updateGapQuestion(index, e.target.value)}
                      className="min-h-[80px] resize-y"
                    />
                  </div>
                ))
              )}
            </CardContent>
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