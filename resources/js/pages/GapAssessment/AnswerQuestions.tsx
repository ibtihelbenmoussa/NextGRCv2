import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, ChevronLeft, Save, Clock, Loader2,
  ChevronDown, ChevronUp, History, TrendingUp, BarChart3,
  AlertCircle, ShieldOff, BookOpen, Settings2, Zap, Check,
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

const LEVEL_OPTIONS = [
  {
    value: 0 as AnswerValue,
    label: '0',
    sub: 'Initial',
    description: 'No formal process. Ad-hoc, reactive, undocumented.',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    activeBg: 'bg-[#FCEBEB] dark:bg-[#501313]/70',
    activeBorder: 'border-[#E24B4A]',
    activeText: 'text-[#A32D2D] dark:text-[#F09595]',
    glow: 'shadow-[0_0_0_3px_rgba(226,75,74,0.20)]',
    hoverBg: 'hover:bg-[#FCEBEB]/70 hover:border-[#E24B4A]/60 dark:hover:bg-[#501313]/40',
    dot: 'bg-[#E24B4A]',
    badgeBg: 'bg-[#FCEBEB] dark:bg-[#501313]',
    badgeText: 'text-[#A32D2D] dark:text-[#F09595]',
    borderColor: 'border-[#E24B4A]/40',
    barColor: '#E24B4A',
  },
  {
    value: 1 as AnswerValue,
    label: '1',
    sub: 'Basic',
    description: 'Minimal controls exist but inconsistently applied.',
    icon: <ShieldOff className="h-3.5 w-3.5" />,
    activeBg: 'bg-[#FEF3E2] dark:bg-[#4A2800]/70',
    activeBorder: 'border-[#F97316]',
    activeText: 'text-[#9A3412] dark:text-[#FDC58A]',
    glow: 'shadow-[0_0_0_3px_rgba(249,115,22,0.20)]',
    hoverBg: 'hover:bg-[#FEF3E2]/70 hover:border-[#F97316]/60 dark:hover:bg-[#4A2800]/40',
    dot: 'bg-[#F97316]',
    badgeBg: 'bg-[#FEF3E2] dark:bg-[#4A2800]',
    badgeText: 'text-[#9A3412] dark:text-[#FDC58A]',
    borderColor: 'border-[#F97316]/40',
    barColor: '#F97316',
  },
  {
    value: 2 as AnswerValue,
    label: '2',
    sub: 'Defined',
    description: 'Processes documented and standardized across teams.',
    icon: <BookOpen className="h-3.5 w-3.5" />,
    activeBg: 'bg-[#FAEEDA] dark:bg-[#412402]/70',
    activeBorder: 'border-[#EF9F27]',
    activeText: 'text-[#854F0B] dark:text-[#FAC775]',
    glow: 'shadow-[0_0_0_3px_rgba(239,159,39,0.20)]',
    hoverBg: 'hover:bg-[#FAEEDA]/70 hover:border-[#EF9F27]/60 dark:hover:bg-[#412402]/40',
    dot: 'bg-[#EF9F27]',
    badgeBg: 'bg-[#FAEEDA] dark:bg-[#412402]',
    badgeText: 'text-[#854F0B] dark:text-[#FAC775]',
    borderColor: 'border-[#EF9F27]/40',
    barColor: '#EF9F27',
  },
  {
    value: 3 as AnswerValue,
    label: '3',
    sub: 'Managed',
    description: 'Measured, monitored and actively managed with metrics.',
    icon: <Settings2 className="h-3.5 w-3.5" />,
    activeBg: 'bg-[#EAF3DE] dark:bg-[#27500A]/70',
    activeBorder: 'border-[#65A30D]',
    activeText: 'text-[#3B6D11] dark:text-[#C0DD97]',
    glow: 'shadow-[0_0_0_3px_rgba(101,163,13,0.20)]',
    hoverBg: 'hover:bg-[#EAF3DE]/70 hover:border-[#65A30D]/60 dark:hover:bg-[#27500A]/40',
    dot: 'bg-[#65A30D]',
    badgeBg: 'bg-[#EAF3DE] dark:bg-[#27500A]',
    badgeText: 'text-[#3B6D11] dark:text-[#C0DD97]',
    borderColor: 'border-[#65A30D]/40',
    barColor: '#65A30D',
  },
  {
    value: 4 as AnswerValue,
    label: '4',
    sub: 'Optimized',
    description: 'Continuous improvement, innovation and full automation.',
    icon: <Zap className="h-3.5 w-3.5" />,
    activeBg: 'bg-[#E1F5EE] dark:bg-[#085041]/70',
    activeBorder: 'border-[#1D9E75]',
    activeText: 'text-[#0F6E56] dark:text-[#9FE1CB]',
    glow: 'shadow-[0_0_0_3px_rgba(29,158,117,0.20)]',
    hoverBg: 'hover:bg-[#E1F5EE]/70 hover:border-[#1D9E75]/60 dark:hover:bg-[#085041]/40',
    dot: 'bg-[#1D9E75]',
    badgeBg: 'bg-[#E1F5EE] dark:bg-[#085041]',
    badgeText: 'text-[#0F6E56] dark:text-[#9FE1CB]',
    borderColor: 'border-[#1D9E75]/40',
    barColor: '#1D9E75',
  },
] as const

