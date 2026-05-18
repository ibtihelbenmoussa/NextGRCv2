import { useEffect, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import axios from 'axios'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save,
  Search,
  CalendarIcon,
  Building2,
  FileText,
  Layers,
  HelpCircle,
  Check,
  X,
  ListChecks,
} from 'lucide-react'
import { format } from 'date-fns'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Question {
  id: number
  text: string
}

interface Requirement {
  id: number
  code: string
  title: string
  questions: Question[]
  questions_count?: number
}

interface Framework {
  id: number
  code: string
  name: string
  requirements: Requirement[]
}

// ─────────────────────────────────────────────
// Step Bar
// ─────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Basic info' },
  { n: 2, label: 'Requirements' },
  { n: 3, label: 'Review & Save' },
]

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8 gap-2">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'unset' }}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-9 h-9 rounded-full border-2 flex items-center justify-center text-base font-semibold transition-all',
                current === s.n
                  ? 'bg-primary text-primary-foreground border-primary'
                  : current > s.n
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : 'border-border text-muted-foreground'
              )}
            >
              {current > s.n ? <CheckCircle2 size={18} className="text-green-600" /> : s.n}
            </div>
            <span
              className={cn(
                'text-base font-medium',
                current === s.n ? 'text-foreground font-semibold' : 'text-muted-foreground'
              )}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('flex-1 h-px mx-4', current > s.n ? 'bg-green-400' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 1 — Basic Info
// ─────────────────────────────────────────────

function StepBasic({
  onNext,
  frameworkCounts,
}: {
  onNext: (data: any) => void
  frameworkCounts: Record<number, number>
}) {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  })
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [errors, setErrors] = useState<{ framework?: string; name?: string }>({})

  useEffect(() => {
    axios.get('/gap-assessment/frameworks').then(res => {
      setFrameworks(res.data.frameworks)
    })
  }, [])

  const handleFrameworkChange = (frameworkId: string) => {
    const fw = frameworks.find(f => f.id === Number(frameworkId))
    setSelectedFramework(fw ?? null)
    if (fw) {
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()
      const n = (frameworkCounts[fw.id] ?? 0) + 1
      const autoCode = `GA${n}-${fw.code}-${dd}/${mm}/${yyyy}`
      setForm(prev => ({ ...prev, code: autoCode }))
      setErrors(prev => ({ ...prev, framework: undefined }))
    }
  }

  const validate = () => {
    const errs: typeof errors = {}
    if (!selectedFramework) errs.framework = 'Please select a framework'
    if (!form.name.trim()) errs.name = 'Assessment name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleContinue = () => {
    if (!validate()) return
    onNext({ ...form, framework: selectedFramework })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2.5">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Framework & Assessment Details</CardTitle>
            <CardDescription>Select a framework and provide assessment information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-2">
        <div className="space-y-2">
          <Label>Framework <span className="text-destructive">*</span></Label>
          <Select
            value={selectedFramework?.id?.toString() ?? ''}
            onValueChange={handleFrameworkChange}
          >
            <SelectTrigger className={cn('h-11', errors.framework && 'border-destructive')}>
              <SelectValue placeholder="Select a compliance framework" />
            </SelectTrigger>
            <SelectContent>
              {frameworks.map(f => (
                <SelectItem key={f.id} value={f.id.toString()}>
                  {f.code} — {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.framework && <p className="text-sm text-destructive">{errors.framework}</p>}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              className="bg-muted/40 font-mono h-11"
              readOnly={!!selectedFramework}
              placeholder="Select a framework first"
            />
          </div>
          <div className="space-y-2">
            <Label>Assessment Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={cn('h-11', errors.name && 'border-destructive')}
              placeholder="e.g. Q4 ISO 27001 Review"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Purpose, scope, notes about this assessment..."
            className="min-h-[120px] resize-y"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal h-11">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.start_date ? format(new Date(form.start_date), 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.start_date ? new Date(form.start_date) : undefined}
                  onSelect={date => {
                    if (date) setForm({ ...form, start_date: format(date, 'yyyy-MM-dd') })
                    setStartDateOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>End Date (optional)</Label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal h-11">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.end_date ? format(new Date(form.end_date), 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.end_date ? new Date(form.end_date) : undefined}
                  onSelect={date => {
                    if (date) setForm({ ...form, end_date: format(date, 'yyyy-MM-dd') })
                    setEndDateOpen(false)
                  }}
                  disabled={date => (form.start_date ? date < new Date(form.start_date) : false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button size="lg" onClick={handleContinue}>
            Continue <ChevronRight size={18} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// Step 2 — Requirements (redesigned)
// ─────────────────────────────────────────────

function RequirementRow({
  req,
  selected,
  onToggle,
  index,
}: {
  req: Requirement
  selected: boolean
  onToggle: () => void
  index: number
}) {
  const qCount = req.questions?.length ?? req.questions_count ?? 0

  return (
    <div
      onClick={onToggle}
      className={cn(
        'group relative flex items-center gap-4 px-4 py-3 rounded-lg border cursor-pointer transition-all duration-150',
        'hover:shadow-sm',
        selected
          ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
          : 'border-border bg-card hover:border-border/80 hover:bg-muted/30',
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150',
          selected
            ? 'bg-primary border-primary'
            : 'border-muted-foreground/30 group-hover:border-muted-foreground/60',
        )}
      >
        {selected && <Check size={11} className="text-primary-foreground" strokeWidth={3} />}
      </div>

      {/* Code badge */}
      <span
        className={cn(
          'flex-shrink-0 text-xs font-mono font-bold px-2 py-1 rounded-md tracking-wide transition-colors',
          selected
            ? 'bg-primary/15 text-primary dark:bg-primary/25'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {req.code}
      </span>

      {/* Title */}
      <span
        className={cn(
          'flex-1 text-sm font-medium leading-snug min-w-0 truncate transition-colors',
          selected ? 'text-foreground' : 'text-foreground/80',
        )}
      >
        {req.title}
      </span>

      {/* Questions count */}
      <span
        className={cn(
          'flex-shrink-0 flex items-center gap-1 text-xs font-mono transition-colors',
          selected ? 'text-primary/70' : 'text-muted-foreground',
        )}
      >
        <HelpCircle size={11} />
        {qCount}Q
      </span>
    </div>
  )
}

function StepRequirements({
  framework,
  initialSelected,
  onNext,
  onBack,
}: {
  framework: Framework
  initialSelected: number[]
  onNext: (ids: number[]) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState<number[]>(initialSelected)
  const [search, setSearch] = useState('')

  const toggle = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const allIds = framework.requirements.map(r => r.id)
  const allSelected = selected.length === allIds.length && allIds.length > 0
  const someSelected = selected.length > 0 && !allSelected

  const toggleAll = () => setSelected(allSelected ? [] : allIds)

  const filtered = framework.requirements.filter(r =>
    !search ||
    r.code.toLowerCase().includes(search.toLowerCase()) ||
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  const totalSelectedQuestions = framework.requirements
    .filter(r => selected.includes(r.id))
    .reduce((acc, r) => acc + (r.questions?.length ?? r.questions_count ?? 0), 0)

  return (
    <div className="space-y-4">

      {/* Header card */}
      <Card className="shadow-sm">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0 mt-0.5">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold">Select Requirements</h2>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                  {framework.code}
                </span>
                <span className="text-sm text-muted-foreground truncate">{framework.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {framework.requirements.length} requirement{framework.requirements.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection stats bar */}
      <div className="flex items-center gap-3 px-1">
        {/* Select all toggle */}
        <button
          onClick={toggleAll}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
            allSelected
              ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/15'
              : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground',
          )}
        >
          <div
            className={cn(
              'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
              allSelected ? 'bg-primary border-primary' : someSelected ? 'border-primary bg-primary/20' : 'border-muted-foreground/40',
            )}
          >
            {allSelected && <Check size={9} className="text-primary-foreground" strokeWidth={3} />}
            {someSelected && <div className="w-1.5 h-0.5 bg-primary rounded-full" />}
          </div>
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>

        {/* Stats pills */}
        {selected.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <ListChecks size={12} />
              {selected.length} requirement{selected.length !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <HelpCircle size={12} />
              {totalSelectedQuestions} question{totalSelectedQuestions !== 1 ? 's' : ''}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No requirements selected</span>
        )}

        {/* Search */}
        <div className="relative ml-auto max-w-xs w-full">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requirements…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Requirements list */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">

        {/* List header */}
        <div className="grid grid-cols-[20px_80px_1fr_40px] gap-4 px-4 py-2 border-b border-border bg-muted/30">
          <div />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Code</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Title</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-right">Q.</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Search size={20} className="text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No requirements match</p>
              <button onClick={() => setSearch('')} className="mt-1.5 text-xs text-primary underline underline-offset-2">
                Clear search
              </button>
            </div>
          ) : filtered.map((req, idx) => {
            const qCount = req.questions?.length ?? req.questions_count ?? 0
            const isSelected = selected.includes(req.id)
            return (
              <div
                key={req.id}
                onClick={() => toggle(req.id)}
                className={cn(
                  'group grid grid-cols-[20px_80px_1fr_40px] gap-4 px-4 py-3 cursor-pointer transition-all duration-100',
                  isSelected
                    ? 'bg-primary/5 dark:bg-primary/10'
                    : 'hover:bg-muted/40',
                )}
              >
                {/* Checkbox */}
                <div className="flex items-center justify-center">
                  <div
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150',
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30 group-hover:border-muted-foreground/60',
                    )}
                  >
                    {isSelected && <Check size={9} className="text-primary-foreground" strokeWidth={3} />}
                  </div>
                </div>

                {/* Code */}
                <div className="flex items-center">
                  <span
                    className={cn(
                      'text-xs font-mono font-bold px-1.5 py-0.5 rounded tracking-wide transition-colors',
                      isSelected
                        ? 'bg-primary/15 text-primary dark:bg-primary/25'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {req.code}
                  </span>
                </div>

                {/* Title */}
                <div className="flex items-center min-w-0">
                  <span
                    className={cn(
                      'text-sm font-medium truncate transition-colors',
                      isSelected ? 'text-foreground' : 'text-foreground/80',
                    )}
                  >
                    {req.title}
                  </span>
                </div>

                {/* Question count */}
                <div className="flex items-center justify-end">
                  <span
                    className={cn(
                      'text-xs font-mono transition-colors',
                      isSelected ? 'text-primary/70' : 'text-muted-foreground',
                    )}
                  >
                    {qCount}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20">
            <span className="text-xs font-mono text-muted-foreground">
              {filtered.length} of {framework.requirements.length} shown
            </span>
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <X size={11} /> Clear selection
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="lg" onClick={onBack}>
          <ChevronLeft size={18} className="mr-2" /> Back
        </Button>
        <Button
          size="lg"
          disabled={selected.length === 0}
          onClick={() => onNext(selected)}
          className="gap-2 min-w-[200px]"
        >
          Review ({selected.length} selected)
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 3 — Review & Save
// ─────────────────────────────────────────────

function StepReview({
  framework,
  selectedReqIds,
  formData,
  onBack,
}: {
  framework: Framework
  selectedReqIds: number[]
  formData: any
  onBack: () => void
}) {
  const [loading, setLoading] = useState(false)
  const reqs = framework.requirements.filter(r => selectedReqIds.includes(r.id))
  const totalQuestions = reqs.reduce((acc, r) => acc + (r.questions?.length ?? 0), 0)

  const handleSubmit = () => {
    setLoading(true)
    router.post('/gap-assessments', {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      start_date: formData.start_date,
      end_date: formData.end_date,
      framework_id: framework.id,
      requirement_ids: selectedReqIds,
    }, { onFinish: () => setLoading(false) })
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2.5">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Assessment Summary</CardTitle>
              <CardDescription>Review before saving</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { label: 'Code', value: formData.code, mono: true },
              { label: 'Name', value: formData.name },
              { label: 'Framework', value: `${framework.code} — ${framework.name}` },
              { label: 'Period', value: `${formData.start_date || '—'}${formData.end_date ? ` → ${formData.end_date}` : ''}` },
            ].map(({ label, value, mono }) => (
              <div key={label} className="bg-muted/40 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                <p className={cn('text-base font-semibold', mono && 'font-mono')}>{value}</p>
              </div>
            ))}
          </div>
          {formData.description && (
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-base">{formData.description}</p>
            </div>
          )}
          <div className="flex gap-5">
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-5 text-center dark:bg-blue-950/30 dark:border-blue-800">
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{reqs.length}</p>
              <p className="text-base text-blue-600 dark:text-blue-400 mt-1">Requirements</p>
            </div>
            <div className="flex-1 bg-purple-50 border border-purple-200 rounded-xl p-5 text-center dark:bg-purple-950/30 dark:border-purple-800">
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{totalQuestions}</p>
              <p className="text-base text-purple-600 dark:text-purple-400 mt-1">Questions to answer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Selected Requirements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {reqs.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                <Badge variant="outline" className="shrink-0 font-mono text-sm px-3 py-1">{r.code}</Badge>
                <span className="text-base flex-1">{r.title}</span>
                <span className="text-sm text-muted-foreground shrink-0">
                  {r.questions?.length ?? 0} Q
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-base text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
        <span className="text-xl leading-none mt-0.5">💡</span>
        <p>
          After saving, you can answer all questions from the assessment page using the <strong>Answer Questions</strong> button.
        </p>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" size="lg" onClick={onBack}>
          <ChevronLeft size={18} className="mr-2" /> Back
        </Button>
        <Button size="lg" onClick={handleSubmit} disabled={loading} className="gap-2 min-w-[160px]">
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Assessment'}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

interface Props {
  frameworkCounts?: Record<number, number>
}

export default function CreateGapAssessment({ frameworkCounts = {} }: Props) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<any>(null)
  const [selectedReqs, setSelectedReqs] = useState<number[]>([])

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Gap Assessments', href: '/gap-assessment' },
        { title: 'Create', href: '' },
      ]}
    >
      <Head title="Create Gap Assessment" />

      <div className="space-y-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Gap Assessment</h1>
            <p className="text-muted-foreground mt-1.5">
              Evaluate compliance by answering questions from selected framework requirements.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/gap-assessment">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </a>
          </Button>
        </div>

        <StepBar current={step} />

        {step === 1 && (
          <StepBasic
            frameworkCounts={frameworkCounts}
            onNext={data => { setFormData(data); setStep(2) }}
          />
        )}

        {step === 2 && formData?.framework && (
          <StepRequirements
            framework={formData.framework}
            initialSelected={selectedReqs}
            onBack={() => setStep(1)}
            onNext={ids => { setSelectedReqs(ids); setStep(3) }}
          />
        )}

        {step === 3 && formData?.framework && (
          <StepReview
            framework={formData.framework}
            selectedReqIds={selectedReqs}
            formData={formData}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </AppLayout>
  )
}