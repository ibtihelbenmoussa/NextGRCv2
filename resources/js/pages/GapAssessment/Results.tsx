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
  overall_score: number
  overall_maturity_level: number
}

interface Props {
  assessment: GapAssessment
  requirements: RequirementResult[]
  ml_result?: MLResult
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s < 40 ? '#E24B4A' : s < 70 ? '#EF9F27' : '#1D9E75'

const maturityMeta = (level: number) => {
  const map: Record<number, { label: string; color: string; bg: string; dot: string }> = {
    1: { label: 'Initial',   color: 'text-[#A32D2D] dark:text-[#F09595]', bg: 'bg-[#FCEBEB] dark:bg-[#501313]', dot: '#E24B4A' },
    2: { label: 'Basic',     color: 'text-[#9A3412] dark:text-[#FDC58A]', bg: 'bg-[#FEF3E2] dark:bg-[#4A2800]', dot: '#F97316' },
    3: { label: 'Defined',   color: 'text-[#854F0B] dark:text-[#FAC775]', bg: 'bg-[#FAEEDA] dark:bg-[#412402]', dot: '#EF9F27' },
    4: { label: 'Managed',   color: 'text-[#3B6D11] dark:text-[#C0DD97]', bg: 'bg-[#EAF3DE] dark:bg-[#27500A]', dot: '#65A30D' },
    5: { label: 'Optimized', color: 'text-[#0F6E56] dark:text-[#9FE1CB]', bg: 'bg-[#E1F5EE] dark:bg-[#085041]', dot: '#1D9E75' },
  }
  return map[level] ?? { label: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted', dot: '#888' }
}

// Couleur de dot par niveau (pour roadmap)
const LEVEL_DOT: Record<number, string> = {
  1: '#E24B4A', 2: '#F97316', 3: '#EF9F27', 4: '#65A30D', 5: '#1D9E75',
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 90 }: { score: number; size?: number }) {
  const v    = isNaN(score) ? 0 : Math.min(100, Math.max(0, score))
  const r    = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const off  = circ - (v / 100) * circ

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor"
        strokeWidth="7" className="text-muted/40" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={scoreColor(v)}
        strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  )
}

// ─── Coverage Bar Chart (remplace radar, fonctionne pour n≥1) ─────────────────

