import { useEffect, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { CheckCircle2, ChevronLeft, ChevronRight, Save, Search } from 'lucide-react'

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
    <div className="flex items-center mb-8 gap-0">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'unset' }}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium transition-all',
                current === s.n
                  ? 'bg-foreground text-background border-foreground'
                  : current > s.n
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : 'border-border text-muted-foreground'
              )}
            >
              {current > s.n ? <CheckCircle2 size={14} className="text-green-600" /> : s.n}
            </div>
            <span
              className={cn(
                'text-xs',
                current === s.n ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                'flex-1 h-px mx-3',
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
// Step 1: Basic Info + Framework selection
// ─────────────────────────────────────────────

function StepBasic({
  onNext,
  existingCount,
}: {
  onNext: (data: any) => void
  existingCount: number
}) {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  })

  useEffect(() => {
    axios.get('/gap-assessment/frameworks').then(res => {
      setFrameworks(res.data.frameworks)
    })
  }, [])

  // Auto-generate code when framework is selected
  const handleFrameworkChange = (frameworkId: string) => {
    const fw = frameworks.find(f => f.id === Number(frameworkId))
    setSelectedFramework(fw ?? null)
    if (fw) {
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()
      const n = existingCount + 1
      const autoCode = `GA${n}-${fw.code}-${dd}${mm}${yyyy}`
      setForm(prev => ({ ...prev, code: autoCode }))
    }
  }

  const canContinue = !!selectedFramework && form.name.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">New Gap Assessment</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Select a framework first — the code will be generated automatically
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">

        {/* Framework selection — first */}
        <div className="space-y-1.5">
          <Label>Framework <span className="text-destructive">*</span></Label>
          <select
            className="w-full border rounded-md p-2 bg-background text-sm"
            value={selectedFramework?.id ?? ''}
            onChange={e => handleFrameworkChange(e.target.value)}
          >
            <option value="">Select a compliance framework</option>
            {frameworks.map(f => (
              <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
            ))}
          </select>
        </div>

        {/* Auto-generated code */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>
              Code
              {selectedFramework && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">(auto-generated)</span>
              )}
            </Label>
            <Input
              placeholder="Select a framework to generate"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              className={cn(selectedFramework && 'bg-muted/40 font-mono text-sm')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Annual ISO Review"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe the purpose and scope of this assessment…"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Date</Label>
            <Input
              type="date"
              value={form.end_date}
              min={form.start_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button
            disabled={!canContinue}
            onClick={() => onNext({ ...form, framework: selectedFramework })}
          >
            Continue <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// Step 2: Select Requirements
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Select Requirements</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-xs font-medium mr-2">
                {framework.code}
              </span>
              {framework.name}
            </p>
          </div>
          {selected.length > 0 && (
            <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-2 py-1 rounded-full">
              {selected.length} selected
            </span>
          )}
        </div>

        {/* Search + Select all */}
        <div className="flex items-center gap-3 mt-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search requirements..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" onClick={toggleAll} className="shrink-0 text-xs">
            {allSelected ? 'Deselect all' : 'Select all'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No requirements match your search</p>
        ) : (
          filtered.map(r => (
            <div
              key={r.id}
              onClick={() => toggle(r.id)}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                selected.includes(r.id)
                  ? 'bg-green-50 border-green-300'
                  : 'hover:bg-muted/50 border-border'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  selected.includes(r.id)
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-muted-foreground/30'
                )}
              >
                {selected.includes(r.id) && <CheckCircle2 size={12} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{r.code}</p>
                <p className="text-sm font-medium mt-0.5">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {r.questions?.length ?? r.questions_count ?? 0} question{(r.questions?.length ?? r.questions_count ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))
        )}

        <div className="flex items-center justify-between pt-3 border-t mt-4">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" /> Back
          </Button>
          <Button disabled={selected.length === 0} onClick={() => onNext(selected)}>
            Review ({selected.length} selected) <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// Step 3: Review & Save
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
    }, {
      onFinish: () => setLoading(false),
    })
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Code</p>
              <p className="text-sm font-mono font-semibold">{formData.code}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="text-sm font-semibold">{formData.name}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Framework</p>
              <p className="text-sm font-semibold">{framework.code} — {framework.name}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Period</p>
              <p className="text-sm font-semibold">
                {formData.start_date || '—'} {formData.end_date ? `→ ${formData.end_date}` : ''}
              </p>
            </div>
          </div>

          {formData.description && (
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{formData.description}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-3">
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{reqs.length}</p>
              <p className="text-xs text-blue-600 mt-0.5">Requirements</p>
            </div>
            <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{totalQuestions}</p>
              <p className="text-xs text-purple-600 mt-0.5">Questions to answer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selected Requirements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {reqs.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {r.code}
                </span>
                <span className="text-sm flex-1">{r.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {r.questions?.length ?? 0}Q
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info callout */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <span className="text-lg leading-none mt-0.5">💡</span>
        <p>
          After saving, you can answer all questions from the assessment page using the <strong>Answer Questions</strong> button.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" /> Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="gap-2">
          <Save size={15} />
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
  existingCount?: number
}

export default function CreateGapAssessment({ existingCount = 0 }: Props) {
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

      <div className="w-full max-w-3xl mx-auto px-6 py-6 space-y-6">
        <StepBar current={step} />

        {step === 1 && (
          <StepBasic
            existingCount={existingCount}
            onNext={data => {
              setFormData(data)
              setStep(2)
            }}
          />
        )}

        {step === 2 && formData?.framework && (
          <StepRequirements
            framework={formData.framework}
            initialSelected={selectedReqs}
            onBack={() => setStep(1)}
            onNext={ids => {
              setSelectedReqs(ids)
              setStep(3)
            }}
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