const maturityMeta = (level: number) => {
  const map: Record<number, { label: string; color: string; bg: string; ring: string }> = {
    1: { label: 'Initial',   color: 'text-[#A32D2D] dark:text-[#F09595]', bg: 'bg-[#FCEBEB] dark:bg-[#501313]', ring: '#E24B4A' },
    2: { label: 'Basic',     color: 'text-[#9A3412] dark:text-[#FDC58A]', bg: 'bg-[#FEF3E2] dark:bg-[#4A2800]', ring: '#F97316' },
    3: { label: 'Defined',   color: 'text-[#854F0B] dark:text-[#FAC775]', bg: 'bg-[#FAEEDA] dark:bg-[#412402]', ring: '#EF9F27' },
    4: { label: 'Managed',   color: 'text-[#3B6D11] dark:text-[#C0DD97]', bg: 'bg-[#EAF3DE] dark:bg-[#27500A]', ring: '#65A30D' },
    5: { label: 'Optimized', color: 'text-[#0F6E56] dark:text-[#9FE1CB]', bg: 'bg-[#E1F5EE] dark:bg-[#085041]', ring: '#1D9E75' },
  }
  return map[level] ?? { label: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted', ring: '#888' }
}

const scoreColor = (s: number) => s < 40 ? '#E24B4A' : s < 70 ? '#EF9F27' : '#1D9E75'

const answerDotColor: Record<AnswerValue, string> = {
  0: 'bg-[#E24B4A]', 1: 'bg-[#F97316]', 2: 'bg-[#EF9F27]',
  3: 'bg-[#65A30D]',  4: 'bg-[#1D9E75]',
}

const answerLabel: Record<AnswerValue, string> = {
  0: 'L1 Initial', 1: 'L2 Basic', 2: 'L3 Defined',
  3: 'L4 Managed',  4: 'L5 Optimized',
}

const answerBadgeCls: Record<AnswerValue, string> = {
  0: 'bg-[#FCEBEB] text-[#A32D2D] border-[#E24B4A]/40 dark:bg-[#501313] dark:text-[#F09595]',
  1: 'bg-[#FEF3E2] text-[#9A3412] border-[#F97316]/40 dark:bg-[#4A2800] dark:text-[#FDC58A]',
  2: 'bg-[#FAEEDA] text-[#854F0B] border-[#EF9F27]/40 dark:bg-[#412402] dark:text-[#FAC775]',
  3: 'bg-[#EAF3DE] text-[#3B6D11] border-[#65A30D]/40 dark:bg-[#27500A] dark:text-[#C0DD97]',
  4: 'bg-[#E1F5EE] text-[#0F6E56] border-[#1D9E75]/40 dark:bg-[#085041] dark:text-[#9FE1CB]',
}

// ─── Auto-resize Textarea ─────────────────────────────────────────────────────

function AutoResizeTextarea({
  value, onChange, placeholder, className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={cn(
        'w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2',
        'text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring transition-all duration-150 min-h-[36px] leading-relaxed',
        className,
      )}
    />
  )
}

// ─── Auto-save Toast ──────────────────────────────────────────────────────────

function AutoSaveToast({ visible }: { visible: boolean }) {
  return (
    <div className={cn(
      'fixed bottom-20 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-lg',
      'bg-[#E1F5EE] dark:bg-[#085041] border border-[#1D9E75]/30',
      'text-[#0F6E56] dark:text-[#9FE1CB] text-xs font-medium shadow-lg',
      'transition-all duration-300',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
    )}>
      <Check className="h-3.5 w-3.5" />
      Saved automatically
    </div>
  )
}

// ─── Global Progress Bar ──────────────────────────────────────────────────────

function GlobalProgress({ answered, total }: { answered: number; total: number }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0
  const color = pct === 100 ? '#1D9E75' : pct >= 60 ? '#65A30D' : pct >= 30 ? '#EF9F27' : '#E24B4A'
  const remaining = total - answered

  return (
    <div className="mb-5 rounded-xl border bg-card px-4 py-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Progress</span>
        </div>
        <div className="flex items-center gap-2">
          {pct === 100 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#085041]/70 dark:text-[#9FE1CB]">
              <CheckCircle2 className="h-3.5 w-3.5" /> All done!
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              <span className="font-bold tabular-nums" style={{ color }}>{remaining}</span> remaining
            </span>
          )}
          <span className="text-sm font-bold tabular-nums" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground tabular-nums">{answered}</span>
          {' '}/ {total} questions answered
        </span>
        {answered > 0 && answered < total && (
          <span className="text-[10px]">Keep going 💪</span>
        )}
        {pct === 100 && (
          <span className="text-[10px] text-[#0F6E56] dark:text-[#9FE1CB] font-medium">Ready to save ✓</span>
        )}
      </div>
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

// ─── Maturity Level Button ────────────────────────────────────────────────────

function MaturityButton({
  opt, isSelected, onSelect,
}: {
  opt: typeof LEVEL_OPTIONS[number]
  isSelected: boolean
  onSelect: () => void
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={onSelect}
        onMouseEnter={() => setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
        className={cn(
          'relative w-full flex flex-col items-center gap-1.5 rounded-xl border py-3 px-1 text-center',
          'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isSelected
            ? `${opt.activeBg} ${opt.activeBorder} ${opt.activeText} font-semibold ${opt.glow}`
            : `border-border bg-background text-muted-foreground ${opt.hoverBg}`,
        )}
      >
        {isSelected && (
          <span className={cn(
            'absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center',
            'bg-white dark:bg-background border-2', opt.activeBorder,
          )}>
            <Check className="h-2.5 w-2.5" />
          </span>
        )}
        <span className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150',
          isSelected ? `${opt.activeBg} ${opt.activeText}` : 'bg-muted/60 text-muted-foreground',
        )}>
          {opt.icon}
        </span>
        <span className="text-xs font-bold leading-none">{opt.label}</span>
        <span className="text-[10px] opacity-70 leading-none">{opt.sub}</span>
      </button>

      {tooltipOpen && !isSelected && (
        <div className={cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-30',
          'w-44 px-2.5 py-2 rounded-lg border shadow-xl text-[11px] leading-relaxed',
          'bg-popover text-popover-foreground border-border pointer-events-none',
        )}>
          <p className="font-semibold mb-0.5">{opt.sub}</p>
          <p className="text-muted-foreground">{opt.description}</p>
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[5px] border-transparent border-t-border" />
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[3px] border-[5px] border-transparent border-t-popover" />
        </div>
      )}
    </div>
  )
}

