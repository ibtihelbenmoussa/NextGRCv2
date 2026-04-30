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
} from 'lucide-react'
import { format } from 'date-fns'

// ─────────────────────────────────────────────
// Types (identiques à Create.tsx)
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

interface Assessment {
  id: number
  code: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  framework_id: number
  selected_requirement_ids: number[]
}

interface Props {
  assessment: Assessment
  framework: Framework
  existingCount?: number
}

// ─────────────────────────────────────────────
// Step Bar (strictement identique)
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
            <div
              className={cn(
                'flex-1 h-px mx-4',
                current > s.n ? 'bg-green-400' : 'bg-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 1: Basic Info (pré‑remplie)
// ─────────────────────────────────────────────

function StepBasic({
  initialFramework,
  initialForm,
  onNext,
}: {
  initialFramework: Framework | null
  initialForm: {
    code: string
    name: string
    description: string
    start_date: string
    end_date: string
  }
  onNext: (data: any) => void
}) {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(initialFramework)
  const [form, setForm] = useState(initialForm)
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
    setErrors(prev => ({ ...prev, framework: undefined }))
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
              className="font-mono h-11"
              placeholder="Assessment code"
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
                  onSelect={(date) => {
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
                  onSelect={(date) => {
                    if (date) setForm({ ...form, end_date: format(date, 'yyyy-MM-dd') })
                    setEndDateOpen(false)
                  }}
                  disabled={(date) => (form.start_date ? date < new Date(form.start_date) : false)}
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
// Step 2: Requirements Selection (identique à Create)
// ─────────────────────────────────────────────

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

  const toggleAll = () => {
    if (selected.length === framework.requirements.length) {
      setSelected([])
    } else {
      setSelected(framework.requirements.map(r => r.id))
    }
  }

  const filtered = framework.requirements.filter(r =>
    !search ||
    r.code.toLowerCase().includes(search.toLowerCase()) ||
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  const allSelected = selected.length === framework.requirements.length

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2.5">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Select Requirements</CardTitle>
            <CardDescription>
              <Badge variant="secondary" className="mr-2">{framework.code}</Badge>
              {framework.name}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search requirements..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button variant="outline" onClick={toggleAll} className="h-10">
            {allSelected ? 'Deselect all' : 'Select all'}
          </Button>
        </div>
        {selected.length > 0 && (
          <div className="flex justify-end mt-2">
            <Badge variant="default" className="bg-green-600">
              {selected.length} selected
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No requirements match your search</p>
        ) : (
          filtered.map(r => (
            <div
              key={r.id}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                selected.includes(r.id)
                  ? 'bg-green-50 border-green-300'
                  : 'hover:bg-muted/50 border-border'
              )}
              onClick={() => toggle(r.id)}
            >
              <Checkbox
                checked={selected.includes(r.id)}
                onCheckedChange={() => toggle(r.id)}
                className="mt-1 w-5 h-5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{r.code}</p>
                <p className="text-base font-medium mt-1">{r.title}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {r.questions?.length ?? r.questions_count ?? 0} question{(r.questions?.length ?? r.questions_count ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))
        )}

        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <Button variant="outline" size="lg" onClick={onBack}>
            <ChevronLeft size={18} className="mr-2" /> Back
          </Button>
          <Button size="lg" disabled={selected.length === 0} onClick={() => onNext(selected)}>
            Review ({selected.length} selected) <ChevronRight size={18} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// Step 3: Review & Update (PUT au lieu de POST)
// ─────────────────────────────────────────────

function StepReview({
  framework,
  selectedReqIds,
  formData,
  assessmentId,
  onBack,
}: {
  framework: Framework
  selectedReqIds: number[]
  formData: any
  assessmentId: number
  onBack: () => void
}) {
  const [loading, setLoading] = useState(false)
  const reqs = framework.requirements.filter(r => selectedReqIds.includes(r.id))
  const totalQuestions = reqs.reduce((acc, r) => acc + (r.questions?.length ?? 0), 0)

  const handleSubmit = () => {
    setLoading(true)
    router.put(`/gap-assessments/${assessmentId}`, {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      start_date: formData.start_date,
      end_date: formData.end_date,
      framework_id: framework.id,
      requirement_ids: selectedReqIds,
    }, {
      onFinish: () => setLoading(false),
    })
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
              <CardDescription>Review changes before saving</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Code</p>
              <p className="text-base font-mono font-semibold">{formData.code}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="text-base font-semibold">{formData.name}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Framework</p>
              <p className="text-base font-semibold">{framework.code} — {framework.name}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Period</p>
              <p className="text-base font-semibold">
                {formData.start_date || '—'} {formData.end_date ? `→ ${formData.end_date}` : ''}
              </p>
            </div>
          </div>
          {formData.description && (
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-base">{formData.description}</p>
            </div>
          )}
          <div className="flex gap-5">
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-blue-700">{reqs.length}</p>
              <p className="text-base text-blue-600 mt-1">Requirements</p>
            </div>
            <div className="flex-1 bg-purple-50 border border-purple-200 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-purple-700">{totalQuestions}</p>
              <p className="text-base text-purple-600 mt-1">Questions to answer</p>
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

      <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-base text-amber-800">
        <span className="text-xl leading-none mt-0.5">💡</span>
        <p>
          After updating, you can continue answering questions from the assessment page.
        </p>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" size="lg" onClick={onBack}>
          <ChevronLeft size={18} className="mr-2" /> Back
        </Button>
        <Button size="lg" onClick={handleSubmit} disabled={loading} className="gap-2 min-w-[160px]">
          <Save size={18} />
          {loading ? 'Updating...' : 'Update Assessment'}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Edit Page
// ─────────────────────────────────────────────

export default function EditGapAssessment({ assessment, framework }: Props) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    code: assessment.code,
    name: assessment.name,
    description: assessment.description ?? '',
    start_date: assessment.start_date ?? '',
    end_date: assessment.end_date ?? '',
  })
  const [selectedReqs, setSelectedReqs] = useState<number[]>(assessment.selected_requirement_ids)

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Gap Assessments', href: '/gap-assessment' },
        { title: 'Edit', href: '' },
      ]}
    >
      <Head title={`Edit ${assessment.name}`} />

      <div className="space-y-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Gap Assessment</h1>
            <p className="text-muted-foreground mt-1.5">
              Update assessment information or change selected requirements.
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
            initialFramework={framework}
            initialForm={formData}
            onNext={data => {
              setFormData(data)
              setStep(2)
            }}
          />
        )}

        {step === 2 && (
          <StepRequirements
            framework={framework}
            initialSelected={selectedReqs}
            onBack={() => setStep(1)}
            onNext={ids => {
              setSelectedReqs(ids)
              setStep(3)
            }}
          />
        )}

        {step === 3 && (
          <StepReview
            framework={framework}
            selectedReqIds={selectedReqs}
            formData={formData}
            assessmentId={assessment.id}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </AppLayout>
  )
}