import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, Edit2, Download, Target, TrendingUp,
  AlertTriangle, CheckCheck, ArrowRight, ChevronDown,
  ChevronUp, Zap, BarChart3, Shield, Loader2, Sparkles,
} from 'lucide-react'
import axios from 'axios'

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerValue = 0 | 1 | 2 | 3 | 4

interface QuestionResult {
  id: number
  text: string
  answer: AnswerValue | null
  note: string | null
  score: number | null
  maturity_level: number | null
}

interface RequirementResult {
  id: number
  code: string
  title: string
  score: number
  maturity_level: number
  questions: QuestionResult[]
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

interface GapAssessment {
  id: number
  code: string
  name: string
  framework: { code: string; name: string } | null
  // FIX 1 : overall_score et overall_maturity_level sont dans assessment (cf. controller)
  overall_score: number
  overall_maturity_level: number
}

interface Props {
  assessment: GapAssessment
  requirements: RequirementResult[]
  ml_result?: MLResult
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s < 40 ? '#E24B4A' : s < 70 ? '#EF9F27' : '#1D9E75'

const maturityMeta = (level: number) => {
  const map: Record<number, { label: string; color: string; bg: string; border: string }> = {
    1: { label: 'Initial',   color: 'text-[#A32D2D] dark:text-[#F09595]', bg: 'bg-[#FCEBEB] dark:bg-[#501313]', border: 'border-[#E24B4A]/30' },
    2: { label: 'Basic',     color: 'text-[#9A3412] dark:text-[#FDC58A]', bg: 'bg-[#FEF3E2] dark:bg-[#4A2800]', border: 'border-[#F97316]/30' },
    3: { label: 'Defined',   color: 'text-[#854F0B] dark:text-[#FAC775]', bg: 'bg-[#FAEEDA] dark:bg-[#412402]', border: 'border-[#EF9F27]/30' },
    4: { label: 'Managed',   color: 'text-[#3B6D11] dark:text-[#C0DD97]', bg: 'bg-[#EAF3DE] dark:bg-[#27500A]', border: 'border-[#65A30D]/30' },
    5: { label: 'Optimized', color: 'text-[#0F6E56] dark:text-[#9FE1CB]', bg: 'bg-[#E1F5EE] dark:bg-[#085041]', border: 'border-[#1D9E75]/30' },
  }
  return map[level] ?? { label: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' }
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const validScore = typeof score === 'number' && !isNaN(score)
    ? Math.min(100, Math.max(0, score))
    : 0
  const r    = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const off  = circ - (validScore / 100) * circ
  const col  = scoreColor(validScore)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth="7" className="text-muted/40" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col}
        strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={isNaN(off) ? circ : off}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  )
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function RadarChart({ requirements }: { requirements: RequirementResult[] }) {
  const n = requirements.length
  if (n < 3) return null

  const cx     = 180
  const cy     = 160
  const radius = 130
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0]

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const point = (i: number, r: number) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  })

  const gridPath = (factor: number) =>
    requirements
      .map((_, i) => {
        const p = point(i, radius * factor)
        return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
      })
      .join(' ') + ' Z'

  const dataPath =
    requirements
      .map((req, i) => {
        const p = point(i, radius * ((req.score ?? 0) / 100))
        return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
      })
      .join(' ') + ' Z'

  return (
    <svg viewBox="0 0 360 320" className="w-full max-w-[380px]">
      {levels.map(f => (
        <path key={f} d={gridPath(f)} fill="none"
          stroke="currentColor" strokeWidth="0.5" className="text-border" />
      ))}
      {requirements.map((_, i) => {
        const p = point(i, radius)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
          stroke="currentColor" strokeWidth="0.5" className="text-border" />
      })}
      <path d={dataPath} fill="#378ADD" fillOpacity="0.15"
        stroke="#378ADD" strokeWidth="2" strokeLinejoin="round" />
      {requirements.map((req, i) => {
        const p = point(i, radius * ((req.score ?? 0) / 100))
        return (
          <circle key={i} cx={p.x} cy={p.y} r="4"
            fill={scoreColor(req.score ?? 0)} stroke="white" strokeWidth="1.5" />
        )
      })}
      {requirements.map((req, i) => {
        const p     = point(i, radius + 24)
        const align = p.x < cx - 5 ? 'end' : p.x > cx + 5 ? 'start' : 'middle'
        return (
          <g key={i}>
            <text x={p.x} y={p.y - 4} textAnchor={align}
              fontSize="10" fontWeight="600" fill="currentColor" className="text-foreground"
              style={{ fontFamily: 'var(--font-sans)' }}>
              {req.code}
            </text>
            <text x={p.x} y={p.y + 10} textAnchor={align}
              fontSize="10" fill="currentColor" className="text-muted-foreground"
              style={{ fontFamily: 'var(--font-sans)' }}>
              {Math.round(req.score ?? 0)}%
            </text>
          </g>
        )
      })}
      {levels.map(f => {
        const p = point(0, radius * f)
        return (
          <text key={f} x={p.x + 4} y={p.y - 3} fontSize="8"
            fill="currentColor" className="text-muted-foreground"
            style={{ fontFamily: 'var(--font-sans)' }}>
            {Math.round(f * 100)}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Requirement Row ──────────────────────────────────────────────────────────

function RequirementRow({ req }: { req: RequirementResult }) {
  const score = Math.round(req.score ?? 0)
  const meta  = maturityMeta(req.maturity_level ?? 1)

  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded shrink-0">
          {req.code}
        </span>
        <span className="text-sm text-foreground truncate">{req.title}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
        </div>
        <span className="text-sm font-bold tabular-nums w-9 text-right"
          style={{ color: scoreColor(score) }}>
          {score}%
        </span>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', meta.bg, meta.color)}>
          L{req.maturity_level ?? 1}
        </span>
      </div>
    </div>
  )
}

// ─── Roadmap Step ─────────────────────────────────────────────────────────────

function RoadmapStepCard({ step }: { step: RoadmapStep }) {
  const [open, setOpen] = useState(step.is_current || step.is_next)

  const isCompleted = step.status === 'completed'
  const isCurrent   = step.status === 'current'
  const isNext      = step.is_next
  const isTodo      = step.status === 'todo' && !isNext

  return (
    <div className={cn(
      'rounded-xl border transition-all overflow-hidden',
      isCompleted && 'border-[#1D9E75]/20 bg-[#F0FBF6] dark:bg-[#0A2218] opacity-70',
      isCurrent   && 'border-[#378ADD]/40 bg-white dark:bg-[#0F1E2E] shadow-sm',
      isNext      && 'border-[#EF9F27]/40 bg-[#FFFBF0] dark:bg-[#1E1500] shadow-sm',
      isTodo      && 'border-border/30 bg-muted/10 opacity-40',
    )}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => (isCurrent || isNext) && setOpen(v => !v)}
      >
        <span className="text-lg">{step.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">L{step.level} — {step.label}</span>
            {isCurrent   && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#378ADD]/15 text-[#185FA5] dark:text-[#85B7EB]">NOW</span>}
            {isNext      && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EF9F27]/15 text-[#854F0B] dark:text-[#FAC775]">NEXT</span>}
            {isCompleted && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1D9E75]/15 text-[#0F6E56] dark:text-[#9FE1CB]">✓ Done</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>
        </div>
        {(isCurrent || isNext) && step.actions.length > 0 && (
          open
            ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (isCurrent || isNext) && step.actions.length > 0 && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/20 pt-3">
          {step.actions.map((action, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                isCurrent
                  ? 'bg-[#378ADD]/15 text-[#185FA5] dark:text-[#85B7EB]'
                  : 'bg-[#EF9F27]/15 text-[#854F0B] dark:text-[#FAC775]'
              )}>
                {i + 1}
              </span>
              <p className="text-sm text-foreground leading-relaxed">{action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssessmentResultsPage({
  assessment,
  requirements,
  ml_result: initialMlResult,
}: Props) {
  // FIX 1 : lire depuis assessment (cf. controller → resultsPage)
  const overall_score    = Math.round(assessment.overall_score ?? 0)
  const overall_maturity = assessment.overall_maturity_level ?? 1

  const [mlResult, setMlResult] = useState<MLResult | undefined>(initialMlResult)
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError]     = useState<string | null>(null)

  const meta  = maturityMeta(overall_maturity)
  const gap   = 5 - overall_maturity
  const hasML = !!mlResult?.roadmap

  // ─── Generate Action Plan ──────────────────────────────────────────────────

  const generateActionPlan = async () => {
    setMlLoading(true)
    setMlError(null)
    try {
      // FIX 2 : utiliser req.questions (plus req.answers qui n'existe pas)
      const allQuestions = requirements.flatMap(req => req.questions ?? [])
      if (allQuestions.length === 0) throw new Error('No questions found')

      const answersArray  = allQuestions.map(q => ({ question_id: q.id, answer: q.answer ?? 0 }))
      const questionsArray = allQuestions.map(q => ({ id: q.id, text: q.text }))

      const { data: prediction } = await axios.post<MLResult>('/api/ml/predict', {
        answers:   answersArray,
        questions: questionsArray,
      })

      const firstReq = requirements[0]
      const { data: analysis } = await axios.post('/api/ml/analyze', {
        requirement_code:  firstReq?.code  ?? '',
        requirement_title: firstReq?.title ?? '',
        maturity_level:    prediction.maturity_level,
        score:             prediction.weighted_score,
        gap:               5 - prediction.maturity_level,
        answers:           answersArray,
      })

      setMlResult({ ...prediction, ...analysis })
    } catch {
      setMlError('Unable to generate action plan. Please try again.')
    } finally {
      setMlLoading(false)
    }
  }

  // ─── Issue icon helper ─────────────────────────────────────────────────────

  const issueIcon = (issue: string) => {
    if (issue.toLowerCase().startsWith('critical'))  return <AlertTriangle className="h-4 w-4 text-[#E24B4A] shrink-0 mt-0.5" />
    if (issue.toLowerCase().startsWith('confirmed')) return <CheckCheck    className="h-4 w-4 text-[#1D9E75] shrink-0 mt-0.5" />
    return <ArrowRight className="h-4 w-4 text-[#EF9F27] shrink-0 mt-0.5" />
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout breadcrumbs={[
      { title: 'Gap Assessments', href: '/gap-assessment' },
      { title: assessment.name, href: `/gap-assessments/${assessment.id}` },
      { title: 'Results', href: '' },
    ]}>
      <Head title={`Results — ${assessment.name}`} />

      <div className="w-full max-w-6xl mx-auto px-8 py-8 space-y-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="default" className="h-9 w-9 shrink-0 p-0"
            onClick={() => router.visit('/gap-assessment')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {assessment.framework && (
                <span className="text-sm font-bold px-3 py-1 rounded-md bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4]">
                  {assessment.framework.code}
                </span>
              )}
              <span className="text-sm font-mono font-bold px-2 py-1 rounded bg-muted text-muted-foreground">
                {assessment.code}
              </span>
            </div>
            <h1 className="text-3xl font-bold mt-2">{assessment.name}</h1>
            <p className="text-base text-muted-foreground mt-1">Assessment Results</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* FIX 4 : route correcte vers answer-questions */}
            <Button variant="outline" size="default" className="gap-2"
              onClick={() => router.visit(`/gap-assessments/${assessment.id}/answer-questions`)}>
              <Edit2 className="h-4 w-4" />
              Edit Answers
            </Button>
            <Button variant="outline" size="default" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* ── KPI Row ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Overall Score */}
          <Card>
            <CardContent className="pt-6 pb-6 flex items-center gap-4">
              <div className="relative shrink-0">
                <ScoreRing score={overall_score} size={90} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold tabular-nums" style={{ color: scoreColor(overall_score) }}>
                    {overall_score}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-3xl font-bold tabular-nums mt-1" style={{ color: scoreColor(overall_score) }}>
                  {overall_score}%
                </p>
                {mlResult?.confidence && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Zap className="h-3 w-3" />
                    {Math.round(mlResult.confidence * 100)}% confidence
                    {mlResult.source === 'ml_model' && ' · ML model'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Maturity Level */}
          <Card>
            <CardContent className="pt-6 pb-6 flex items-center gap-4">
              <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center shrink-0', meta.bg)}>
                <Shield className={cn('h-8 w-8', meta.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maturity Level</p>
                <span className={cn('inline-flex text-2xl font-bold px-3 py-1 rounded-xl mt-1', meta.bg, meta.color)}>
                  L{overall_maturity}
                </span>
                <p className={cn('text-sm font-semibold mt-1', meta.color)}>{meta.label}</p>
              </div>
            </CardContent>
          </Card>

          {/* Gap to L5 */}
          <Card>
            <CardContent className="pt-6 pb-6 flex items-center gap-4">
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center shrink-0',
                gap === 0 ? 'bg-[#E1F5EE] dark:bg-[#085041]' : 'bg-[#FCEBEB] dark:bg-[#501313]'
              )}>
                <TrendingUp className={cn('h-8 w-8',
                  gap === 0 ? 'text-[#0F6E56] dark:text-[#9FE1CB]' : 'text-[#A32D2D] dark:text-[#F09595]'
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gap to L5 Optimized</p>
                <p className="text-3xl font-bold mt-1" style={{ color: gap === 0 ? '#1D9E75' : '#E24B4A' }}>
                  {gap === 0 ? '✓ Achieved' : `${gap} level${gap > 1 ? 's' : ''}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {gap === 0 ? 'Maximum maturity reached' : `${gap * 20}% improvement needed`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Radar + Breakdown ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Coverage by Requirement
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center pt-2 pb-4">
              <RadarChart requirements={requirements} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Requirement Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {requirements.map(req => (
                <RequirementRow key={req.id} req={req} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── AI Action Plan ────────────────────────────────────────────────── */}
        {hasML && mlResult ? (
          <Card className="border-2 border-[#378ADD]/25 bg-[#F0F7FF]/50 dark:bg-[#0C1829]/50 overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-6 border-b border-[#378ADD]/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#378ADD]/15 flex items-center justify-center">
                  <Target className="h-5 w-5 text-[#378ADD]" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold">AI Action Plan</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generated based on your assessment answers
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={generateActionPlan}
                  disabled={mlLoading} className="gap-1">
                  {mlLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Sparkles className="h-4 w-4" />}
                  <span className="text-xs">Regenerate</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-5 px-6 space-y-6">

              {mlResult.summary && (
                <div className="p-4 rounded-xl bg-white/70 dark:bg-white/5 border border-[#378ADD]/20">
                  <p className="text-sm leading-relaxed text-foreground">{mlResult.summary}</p>
                </div>
              )}

              {mlResult.current_issues && mlResult.current_issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    Current Status
                  </h4>
                  <div className="space-y-2">
                    {mlResult.current_issues.map((issue, i) => {
                      const isCrit = issue.toLowerCase().startsWith('critical')
                      const isGood = issue.toLowerCase().startsWith('confirmed')
                      return (
                        <div key={i} className={cn(
                          'flex items-start gap-2.5 p-3 rounded-lg border border-border/40',
                          isCrit ? 'bg-[#FCEBEB]/60 dark:bg-[#501313]/20'
                                 : isGood ? 'bg-[#E1F5EE]/60 dark:bg-[#085041]/20'
                                          : 'bg-[#FAEEDA]/60 dark:bg-[#412402]/20'
                        )}>
                          {issueIcon(issue)}
                          <p className="text-sm text-foreground leading-relaxed">{issue}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Improvement Roadmap
                </h4>
                <div className="space-y-2">
                  {mlResult.roadmap!.map(step => (
                    <RoadmapStepCard key={step.level} step={step} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ── No ML yet → Generate CTA ──────────────────────────────────── */
          <Card className="border-dashed border-[#378ADD]/25">
            <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#378ADD]/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-[#378ADD]/50" />
              </div>
              <div>
                <p className="text-base font-medium">No Action Plan Generated</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate a personalized AI-powered action plan based on your answers
                </p>
                {mlError && (
                  <p className="text-sm text-[#A32D2D] dark:text-[#F09595] mt-2">{mlError}</p>
                )}
              </div>
              <Button onClick={generateActionPlan} disabled={mlLoading}
                className="gap-2 bg-[#378ADD] hover:bg-[#2868B0] text-white">
                {mlLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  : <><Sparkles className="h-4 w-4" /> Generate Action Plan</>}
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </AppLayout>
  )
}