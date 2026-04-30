import { useState, useMemo } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, ChevronLeft, Save, Clock, Loader2,
  ChevronDown, ChevronUp, History, Sparkles, AlertTriangle,
  CheckCheck, ArrowRight, Target, TrendingUp, BarChart3,
  Zap, Shield,
} from 'lucide-react'
import axios from 'axios'

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerValue = 0 | 1 | 2 | 3 | 4

interface HistoryEntry {
  id: number
  answer: AnswerValue
  note: string | null
  answered_at: string
  score: number
  maturity_level: number
}

interface Question {
  id: number
  text: string
  history: HistoryEntry[]
  current_answer: AnswerValue | null
  current_note: string | null
}

interface Requirement {
  id: number
  code: string
  title: string
  questions: Question[]
}

interface GapAssessment {
  id: number
  code: string
  name: string
  framework: { code: string; name: string } | null
}

interface Props {
  assessment: GapAssessment
  requirements: Requirement[]
}

interface MLResult {
  maturity_level: number
  confidence: number
  weighted_score: number
  probabilities: Record<string, number>
  source: 'ml_model' | 'rule_based'
  summary?: string
  current_issues?: string[]
  roadmap?: RoadmapStep[]
}

interface RoadmapStep {
  level: number
  icon: string
  label: string
  subtitle: string
  status: 'completed' | 'current' | 'todo'
  actions: string[]
  is_next: boolean
  is_current: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVEL_OPTIONS: {
  value: AnswerValue
  label: string
  sub: string
  activeBg: string
  activeBorder: string
  activeText: string
  hoverClass: string
  dot: string
}[] = [
    {
      value: 0, label: '0', sub: 'Initial',
      activeBg: 'bg-[#FCEBEB] dark:bg-[#501313]/60',
      activeBorder: 'border-[#E24B4A]',
      activeText: 'text-[#A32D2D] dark:text-[#F09595]',
      hoverClass: 'hover:bg-[#FCEBEB]/60 hover:border-[#E24B4A]/50 dark:hover:bg-[#501313]/30',
      dot: 'bg-[#E24B4A]',
    },
    {
      value: 1, label: '1', sub: 'Basic',
      activeBg: 'bg-[#FEF3E2] dark:bg-[#4A2800]/60',
      activeBorder: 'border-[#F97316]',
      activeText: 'text-[#9A3412] dark:text-[#FDC58A]',
      hoverClass: 'hover:bg-[#FEF3E2]/60 hover:border-[#F97316]/50 dark:hover:bg-[#4A2800]/30',
      dot: 'bg-[#F97316]',
    },
    {
      value: 2, label: '2', sub: 'Defined',
      activeBg: 'bg-[#FAEEDA] dark:bg-[#412402]/60',
      activeBorder: 'border-[#EF9F27]',
      activeText: 'text-[#854F0B] dark:text-[#FAC775]',
      hoverClass: 'hover:bg-[#FAEEDA]/60 hover:border-[#EF9F27]/50 dark:hover:bg-[#412402]/30',
      dot: 'bg-[#EF9F27]',
    },
    {
      value: 3, label: '3', sub: 'Managed',
      activeBg: 'bg-[#EAF3DE] dark:bg-[#27500A]/60',
      activeBorder: 'border-[#65A30D]',
      activeText: 'text-[#3B6D11] dark:text-[#C0DD97]',
      hoverClass: 'hover:bg-[#EAF3DE]/60 hover:border-[#65A30D]/50 dark:hover:bg-[#27500A]/30',
      dot: 'bg-[#65A30D]',
    },
    {
      value: 4, label: '4', sub: 'Optimized',
      activeBg: 'bg-[#E1F5EE] dark:bg-[#085041]/60',
      activeBorder: 'border-[#1D9E75]',
      activeText: 'text-[#0F6E56] dark:text-[#9FE1CB]',
      hoverClass: 'hover:bg-[#E1F5EE]/60 hover:border-[#1D9E75]/50 dark:hover:bg-[#085041]/30',
      dot: 'bg-[#1D9E75]',
    },
  ]

const maturityMeta = (level: number) => {
  const map: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Initial', color: 'text-[#A32D2D] dark:text-[#F09595]', bg: 'bg-[#FCEBEB] dark:bg-[#501313]' },
    2: { label: 'Basic', color: 'text-[#9A3412] dark:text-[#FDC58A]', bg: 'bg-[#FEF3E2] dark:bg-[#4A2800]' },
    3: { label: 'Defined', color: 'text-[#854F0B] dark:text-[#FAC775]', bg: 'bg-[#FAEEDA] dark:bg-[#412402]' },
    4: { label: 'Managed', color: 'text-[#3B6D11] dark:text-[#C0DD97]', bg: 'bg-[#EAF3DE] dark:bg-[#27500A]' },
    5: { label: 'Optimized', color: 'text-[#0F6E56] dark:text-[#9FE1CB]', bg: 'bg-[#E1F5EE] dark:bg-[#085041]' },
  }
  return map[level] ?? { label: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted' }
}

const scoreColor = (s: number) => s < 40 ? '#E24B4A' : s < 70 ? '#EF9F27' : '#1D9E75'

const answerDotColor: Record<AnswerValue, string> = {
  0: 'bg-[#E24B4A]', 1: 'bg-[#F97316]', 2: 'bg-[#EF9F27]',
  3: 'bg-[#65A30D]', 4: 'bg-[#1D9E75]',
}

const answerLabel: Record<AnswerValue, string> = {
  0: 'L1 Initial', 1: 'L2 Basic', 2: 'L3 Defined',
  3: 'L4 Managed', 4: 'L5 Optimized',
}

const answerBadgeCls: Record<AnswerValue, string> = {
  0: 'bg-[#FCEBEB] text-[#A32D2D] border-[#E24B4A]/40 dark:bg-[#501313] dark:text-[#F09595]',
  1: 'bg-[#FEF3E2] text-[#9A3412] border-[#F97316]/40 dark:bg-[#4A2800] dark:text-[#FDC58A]',
  2: 'bg-[#FAEEDA] text-[#854F0B] border-[#EF9F27]/40 dark:bg-[#412402] dark:text-[#FAC775]',
  3: 'bg-[#EAF3DE] text-[#3B6D11] border-[#65A30D]/40 dark:bg-[#27500A] dark:text-[#C0DD97]',
  4: 'bg-[#E1F5EE] text-[#0F6E56] border-[#1D9E75]/40 dark:bg-[#085041] dark:text-[#9FE1CB]',
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = scoreColor(score)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth="5" className="text-muted/40" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  )
}

// ─── Requirement Score Bar ────────────────────────────────────────────────────

function ReqScoreBar({
  req, answers,
}: {
  req: Requirement
  answers: Record<number, { answer: AnswerValue | null; note: string }>
}) {
  const answeredQs = req.questions.filter(
    q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined
  )
  const done = answeredQs.length
  const total = req.questions.length

  const liveScore = done === 0 ? null : Math.round(
    (answeredQs.reduce((s, q) => s + (answers[q.id]?.answer ?? 0), 0) / done / 4) * 100
  )
  const liveLevel = done === 0 ? null : Math.min(5,
    Math.round(answeredQs.reduce((s, q) => s + (answers[q.id]?.answer ?? 0), 0) / done) + 1
  )
  const meta = liveLevel ? maturityMeta(liveLevel) : null

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
            {req.code}
          </span>
          <span className="text-xs text-foreground truncate">{req.title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {liveScore !== null && (
            <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(liveScore) }}>
              {liveScore}%
            </span>
          )}
          {liveLevel && meta && (
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', meta.bg, meta.color)}>
              L{liveLevel}
            </span>
          )}
        </div>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${liveScore ?? 0}%`,
            backgroundColor: liveScore !== null ? scoreColor(liveScore) : '#888',
          }} />
      </div>
      <p className="text-[10px] text-muted-foreground">{done}/{total} answered</p>
    </div>
  )
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({ history }: { history: HistoryEntry[] }) {
  const [open, setOpen] = useState(false)
  if (history.length === 0) return null
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <History className="h-3.5 w-3.5" />
        {history.length} previous answer{history.length > 1 ? 's' : ''}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-border ml-1">
          {history.map(h => {
            const mm = maturityMeta(h.maturity_level)
            return (
              <div key={h.id} className="pl-3 py-2 rounded-lg bg-muted/30 text-xs space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium', answerBadgeCls[h.answer as AnswerValue])}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', answerDotColor[h.answer as AnswerValue])} />
                    {answerLabel[h.answer as AnswerValue]}
                  </span>
                  <span className="font-semibold tabular-nums" style={{ color: scoreColor(h.score) }}>{h.score}%</span>
                  <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', mm.bg, mm.color)}>L{h.maturity_level}</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(h.answered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {h.note && <p className="text-muted-foreground italic">"{h.note}"</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Roadmap Step (compact sidebar) ──────────────────────────────────────────

function RoadmapStepCard({ step }: { step: RoadmapStep }) {
  const [open, setOpen] = useState(step.is_current || step.is_next)
  const isCompleted = step.status === 'completed'
  const isCurrent = step.status === 'current'
  const isNext = step.is_next
  const isTodo = step.status === 'todo' && !isNext

  return (
    <div className={cn(
      'rounded-lg border transition-all overflow-hidden',
      isCompleted && 'border-[#1D9E75]/20 bg-[#F0FBF6]/40 dark:bg-[#0A2218]/40 opacity-60',
      isCurrent && 'border-[#378ADD]/35 bg-white dark:bg-[#0F1E2E]',
      isNext && 'border-[#EF9F27]/35 bg-[#FFFBF0] dark:bg-[#1E1500]',
      isTodo && 'border-border/25 bg-muted/15 opacity-35',
    )}>
      <button className="w-full flex items-center gap-2 px-3 py-2 text-left"
        onClick={() => (isCurrent || isNext) && setOpen(v => !v)}>
        <span className="text-sm">{step.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold">L{step.level} {step.label}</span>
            {isCurrent && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#378ADD]/15 text-[#378ADD]">NOW</span>}
            {isNext && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#EF9F27]/15 text-[#9A6500] dark:text-[#FAC775]">NEXT</span>}
            {isCompleted && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#1D9E75]/15 text-[#0F6E56] dark:text-[#9FE1CB]">✓</span>}
          </div>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{step.subtitle}</p>
        </div>
        {(isCurrent || isNext) && step.actions.length > 0 && (
          open
            ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
            : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (isCurrent || isNext) && step.actions.length > 0 && (
        <div className="px-3 pb-2.5 space-y-1 border-t border-border/20 pt-2">
          {step.actions.map((action, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className={cn(
                'w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5',
                isCurrent ? 'bg-[#378ADD]/15 text-[#378ADD]' : 'bg-[#EF9F27]/15 text-[#9A6500] dark:text-[#FAC775]'
              )}>{i + 1}</span>
              <p className="text-[11px] text-foreground leading-relaxed">{action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function ResultsSidebar({
  requirements, answers, allAnswered, answered, total,
  displayScore, displayMaturity, mlResult, mlLoading, mlError,
  onGenerate, onSave, saving,
}: {
  requirements: Requirement[]
  answers: Record<number, { answer: AnswerValue | null; note: string }>
  allAnswered: boolean
  answered: number
  total: number
  displayScore: number | null
  displayMaturity: number | null
  mlResult: MLResult | null
  mlLoading: boolean
  mlError: string | null
  onGenerate: () => void
  onSave: () => void
  saving: boolean
}) {
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0
  const meta = displayMaturity ? maturityMeta(displayMaturity) : null

  return (
    <div className="flex flex-col gap-3">



      {/* ── Per-requirement breakdown ───────────────────────────────────────── */}
      {requirements.length > 1 && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">By Requirement</span>
            </div>
            {requirements.map(req => (
              <ReqScoreBar key={req.id} req={req} answers={answers} />
            ))}
          </CardContent>
        </Card>
      )}




    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnswerQuestionsPage({ assessment, requirements }: Props) {

  const initialAnswers = useMemo(() => {
    const map: Record<number, { answer: AnswerValue | null; note: string }> = {}
    requirements.forEach(req => req.questions.forEach(q => {
      map[q.id] = { answer: q.current_answer, note: q.current_note ?? '' }
    }))
    return map
  }, [requirements])

  const [answers, setAnswers] = useState(initialAnswers)
  const [saving, setSaving] = useState(false)
  const [expandedReqs, setExpandedReqs] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {}
    requirements.forEach(r => { init[r.id] = true })
    return init
  })

  const allQuestions = useMemo(() => requirements.flatMap(r => r.questions), [requirements])

  const answered = useMemo(
    () => allQuestions.filter(q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined).length,
    [allQuestions, answers]
  )
  const total = allQuestions.length
  const allAnswered = answered === total && total > 0

  const [mlResult, setMlResult] = useState<MLResult | null>(null)
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState<string | null>(null)

  const liveScore = useMemo(() => {
    if (answered === 0) return null
    const qs = allQuestions.filter(q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined)
    const avg = qs.reduce((s, q) => s + (answers[q.id]?.answer ?? 0), 0) / qs.length
    return Math.round((avg / 4) * 100)
  }, [answers, allQuestions, answered])

  const liveMaturity = useMemo(() => {
    if (answered === 0) return null
    const qs = allQuestions.filter(q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined)
    const avg = qs.reduce((s, q) => s + (answers[q.id]?.answer ?? 0), 0) / qs.length
    return Math.min(5, Math.round(avg) + 1)
  }, [answers, allQuestions, answered])

  const displayScore = mlResult?.weighted_score ?? liveScore
  const displayMaturity = mlResult?.maturity_level ?? liveMaturity

  async function generateActionPlan() {
    if (!allAnswered) return
    setMlLoading(true)
    setMlError(null)
    try {
      const predictPayload: Record<string, number> = {}
      allQuestions.forEach((q, i) => { predictPayload[`q${i + 1}`] = answers[q.id]?.answer ?? 0 })

      const { data: prediction } = await axios.post<MLResult>('/api/ml/predict', predictPayload)

      const analyzePayload = {
        requirement_code: requirements[0]?.code ?? '',
        requirement_title: requirements[0]?.title ?? '',
        maturity_level: prediction.maturity_level,
        score: prediction.weighted_score,
        gap: 5 - prediction.maturity_level,
        answers: Object.fromEntries(allQuestions.map((q, i) => [`q${i + 1}`, answers[q.id]?.answer ?? 0])),
      }
      const { data: analysis } = await axios.post('/api/ml/analyze', analyzePayload)
      setMlResult({ ...prediction, ...analysis })
    } catch {
      setMlError('ML API unavailable — unable to generate action plan')
    } finally {
      setMlLoading(false)
    }
  }

  const setAnswer = (qId: number, value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], answer: value } }))
    if (mlResult) setMlResult(null)
  }

  const setNote = (qId: number, note: string) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], note } }))
  }

  // ─── Save & redirect to results page ──────────────────────────────────────

  const handleSubmit = () => {
    if (!allAnswered) return
    setSaving(true)
    const payload = allQuestions.map(q => ({
      question_id: q.id,
      answer: answers[q.id]?.answer,
      note: answers[q.id]?.note ?? '',
    }))

    // Inertia's FormData serializer only accepts primitives/arrays/strings,
    // so we serialize ml_result to a JSON string and decode it server-side.
    router.post(
      `/gap-assessments/${assessment.id}/answers`,
      {
        answers: payload,
        ...(mlResult ? { ml_result: JSON.stringify(mlResult) } : {}),
      },
      {
        onFinish: () => setSaving(false),
      }
    )
  }

  const getReqAnsweredCount = (req: Requirement) =>
    req.questions.filter(q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined).length

  return (
    <AppLayout breadcrumbs={[
      { title: 'Gap Assessments', href: '/gap-assessment' },
      { title: assessment.name, href: `/gap-assessments/${assessment.id}` },
      { title: 'Answer Questions', href: '' },
    ]}>
      <Head title={`Answer Questions — ${assessment.name}`} />

      <div className="w-full max-w-full px-6 py-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="default" className="h-8 w-8 shrink-0 p-0"
            onClick={() => router.visit('/gap-assessment')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            {assessment.framework && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4]">
                {assessment.framework.code}
              </span>
            )}
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {assessment.code}
            </span>
            <h1 className="text-lg font-bold">{assessment.name}</h1>
          </div>
        </div>

        {/* Split Layout */}
<div className="w-full max-w-full px-6 py-5">
          {/* LEFT — Questions */}
          <div className="w-full space-y-3">
            <p className="text-sm text-muted-foreground">
              Select the maturity level that best describes your current implementation
            </p>

            {requirements.map(req => {
              const isExpanded = expandedReqs[req.id]
              const answeredCount = getReqAnsweredCount(req)
              const reqTotal = req.questions.length
              const reqDone = answeredCount === reqTotal

              return (
                <Card key={req.id} className="overflow-hidden">
                  <CardHeader
                    className={cn(
                      'cursor-pointer select-none transition-colors hover:bg-muted/40 py-3 px-4',
                      isExpanded ? 'border-b' : ''
                    )}
                    onClick={() => setExpandedReqs(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                          reqDone
                            ? 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#085041] dark:text-[#9FE1CB]'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {reqDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : answeredCount}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {req.code}
                            </span>
                            <span className="text-sm font-medium">{req.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{answeredCount}/{reqTotal} questions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {reqDone && (
                          <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                            Complete
                          </span>
                        )}
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-5 pt-4 px-4">
                      {req.questions.map((q, qi) => {
                        const current = answers[q.id]?.answer ?? null
                        const note = answers[q.id]?.note ?? ''
                        const isAnswered = current !== null && current !== undefined

                        return (
                          <div key={q.id} className="space-y-3">
                            {qi > 0 && <div className="border-t" />}
                            <div className="flex items-start gap-3">
                              <span className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5',
                                isAnswered
                                  ? 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#085041] dark:text-[#9FE1CB]'
                                  : 'bg-muted text-muted-foreground'
                              )}>
                                {isAnswered ? <CheckCircle2 className="h-3 w-3" /> : qi + 1}
                              </span>
                              <div className="flex-1 space-y-3">
                                <p className="text-sm leading-relaxed">{q.text}</p>
                                <div className="grid grid-cols-5 gap-1.5">
                                  {LEVEL_OPTIONS.map(opt => {
                                    const isSel = current === opt.value
                                    return (
                                      <button key={opt.value} onClick={() => setAnswer(q.id, opt.value)}
                                        className={cn(
                                          'flex flex-col items-center gap-1.5 rounded-xl border py-2.5 px-1 text-center transition-all duration-150',
                                          isSel
                                            ? `${opt.activeBg} ${opt.activeBorder} ${opt.activeText} font-semibold`
                                            : `border-border bg-background text-muted-foreground ${opt.hoverClass}`
                                        )}>
                                        <span className={cn('w-2 h-2 rounded-full', isSel ? opt.dot : 'bg-muted-foreground/30')} />
                                        <span className="text-xs font-semibold">{opt.label}</span>
                                        <span className="text-[10px] opacity-70">{opt.sub}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                                {isAnswered && (
                                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                    <Input placeholder="Add a note or justification… (optional)"
                                      value={note} onChange={e => setNote(q.id, e.target.value)}
                                      className="text-sm h-9" />
                                  </div>
                                )}
                                <HistoryPanel history={q.history} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  )}
                </Card>
              )
            })}

            {/* ── Save button ───────────────────────────────────────────────────────── */}
            <div className="border-t pt-3 space-y-2">
              <Button size="default" disabled={!allAnswered || saving} onClick={handleSubmit}
                className="gap-2 w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save & View Results'}
              </Button>
              {!allAnswered && (
                <p className="text-xs text-center text-muted-foreground">
                  {total - answered} question{total - answered > 1 ? 's' : ''} remaining
                </p>
              )}

            </div>
          </div>

          {/* RIGHT — Sticky sidebar */}
          <div className="w-[290px] shrink-0 sticky top-4 max-h-[calc(100vh-72px)] overflow-y-auto pb-4">
            <ResultsSidebar
              requirements={requirements}
              answers={answers}
              allAnswered={allAnswered}
              answered={answered}
              total={total}
              displayScore={displayScore}
              displayMaturity={displayMaturity}
              mlResult={mlResult}
              mlLoading={mlLoading}
              mlError={mlError}
              onGenerate={generateActionPlan}
              onSave={handleSubmit}
              saving={saving}
            />
          </div>

        </div>
      </div>
    </AppLayout>
  )
}