function CoverageBarChart({ requirements }: { requirements: RequirementResult[] }) {
  if (requirements.length === 0) return null

  return (
    <div className="space-y-5 w-full">
      {requirements.map(req => {
        const score = Math.round(req.score ?? 0)
        const meta  = maturityMeta(req.maturity_level ?? 1)

        return (
          <div key={req.id} className="space-y-1.5">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">
                  {req.code}
                </span>
                <span className="text-xs text-foreground truncate">{req.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(score) }}>
                  {score}%
                </span>
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', meta.bg, meta.color)}>
                  L{req.maturity_level ?? 1}
                </span>
              </div>
            </div>

            {/* Segmented bar : 5 segments = 5 levels */}
            <div className="flex gap-0.5 h-3">
              {[1, 2, 3, 4, 5].map(lvl => {
                const filled  = score >= lvl * 20
                const partial = !filled && score > (lvl - 1) * 20
                const pct     = partial ? ((score - (lvl - 1) * 20) / 20) * 100 : 0
                const m       = maturityMeta(lvl)
                return (
                  <div key={lvl} className="flex-1 relative rounded-sm overflow-hidden bg-muted/50">
                    {(filled || partial) && (
                      <div
                        className="absolute inset-y-0 left-0 rounded-sm transition-all duration-700"
                        style={{
                          width:           filled ? '100%' : `${pct}%`,
                          backgroundColor: m.dot,
                          opacity:         filled ? 0.9 : 0.6,
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Level labels */}
            <div className="flex justify-between px-0.5">
              {['L1 Init', 'L2 Basic', 'L3 Def', 'L4 Mgd', 'L5 Opt'].map((l, i) => (
                <span key={i} className="text-[9px] text-muted-foreground/50">{l}</span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
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
  const isCurrent   = step.is_current
  const isNext      = step.is_next && !step.is_current
  const isTodo      = !isCompleted && !isCurrent && !isNext

  // Subtitle : masquer "Not implemented" si le step est marqué Done
  const showSubtitle = step.subtitle
    && !(isCompleted && step.subtitle.toLowerCase().includes('not implemented'))

  return (
    <div className={cn(
      'rounded-xl border transition-all overflow-hidden',
      isCompleted && 'border-[#1D9E75]/25 bg-[#F0FBF6]/40 dark:bg-[#0A2218]/40 opacity-65',
      isCurrent   && 'border-[#378ADD]/40 bg-white dark:bg-[#0F1E2E] shadow-sm',
      isNext      && 'border-[#EF9F27]/40 bg-[#FFFBF0] dark:bg-[#1E1500] shadow-sm',
      isTodo      && 'border-border/25 bg-muted/10 opacity-40',
    )}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => (isCurrent || isNext) && setOpen(v => !v)}
      >
        {/* Dot coloré par niveau (pas par statut) */}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: LEVEL_DOT[step.level] ?? '#888' }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">L{step.level} — {step.label}</span>
            {isCurrent   && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#378ADD]/15 text-[#185FA5] dark:text-[#85B7EB]">NOW</span>}
            {isNext      && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EF9F27]/15 text-[#854F0B] dark:text-[#FAC775]">NEXT</span>}
            {isCompleted && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1D9E75]/15 text-[#0F6E56] dark:text-[#9FE1CB]">✓ Done</span>}
          </div>
          {showSubtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>
          )}
        </div>

        {(isCurrent || isNext) && step.actions.length > 0 && (
          open
            ? <ChevronUp   className="h-4 w-4 text-muted-foreground shrink-0" />
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
      const allQuestions   = requirements.flatMap(req => req.questions ?? [])
      if (allQuestions.length === 0) throw new Error('No questions')

      const answersArray   = allQuestions.map(q => ({ question_id: q.id, answer: q.answer ?? 0 }))
      const questionsArray = allQuestions.map(q => ({ id: q.id, text: q.text }))

      const { data: prediction } = await axios.post<MLResult>('/api/ml/predict', {
        answers: answersArray, questions: questionsArray,
      })

      // Passer tous les requirements pour un summary complet
      const { data: analysis } = await axios.post('/api/ml/analyze', {
        requirement_code:    requirements.map(r => r.code).join(', '),
        requirement_title:   requirements.map(r => r.title).join(' | '),
        maturity_level:      prediction.maturity_level,
        score:               prediction.weighted_score,
        gap:                 5 - prediction.maturity_level,
        answers:             answersArray,
        requirements_detail: requirements.map(r => ({
          code: r.code, title: r.title,
          score: r.score, maturity_level: r.maturity_level,
        })),
      })

      setMlResult({ ...prediction, ...analysis })
    } catch {
      setMlError('Unable to generate action plan. Please try again.')
    } finally {
      setMlLoading(false)
    }
  }

  const issueIcon = (issue: string) => {
    const l = issue.toLowerCase()
    if (l.startsWith('critical'))  return <AlertTriangle className="h-4 w-4 text-[#E24B4A] shrink-0 mt-0.5" />
    if (l.startsWith('confirmed')) return <CheckCheck    className="h-4 w-4 text-[#1D9E75] shrink-0 mt-0.5" />
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

        {/* ── Header ─────────────────────────────────────────────────────── */}
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
            <Button variant="outline" size="default" className="gap-2"
              onClick={() => router.visit(`/gap-assessments/${assessment.id}/answer`)}
>
              <Edit2 className="h-4 w-4" /> Edit Answers
            </Button>
            <Button variant="outline" size="default" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* ── KPI Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">

          <Card>
            <CardContent className="pt-6 pb-6 flex items-center gap-4">
              <div className="relative shrink-0">
                <ScoreRing score={overall_score} size={90} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-bold tabular-nums" style={{ color: scoreColor(overall_score) }}>
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
                    {mlResult.source === 'ml_model' && ' · ML'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

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

        {/* ── Coverage + Breakdown ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">

          <Card>
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Coverage by Requirement
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-5">
              <CoverageBarChart requirements={requirements} />
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
                  disabled={mlLoading} className="gap-1.5">
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Current Status
                  </h4>
                  <div className="space-y-2">
                    {mlResult.current_issues.map((issue, i) => {
                      const l      = issue.toLowerCase()
                      const isCrit = l.startsWith('critical')
                      const isGood = l.startsWith('confirmed')
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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