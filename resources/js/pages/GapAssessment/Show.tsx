import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ClipboardList, Edit, Trash2, TrendingUp, Calendar,
  Building2, FileQuestion, CheckCircle2, AlertCircle,
  MessageSquare, Target, BarChart3, Layers, Sparkles,
  ChevronRight, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionAnswer {
  id: number
  text: string
  answer: number | null
  note: string | null
  score: number | null
  maturity_level: number | null
}

interface RequirementDetail {
  id: number
  code: string
  title: string
  description: string
  score: number
  maturity_level: number
  questions: QuestionAnswer[]
  answers_map: Record<number, number>
}

interface Assessment {
  id: number
  code: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  framework: { code: string; name: string } | null
  overall_score: number
  overall_maturity_level: number
}

interface Props {
  assessment: Assessment
  requirements: RequirementDetail[]
  ml_result?: any
}

// ─── Constants ────────────────────────────────────────────────────────────────

const maturityConfig: Record<number, {
  label: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  barColor: string
  ringColor: string
  softBg: string
}> = {
  1: {
    label: 'Initial',
    badgeBg: 'bg-[#FCEBEB] dark:bg-[#501313]',
    badgeText: 'text-[#A32D2D] dark:text-[#F09595]',
    badgeBorder: 'border-[#E24B4A]/30',
    barColor: '#E24B4A',
    ringColor: '#E24B4A',
    softBg: 'bg-[#FCEBEB]/40 dark:bg-[#501313]/20',
  },
  2: {
    label: 'Basic',
    badgeBg: 'bg-[#FEF3E2] dark:bg-[#4A2800]',
    badgeText: 'text-[#9A3412] dark:text-[#FDC58A]',
    badgeBorder: 'border-[#F97316]/30',
    barColor: '#F97316',
    ringColor: '#F97316',
    softBg: 'bg-[#FEF3E2]/40 dark:bg-[#4A2800]/20',
  },
  3: {
    label: 'Defined',
    badgeBg: 'bg-[#FAEEDA] dark:bg-[#412402]',
    badgeText: 'text-[#854F0B] dark:text-[#FAC775]',
    badgeBorder: 'border-[#EF9F27]/30',
    barColor: '#EF9F27',
    ringColor: '#EF9F27',
    softBg: 'bg-[#FAEEDA]/40 dark:bg-[#412402]/20',
  },
  4: {
    label: 'Managed',
    badgeBg: 'bg-[#EAF3DE] dark:bg-[#27500A]',
    badgeText: 'text-[#3B6D11] dark:text-[#C0DD97]',
    badgeBorder: 'border-[#65A30D]/30',
    barColor: '#65A30D',
    ringColor: '#65A30D',
    softBg: 'bg-[#EAF3DE]/40 dark:bg-[#27500A]/20',
  },
  5: {
    label: 'Optimized',
    badgeBg: 'bg-[#E1F5EE] dark:bg-[#085041]',
    badgeText: 'text-[#0F6E56] dark:text-[#9FE1CB]',
    badgeBorder: 'border-[#1D9E75]/30',
    barColor: '#1D9E75',
    ringColor: '#1D9E75',
    softBg: 'bg-[#E1F5EE]/40 dark:bg-[#085041]/20',
  },
}

const answerConfig: Record<number, { label: string; dot: string }> = {
  0: { label: 'Initial',    dot: 'bg-[#E24B4A]' },
  1: { label: 'Basic',      dot: 'bg-[#F97316]' },
  2: { label: 'Defined',    dot: 'bg-[#EF9F27]' },
  3: { label: 'Managed',    dot: 'bg-[#65A30D]' },
  4: { label: 'Optimized',  dot: 'bg-[#1D9E75]' },
}

const scoreColor = (s: number) => s < 40 ? '#E24B4A' : s < 70 ? '#EF9F27' : '#1D9E75'

// ─── Sub-components ───────────────────────────────────────────────────────────

function MaturityBadge({ level }: { level: number }) {
  const cfg = maturityConfig[level]
  if (!cfg) return null
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
      cfg.badgeBg, cfg.badgeText, cfg.badgeBorder,
    )}>
      L{level} {cfg.label}
    </span>
  )
}