// ─── Sticky Save Footer ───────────────────────────────────────────────────────

function StickySaveBar({
  allAnswered, saving, answered, total, onSave,
}: {
  allAnswered: boolean
  saving: boolean
  answered: number
  total: number
  onSave: () => void
}) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0
  const color = scoreColor(pct)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center gap-4">
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{answered}</span>
              <span>/{total} answered</span>
            </span>
            <span className="font-bold tabular-nums" style={{ color }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
        </div>
        <Button
          size="default"
          disabled={!allAnswered || saving}
          onClick={onSave}
          className={cn(
            'gap-2 min-w-[160px] transition-all duration-200',
            allAnswered && !saving
              ? 'bg-[#1D9E75] hover:bg-[#178260] text-white shadow-md shadow-[#1D9E75]/30'
              : '',
          )}
        >
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
            : <><Save className="h-4 w-4" />Save & View Results</>}
        </Button>
      </div>
    </div>
  )
}

// ─── Overall Score Ring ───────────────────────────────────────────────────────

function OverallScoreRing({
  score, level, answered, total,
}: {
  score: number | null
  level: number | null
  answered: number
  total: number
}) {
  const size = 80
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct = score ?? 0
  const offset = circ - (pct / 100) * circ
  const color = score !== null ? scoreColor(score) : '#888'
  const meta = level ? maturityMeta(level) : null

  return (
    <Card className="mb-3">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Ring */}
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5"
                className="stroke-muted/50" />
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {score !== null ? (
                <span className="text-sm font-bold tabular-nums leading-none" style={{ color }}>
                  {score}%
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">—</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Overall Score
            </p>
            {level && meta ? (
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                meta.bg, meta.color,
              )}>
                L{level} {meta.label}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Not answered yet</span>
            )}
            <p className="text-[10px] text-muted-foreground">
              {answered}/{total} questions
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Maturity Distribution Mini-chart ────────────────────────────────────────

function MaturityDistribution({
  answers, allQuestions,
}: {
  answers: Record<number, { answer: AnswerValue | null; note: string }>
  allQuestions: Question[]
}) {
  const counts = useMemo(() => {
    const c: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
    allQuestions.forEach(q => {
      const a = answers[q.id]?.answer
      if (a !== null && a !== undefined) c[a]++
    })
    return c
  }, [answers, allQuestions])

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  return (
    <Card className="mb-3">
      <CardContent className="p-3 space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Answer Distribution
        </p>
        <div className="space-y-1.5">
          {LEVEL_OPTIONS.map(opt => {
            const count = counts[opt.value] ?? 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            if (count === 0) return null
            return (
              <div key={opt.value} className="flex items-center gap-2">
                <span className="text-[10px] font-mono w-14 shrink-0 text-muted-foreground">
                  {opt.label} {opt.sub}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: opt.barColor }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums w-5 text-right shrink-0"
                  style={{ color: opt.barColor }}>
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Results Sidebar ──────────────────────────────────────────────────────────

function ResultsSidebar({
  requirements, answers, allQuestions, onJumpTo,
}: {
  requirements: Requirement[]
  answers: Record<number, { answer: AnswerValue | null; note: string }>
  allQuestions: Question[]
  onJumpTo: (reqId: number) => void
}) {
  // Compute overall score & level
  const answeredQs = allQuestions.filter(
    q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined
  )
  const overallScore = answeredQs.length === 0 ? null : Math.round(
    (answeredQs.reduce((s, q) => s + (answers[q.id]?.answer ?? 0), 0) / answeredQs.length / 4) * 100
  )
  const overallLevel = answeredQs.length === 0 ? null : Math.min(5,
    Math.round(answeredQs.reduce((s, q) => s + (answers[q.id]?.answer ?? 0), 0) / answeredQs.length) + 1
  )

  return (
    <div className="flex flex-col gap-0">

      {/* Overall score ring */}
      <OverallScoreRing
        score={overallScore}
        level={overallLevel}
        answered={answeredQs.length}
        total={allQuestions.length}
      />

      {/* Maturity distribution */}
      <MaturityDistribution answers={answers} allQuestions={allQuestions} />

      {/* By Requirement — jump links */}
      {requirements.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                By Requirement
              </span>
            </div>
            <div className="space-y-2">
              {requirements.map(req => {
                const qs = req.questions
                const answeredReqQs = qs.filter(
                  q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined
                )
                const done = answeredReqQs.length
                const total = qs.length
                const liveScore = done === 0 ? null : Math.round(
                  (answeredReqQs.reduce((s, q) => s + (answers[q.id]?.answer ?? 0), 0) / done / 4) * 100
                )
                const liveLevel = done === 0 ? null : Math.min(5,
                  Math.round(answeredReqQs.reduce((s, q) => s + (answers[q.id]?.answer ?? 0), 0) / done) + 1
                )
                const meta = liveLevel ? maturityMeta(liveLevel) : null
                const reqDone = done === total

                return (
                  <button
                    key={req.id}
                    onClick={() => onJumpTo(req.id)}
                    className="w-full text-left group space-y-1 rounded-lg px-2 py-1.5 -mx-2 hover:bg-muted/50 transition-colors"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {req.code}
                        </span>
                        <span className="text-xs text-foreground truncate">{req.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
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

                    {/* Progress bar */}
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${liveScore ?? 0}%`,
                          backgroundColor: liveScore !== null ? scoreColor(liveScore) : '#888',
                        }} />
                    </div>

                    {/* Footer row */}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">{done}/{total} answered</p>
                      {reqDone && (
                        <span className="text-[10px] font-medium text-[#0F6E56] dark:text-[#9FE1CB] flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Done
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
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
  const [autoSaveVisible, setAutoSaveVisible] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [openReqs, setOpenReqs] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {}
    requirements.forEach(r => { init[r.id] = true })
    return init
  })

  const [mlResult, setMlResult] = useState<MLResult | null>(null)

  // Refs for jump-to
  const reqRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const allQuestions = useMemo(() => requirements.flatMap(r => r.questions), [requirements])

  const answered = useMemo(
    () => allQuestions.filter(q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined).length,
    [allQuestions, answers]
  )
  const total = allQuestions.length
  const allAnswered = answered === total && total > 0

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      setAutoSaveVisible(true)
      setTimeout(() => setAutoSaveVisible(false), 2200)
    }, 500)
  }, [])

  useEffect(() => () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setAnswer = (qId: number, value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], answer: value } }))
    if (mlResult) setMlResult(null)
    triggerAutoSave()
  }

  const setNote = (qId: number, note: string) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], note } }))
  }

  const handleSubmit = () => {
    if (!allAnswered) return
    setSaving(true)
    const payload = allQuestions.map(q => ({
      question_id: q.id,
      answer: answers[q.id]?.answer,
      note: answers[q.id]?.note ?? '',
    }))
    router.post(
      `/gap-assessments/${assessment.id}/answers`,
      {
        answers: payload,
        ...(mlResult ? { ml_result: JSON.stringify(mlResult) } : {}),
      },
      { onFinish: () => setSaving(false) }
    )
  }

  // ── Jump to requirement ────────────────────────────────────────────────────
  const handleJumpTo = (reqId: number) => {
    // Open the collapsible if closed
    setOpenReqs(prev => ({ ...prev, [reqId]: true }))
    // Scroll after a tick to let it open
    setTimeout(() => {
      const el = reqRefs.current[reqId]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const getReqAnsweredCount = (req: Requirement) =>
    req.questions.filter(q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined).length

  const getReqScore = (req: Requirement): number | null => {
    const qs = req.questions.filter(q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined)
    if (qs.length === 0) return null
    return Math.round((qs.reduce((s, q) => s + (answers[q.id]?.answer ?? 0), 0) / qs.length / 4) * 100)
  }

  const getReqLevel = (req: Requirement): number | null => {
    const qs = req.questions.filter(q => answers[q.id]?.answer !== null && answers[q.id]?.answer !== undefined)
    if (qs.length === 0) return null
    return Math.min(5, Math.round(qs.reduce((s, q) => s + (answers[q.id]?.answer ?? 0), 0) / qs.length) + 1)
  }

  return (
    <AppLayout breadcrumbs={[
      { title: 'Gap Assessments', href: '/gap-assessment' },
      { title: 'Answer Questions', href: '' },
    ]}>
      <Head title={`Answer Questions — ${assessment.name}`} />

      <AutoSaveToast visible={autoSaveVisible} />

      <StickySaveBar
        allAnswered={allAnswered}
        saving={saving}
        answered={answered}
        total={total}
        onSave={handleSubmit}
      />

      <div className="w-full max-w-full px-6 py-5 pb-24">

        {/* ── Header ── */}
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

        {/* ── Global progress bar ── */}
        <GlobalProgress answered={answered} total={total} />

        {/* ── Split layout ── */}
        <div className="flex gap-6 items-start">

          {/* LEFT — Questions */}
          <div className="flex-1 min-w-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Select the maturity level that best describes your current implementation
            </p>

            {requirements.map(req => {
              const isOpen = openReqs[req.id]
              const answeredCount = getReqAnsweredCount(req)
              const reqTotal = req.questions.length
              const reqDone = answeredCount === reqTotal
              const reqPct = reqTotal > 0 ? Math.round((answeredCount / reqTotal) * 100) : 0
              const reqScore = getReqScore(req)
              const reqLevel = getReqLevel(req)
              const reqMeta = reqLevel ? maturityMeta(reqLevel) : null
              const ringColor = reqDone ? '#1D9E75' : scoreColor(reqPct)
              const ringCirc = 2 * Math.PI * 12

              return (
                <div
                  key={req.id}
                  ref={el => { reqRefs.current[req.id] = el }}
                >
                  <Collapsible
                    open={isOpen}
                    onOpenChange={val => setOpenReqs(prev => ({ ...prev, [req.id]: val }))}
                  >
                    <Card className="overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className={cn(
                          'flex items-center justify-between cursor-pointer select-none',
                          'px-4 py-3 transition-colors hover:bg-muted/40',
                          isOpen && 'border-b',
                        )}>
                          <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 shrink-0">
                              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                                <circle cx="16" cy="16" r="12" fill="none" strokeWidth="3"
                                  className="stroke-muted" />
                                <circle
                                  cx="16" cy="16" r="12" fill="none" strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeDasharray={ringCirc}
                                  strokeDashoffset={ringCirc * (1 - reqPct / 100)}
                                  stroke={ringColor}
                                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                {reqDone
                                  ? <CheckCircle2 className="h-3.5 w-3.5 text-[#1D9E75]" />
                                  : <span className="text-[9px] font-bold text-muted-foreground tabular-nums">{reqPct}%</span>
                                }
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {req.code}
                                </span>
                                <span className="text-sm font-medium">{req.title}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground">{answeredCount}/{reqTotal} questions</p>
                                {reqScore !== null && (
                                  <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(reqScore) }}>
                                    {reqScore}%
                                  </span>
                                )}
                                {reqLevel && reqMeta && (
                                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', reqMeta.bg, reqMeta.color)}>
                                    L{reqLevel} {reqMeta.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {reqDone && (
                              <span className="text-xs font-medium text-[#0F6E56] dark:text-[#9FE1CB] bg-[#E1F5EE] dark:bg-[#085041]/60 px-2 py-0.5 rounded-full">
                                Complete
                              </span>
                            )}
                            {isOpen
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="space-y-5 pt-4 px-4">
                          {req.questions.map((q, qi) => {
                            const current = answers[q.id]?.answer ?? null
                            const note = answers[q.id]?.note ?? ''
                            const isAnswered = current !== null && current !== undefined
                            const selectedOpt = isAnswered && current !== null ? LEVEL_OPTIONS[current] : null

                            return (
                              <div key={q.id} className="space-y-3">
                                {qi > 0 && <div className="border-t" />}
                                <div className="flex items-start gap-3">
                                  <span className={cn(
                                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5',
                                    isAnswered
                                      ? 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#085041] dark:text-[#9FE1CB]'
                                      : 'bg-muted text-muted-foreground',
                                  )}>
                                    {isAnswered ? <CheckCircle2 className="h-3 w-3" /> : qi + 1}
                                  </span>

                                  <div className="flex-1 space-y-3">
                                    <p className="text-sm leading-relaxed">{q.text}</p>

                                    <div className="grid grid-cols-5 gap-2">
                                      {LEVEL_OPTIONS.map(opt => (
                                        <MaturityButton
                                          key={opt.value}
                                          opt={opt}
                                          isSelected={current === opt.value}
                                          onSelect={() => setAnswer(q.id, opt.value)}
                                        />
                                      ))}
                                    </div>

                                    {selectedOpt && (
                                      <div className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs border',
                                        'animate-in fade-in slide-in-from-top-1 duration-200',
                                        selectedOpt.activeBg,
                                        selectedOpt.activeBorder,
                                        selectedOpt.activeText,
                                      )}>
                                        <span className="shrink-0">{selectedOpt.icon}</span>
                                        <span>
                                          <span className="font-semibold">Level {current} — {selectedOpt.sub}: </span>
                                          <span className="opacity-75">{selectedOpt.description}</span>
                                        </span>
                                      </div>
                                    )}

                                    {isAnswered && (
                                      <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                        <AutoResizeTextarea
                                          placeholder="Add a note or justification… (optional)"
                                          value={note}
                                          onChange={v => setNote(q.id, v)}
                                        />
                                      </div>
                                    )}

                                    <HistoryPanel history={q.history} />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </div>
              )
            })}
          </div>

          {/* RIGHT — Sticky sidebar */}
          <div className="w-[290px] shrink-0 sticky top-4 max-h-[calc(100vh-72px)] overflow-y-auto pb-4">
            <ResultsSidebar
              requirements={requirements}
              answers={answers}
              allQuestions={allQuestions}
              onJumpTo={handleJumpTo}
            />
          </div>

        </div>
      </div>
    </AppLayout>
  )
}