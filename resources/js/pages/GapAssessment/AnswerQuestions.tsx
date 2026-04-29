import { useState, useMemo } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, ChevronLeft, Save, Clock, Loader2,
  ChevronDown, ChevronUp, History,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerValue = 'YES' | 'PARTIAL' | 'NO'

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ANSWER_OPTIONS: {
  value: AnswerValue
  label: string
  sub: string
  activeBg: string
  activeBorder: string
  activeText: string
  hoverClass: string
}[] = [
  {
    value: 'YES',
    label: 'Yes',
    sub: 'Fully implemented',
    activeBg: 'bg-[#E1F5EE] dark:bg-[#085041]/60',
    activeBorder: 'border-[#1D9E75]',
    activeText: 'text-[#0F6E56] dark:text-[#9FE1CB]',
    hoverClass: 'hover:bg-[#E1F5EE] hover:border-[#5DCAA5] dark:hover:bg-[#085041]/40',
  },
  {
    value: 'PARTIAL',
    label: 'Partial',
    sub: 'Partially implemented',
    activeBg: 'bg-[#FAEEDA] dark:bg-[#412402]/60',
    activeBorder: 'border-[#EF9F27]',
    activeText: 'text-[#854F0B] dark:text-[#FAC775]',
    hoverClass: 'hover:bg-[#FAEEDA] hover:border-[#FAC775] dark:hover:bg-[#412402]/40',
  },
  {
    value: 'NO',
    label: 'No',
    sub: 'Not implemented',
    activeBg: 'bg-[#FCEBEB] dark:bg-[#501313]/60',
    activeBorder: 'border-[#E24B4A]',
    activeText: 'text-[#A32D2D] dark:text-[#F09595]',
    hoverClass: 'hover:bg-[#FCEBEB] hover:border-[#F7C1C1] dark:hover:bg-[#501313]/40',
  },
]

const ANSWER_SCORE: Record<AnswerValue, number> = { YES: 1.0, PARTIAL: 0.5, NO: 0.0 }

const mapMaturityLevel = (score: number) => {
  if (score < 20) return 1
  if (score < 40) return 2
  if (score < 60) return 3
  if (score < 80) return 4
  return 5
}