function ScoreRing({ score, size = 72, level }: { score: number; size?: number; level?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = level ? (maturityConfig[level]?.ringColor ?? scoreColor(score)) : scoreColor(score)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5"
          className="stroke-muted/50" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold tabular-nums leading-none" style={{ color }}>
          {score.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  accent?: string
}) {
  return (
    <Card className="relative overflow-hidden">
      {accent && (
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg" style={{ backgroundColor: accent }} />
      )}
      <CardContent className="p-4 pl-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <div className="text-2xl font-bold leading-none">{value}</div>
            {sub && <div className="pt-1">{sub}</div>}
          </div>
          <div className="text-muted-foreground/50 mt-0.5">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function RequirementRow({ req }: { req: RequirementDetail }) {
  const cfg = maturityConfig[req.maturity_level] ?? maturityConfig[1]
  const pct = req.score ?? 0
  const answered = req.questions.filter(q => q.answer !== null && q.answer !== undefined).length
  const total = req.questions.length

  return (
    <AccordionItem
      value={req.id.toString()}
      className="border rounded-xl overflow-hidden mb-2 last:mb-0"
    >
      <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 py-3 transition-colors [&[data-state=open]]:bg-muted/20">
        <div className="flex flex-1 items-center gap-4 pr-3 text-left">

          {/* Score ring */}
          <div className="shrink-0">
            <ScoreRing score={pct} size={52} level={req.maturity_level} />
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                {req.code}
              </span>
              <span className="text-sm font-semibold leading-tight">{req.title}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <MaturityBadge level={req.maturity_level} />
              <span className="text-xs text-muted-foreground">
                {answered}/{total} questions answered
              </span>
              {answered === total && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0F6E56] dark:text-[#9FE1CB]">
                  <CheckCircle2 className="h-3 w-3" /> Complete
                </span>
              )}
            </div>
          </div>

          {/* Progress bar (right side) */}
          <div className="hidden sm:block w-24 shrink-0">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: cfg.barColor }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 text-right tabular-nums">{pct.toFixed(0)}%</p>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4 pt-0">
        {req.description && (
          <p className="text-xs text-muted-foreground mb-3 pl-14 leading-relaxed">{req.description}</p>
        )}
        <div className="pl-14 space-y-2">
          {req.questions.map((q, i) => {
            const isAnswered = q.answer !== null && q.answer !== undefined
            const aCfg = isAnswered ? answerConfig[q.answer!] : null
            const qMeta = q.maturity_level ? maturityConfig[q.maturity_level] : null

            return (
              <div
                key={q.id}
                className={cn(
                  'rounded-lg border p-3 space-y-2 transition-colors',
                  isAnswered ? 'bg-card' : 'bg-muted/20 border-dashed',
                )}
              >
                <div className="flex items-start gap-2">
                  <span className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5',
                    isAnswered
                      ? 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#085041] dark:text-[#9FE1CB]'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {isAnswered ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                  </span>
                  <p className="text-sm leading-relaxed flex-1">{q.text}</p>
                </div>

                {isAnswered && (
                  <div className="flex flex-wrap items-center gap-2 pl-7">
                    {/* Answer badge */}
                    {aCfg && (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-muted/60 font-medium">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', aCfg.dot)} />
                        {aCfg.label}
                      </span>
                    )}
                    {/* Score */}
                    {q.score !== null && (
                      <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(q.score) }}>
                        {q.score.toFixed(0)}%
                      </span>
                    )}
                    {/* Maturity badge */}
                    {q.maturity_level !== null && qMeta && (
                      <MaturityBadge level={q.maturity_level} />
                    )}
                  </div>
                )}

                {!isAnswered && (
                  <div className="pl-7">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" /> Not answered yet
                    </span>
                  </div>
                )}

                {q.note && (
                  <div className="pl-7">
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-md px-2.5 py-2">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="italic leading-relaxed">{q.note}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShowGapAssessment({ assessment, requirements, ml_result }: Props) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this assessment? All answers will be lost.')) return
    setDeleting(true)
    router.delete(`/gap-assessments/${assessment.id}`, {
      onFinish: () => setDeleting(false),
    })
  }

  const totalQuestions = requirements.reduce((a, r) => a + r.questions.length, 0)
  const answeredQuestions = requirements.reduce(
    (a, r) => a + r.questions.filter(q => q.answer !== null && q.answer !== undefined).length, 0
  )
  const completionPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

  const overallCfg = maturityConfig[assessment.overall_maturity_level ?? 1]
  const overallScore = assessment.overall_score ?? 0

  return (
    <AppLayout breadcrumbs={[
      { title: 'Gap Assessments', href: '/gap-assessment' },
      { title: assessment.code, href: '' },
    ]}>
      <Head title={`${assessment.code} — ${assessment.name}`} />

      <div className="space-y-6 px-6 py-5 max-w-screen-xl">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {assessment.framework && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4]">
                  {assessment.framework.code}
                </span>
              )}
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {assessment.code}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{assessment.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {assessment.framework && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {assessment.framework.name}
                </span>
              )}
              {(assessment.start_date || assessment.end_date) && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {assessment.start_date ? format(new Date(assessment.start_date), 'PP') : '—'}
                  {assessment.end_date && ` → ${format(new Date(assessment.end_date), 'PP')}`}
                </span>
              )}
            </div>
            {assessment.description && (
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {assessment.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
           
          
            <Button size="sm" onClick={() => router.get(`/gap-assessments/${assessment.id}/answer`)}
              className="bg-[#1D9E75] hover:bg-[#178260] text-white shadow-sm shadow-[#1D9E75]/25">
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Answer Questions
            </Button>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">

          {/* Overall score — big card */}
          <Card className="relative overflow-hidden col-span-2 lg:col-span-1">
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
              style={{ backgroundColor: overallCfg?.ringColor ?? '#888' }} />
            <CardContent className="p-4 pl-5 flex items-center gap-4">
              <ScoreRing score={overallScore} size={64} level={assessment.overall_maturity_level} />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overall Score</p>
                <MaturityBadge level={assessment.overall_maturity_level ?? 1} />
              </div>
            </CardContent>
          </Card>

          <StatCard
            icon={<Target className="h-5 w-5" />}
            label="Maturity Level"
            value={
              <span className="flex items-baseline gap-1">
                {assessment.overall_maturity_level ?? 1}
                <span className="text-base font-normal text-muted-foreground">/5</span>
              </span>
            }
            sub={<MaturityBadge level={assessment.overall_maturity_level ?? 1} />}
            accent={overallCfg?.ringColor}
          />

          <StatCard
            icon={<Layers className="h-5 w-5" />}
            label="Requirements"
            value={requirements.length}
            sub={<span className="text-xs text-muted-foreground">selected for assessment</span>}
            accent="#378ADD"
          />

          <StatCard
            icon={<FileQuestion className="h-5 w-5" />}
            label="Questions"
            value={
              <span>
                {answeredQuestions}
                <span className="text-base font-normal text-muted-foreground"> / {totalQuestions}</span>
              </span>
            }
            sub={
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden w-full">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%`, backgroundColor: scoreColor(completionPct) }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{completionPct}% answered</p>
              </div>
            }
            accent={scoreColor(completionPct)}
          />
        </div>

       
        

        {/* ── Requirements accordion ─────────────────────────────────────────── */}
        <div className="max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent rounded-lg">
  <Accordion type="multiple" className="space-y-0">
    {requirements.map(req => (
      <RequirementRow key={req.id} req={req} />
    ))}
  </Accordion>
</div>

        {/* ── ML Result ─────────────────────────────────────────────────────── */}
        {ml_result && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> AI Analysis
            </h2>
            <Card className="border-[#378ADD]/25 bg-[#F0F7FF]/60 dark:bg-[#0C1E30]/40">
              <CardContent className="p-4 space-y-4">

                {ml_result.summary && (
                  <p className="text-sm leading-relaxed text-foreground">{ml_result.summary}</p>
                )}

                {ml_result.current_issues?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Issues</p>
                    <div className="space-y-1">
                      {ml_result.current_issues.map((issue: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-3.5 w-3.5 text-[#E24B4A] shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ml_result.roadmap?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roadmap</p>
                    <div className="space-y-2">
                      {ml_result.roadmap.map((step: any, i: number) => {
                        const isCompleted = step.status === 'completed'
                        const isCurrent = step.status === 'current'
                        const isNext = step.is_next
                        return (
                          <div key={i} className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg border text-sm',
                            isCompleted && 'opacity-50 border-[#1D9E75]/20 bg-[#E1F5EE]/30',
                            isCurrent && 'border-[#378ADD]/30 bg-[#E6F1FB]/40 dark:bg-[#0C447C]/20',
                            isNext && 'border-[#EF9F27]/30 bg-[#FAEEDA]/40',
                            !isCompleted && !isCurrent && !isNext && 'border-border/30 opacity-40',
                          )}>
                            <span className="text-base shrink-0">{step.icon}</span>
                            <span className="flex-1 font-medium">L{step.level} {step.label}</span>
                            {isCurrent && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#378ADD]/15 text-[#378ADD]">NOW</span>}
                            {isNext && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EF9F27]/15 text-[#9A6500]">NEXT</span>}
                            {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-[#1D9E75]" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Fallback raw display */}
                {!ml_result.summary && !ml_result.current_issues && !ml_result.roadmap && (
                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                    {JSON.stringify(ml_result, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </AppLayout>
  )
}