const maturityMeta = (level: number) => {
  const map: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Initial', color: 'text-[#A32D2D] dark:text-[#F09595]', bg: 'bg-[#FCEBEB] dark:bg-[#501313]' },
    2: { label: 'Developing', color: 'text-[#854F0B] dark:text-[#FAC775]', bg: 'bg-[#FAEEDA] dark:bg-[#412402]' },
    3: { label: 'Defined', color: 'text-[#185FA5] dark:text-[#85B7EB]', bg: 'bg-[#E6F1FB] dark:bg-[#0C447C]' },
    4: { label: 'Managed', color: 'text-[#3B6D11] dark:text-[#C0DD97]', bg: 'bg-[#EAF3DE] dark:bg-[#27500A]' },
    5: { label: 'Optimized', color: 'text-[#0F6E56] dark:text-[#9FE1CB]', bg: 'bg-[#E1F5EE] dark:bg-[#085041]' },
  }
  return map[level] ?? { label: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted' }
}

const scoreColor = (s: number) => s < 40 ? '#E24B4A' : s < 70 ? '#EF9F27' : '#1D9E75'

const answerBadgeClass: Record<AnswerValue, string> = {
  YES: 'bg-[#E1F5EE] text-[#0F6E56] border-[#5DCAA5] dark:bg-[#085041] dark:text-[#9FE1CB]',
  PARTIAL: 'bg-[#FAEEDA] text-[#854F0B] border-[#FAC775] dark:bg-[#412402] dark:text-[#FAC775]',
  NO: 'bg-[#FCEBEB] text-[#A32D2D] border-[#F09595] dark:bg-[#501313] dark:text-[#F09595]',
}

// ─── History Panel ─────────────────────────────────────────────────────────────

function HistoryPanel({ history }: { history: HistoryEntry[] }) {
  const [open, setOpen] = useState(false)
  if (history.length === 0) return null

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="h-3.5 w-3.5" />
        {history.length} previous answer{history.length > 1 ? 's' : ''}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 space-y-1.5 pl-1 border-l-2 border-border ml-1.5">
          {history.map(h => {
            const mm = maturityMeta(h.maturity_level)
            const sc = scoreColor(h.score)
            return (
              <div key={h.id} className="pl-3 py-2 rounded-r-lg bg-muted/30 text-xs space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium', answerBadgeClass[h.answer])}>
                    {h.answer}
                  </span>
                  <span className="font-semibold tabular-nums" style={{ color: sc }}>{h.score}%</span>
                  <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', mm.bg, mm.color)}>
                    L{h.maturity_level} {mm.label}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(h.answered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {h.note && (
                  <p className="text-muted-foreground italic">"{h.note}"</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnswerQuestionsPage({ assessment, requirements }: Props) {
  // Build initial answers from current_answer
  const initialAnswers = useMemo(() => {
    const map: Record<number, { answer: AnswerValue | null; note: string }> = {}
    requirements.forEach(req => {
      req.questions.forEach(q => {
        map[q.id] = {
          answer: q.current_answer,
          note: q.current_note ?? '',
        }
      })
    })
    return map
  }, [requirements])

  const [answers, setAnswers] = useState<Record<number, { answer: AnswerValue | null; note: string }>>(initialAnswers)
  const [loading, setLoading] = useState(false)

  const allQuestions = useMemo(
    () => requirements.flatMap(r => r.questions),
    [requirements]
  )

  const answered = useMemo(
    () => allQuestions.filter(q => answers[q.id]?.answer).length,
    [allQuestions, answers]
  )

  const total = allQuestions.length
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0
  const allAnswered = answered === total && total > 0

  // Live score preview
  const liveScore = useMemo(() => {
    if (answered === 0) return null
    const total_score = allQuestions.reduce((s, q) => {
      const a = answers[q.id]?.answer
      return s + (a ? ANSWER_SCORE[a] : 0)
    }, 0)
    return Math.round((total_score / allQuestions.length) * 100)
  }, [answers, allQuestions, answered])

  const liveMaturity = liveScore !== null ? mapMaturityLevel(liveScore) : null

  const setAnswer = (qId: number, value: AnswerValue) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], answer: value },
    }))
  }

  const setNote = (qId: number, note: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], note },
    }))
  }

  const handleSubmit = () => {
    if (!allAnswered) return
    setLoading(true)
    const payload = allQuestions.map(q => ({
      question_id: q.id,
      answer: answers[q.id]?.answer,
      note: answers[q.id]?.note ?? '',
    }))
    router.post(`/gap-assessments/${assessment.id}/answers`, {
      answers: payload,
    }, {
      onFinish: () => setLoading(false),
    })
  }

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Gap Assessments', href: '/gap-assessment' },
        { title: assessment.name, href: `/gap-assessments/${assessment.id}` },
        { title: 'Answer Questions', href: '' },
      ]}
    >
      <Head title={`Answer Questions — ${assessment.name}`} />

      <div className="w-full max-w-3xl mx-auto px-6 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => router.visit('/gap-assessment')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {assessment.framework && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4]">
                  {assessment.framework.code}
                </span>
              )}
              <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {assessment.code}
              </span>
            </div>
            <h1 className="text-xl font-bold mt-1">{assessment.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Answer all questions — your history is preserved</p>
          </div>
        </div>

        {/* Progress card */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall progress</span>
              <span className="text-sm text-muted-foreground tabular-nums">{answered}/{total} answered</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: allAnswered ? '#1D9E75' : '#378ADD',
                }}
              />
            </div>

            {/* Live score preview */}
            {liveScore !== null && liveMaturity !== null && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Current score</p>
                  <p className="text-lg font-semibold tabular-nums" style={{ color: scoreColor(liveScore) }}>
                    {liveScore}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Maturity level</p>
                  <span className={cn('inline-flex text-xs font-semibold px-2 py-0.5 rounded-full',
                    maturityMeta(liveMaturity).bg, maturityMeta(liveMaturity).color)}>
                    L{liveMaturity} — {maturityMeta(liveMaturity).label}
                  </span>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground">Gap to L5</p>
                  <p className="text-lg font-semibold" style={{ color: 5 - liveMaturity === 0 ? '#1D9E75' : '#E24B4A' }}>
                    {5 - liveMaturity === 0 ? '✓' : `${5 - liveMaturity} levels`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions by requirement */}
        {requirements.map(req => (
          <Card key={req.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {req.code}
                </span>
                <span className="text-sm font-medium">{req.title}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {req.questions.map((q, qi) => {
                const current = answers[q.id]?.answer ?? null
                const note = answers[q.id]?.note ?? ''
                return (
                  <div key={q.id} className="space-y-3">
                    {qi > 0 && <div className="border-t" />}
                    <div className="flex items-start gap-3">
                      {/* Question number / check */}
                      <span className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5 transition-colors',
                        current
                          ? 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#085041] dark:text-[#9FE1CB]'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {current ? <CheckCircle2 className="h-3 w-3" /> : qi + 1}
                      </span>

                      <div className="flex-1 space-y-2">
                        <p className="text-sm leading-relaxed">{q.text}</p>

                        {/* YES / PARTIAL / NO */}
                        <div className="grid grid-cols-3 gap-2">
                          {ANSWER_OPTIONS.map(opt => {
                            const isSel = current === opt.value
                            return (
                              <button
                                key={opt.value}
                                onClick={() => setAnswer(q.id, opt.value)}
                                className={cn(
                                  'flex flex-col items-center gap-0.5 rounded-lg border py-2.5 text-center transition-all duration-150 text-xs',
                                  isSel
                                    ? `${opt.activeBg} ${opt.activeBorder} ${opt.activeText} font-semibold`
                                    : `border-border bg-background text-muted-foreground ${opt.hoverClass}`
                                )}
                              >
                                <span className="font-semibold">{opt.label}</span>
                                <span className="text-[10px] opacity-75 leading-tight">{opt.sub}</span>
                              </button>
                            )
                          })}
                        </div>

                        {/* Note */}
                        {current && (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <Input
                              placeholder="Add a note or justification… (optional)"
                              value={note}
                              onChange={e => setNote(q.id, e.target.value)}
                              className="text-sm h-9"
                            />
                          </div>
                        )}

                        {/* History */}
                        <HistoryPanel history={q.history} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}

        {/* Submit bar */}
        <div className="flex items-center justify-between pt-2 pb-6">
          <div className="text-sm text-muted-foreground">
            {!allAnswered
              ? `${total - answered} question${total - answered > 1 ? 's' : ''} remaining`
              : <span className="text-[#0F6E56] dark:text-[#9FE1CB] font-medium">✓ All questions answered</span>
            }
          </div>
          <Button
            disabled={!allAnswered || loading}
            onClick={handleSubmit}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {loading ? 'Saving...' : 'Save Answers'}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}