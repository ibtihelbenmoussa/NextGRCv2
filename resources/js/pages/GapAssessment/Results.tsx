import { useState, useEffect } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, Download, Target, TrendingUp,
  AlertTriangle, CheckCheck, ArrowRight, ChevronDown,
  ChevronUp, BarChart3, Shield, Loader2, Sparkles, Layers,
  User, CalendarIcon,
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
  domain: { id: number; name: string } | null
}

interface RoadmapStep {
  level: number
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

interface ActionPlan {
  id: number
  title: string
  description: string
  assigned_to: number | null
  assigned_user_name: string | null
  due_date: string | null
  status: string
  step_level: number | null
  step_index: number | null
}

interface UserOption {
  id: number
  name: string
}

interface Props {
  assessment: GapAssessment
  requirements: RequirementResult[]
  ml_result?: MLResult
  users: UserOption[]
  action_plans: ActionPlan[]
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

const LEVEL_DOT: Record<number, string> = {
  1: '#E24B4A', 2: '#F97316', 3: '#EF9F27', 4: '#65A30D', 5: '#1D9E75',
}

// ─── Group by domain ──────────────────────────────────────────────────────────

interface DomainGroup {
  id: string
  name: string
  requirements: RequirementResult[]
  avgScore: number
  avgMaturity: number
}

function groupByDomain(requirements: RequirementResult[]): DomainGroup[] {
  const map = new Map<string, RequirementResult[]>()
  requirements.forEach(req => {
    const key = req.domain ? req.domain.id.toString() : '__none__'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(req)
  })
  return Array.from(map.entries()).map(([key, reqs]) => {
    const scores     = reqs.map(r => r.score ?? 0)
    const maturities = reqs.map(r => r.maturity_level ?? 1)
    return {
      id: key,
      name: key === '__none__' ? 'No Domain' : reqs[0].domain!.name,
      requirements: reqs,
      avgScore:    Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      avgMaturity: Math.round(maturities.reduce((a, b) => a + b, 0) / maturities.length),
    }
  })
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function usePagination<T>(items: T[], perPage: number) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  useEffect(() => { setPage(1) }, [items.length])
  const paginated = items.slice((page - 1) * perPage, page * perPage)
  return { page, setPage, totalPages, paginated }
}

function PaginationBar({ page, totalPages, setPage }: {
  page: number; totalPages: number; setPage: (p: number) => void
}) {
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = []
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages)
    } else if (page >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
    }
    return pages
  }
  return (
    <div className="flex items-center justify-center gap-1 pt-3 mt-1 border-t border-border/20">
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground
          hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} className="h-7 w-7 flex items-center justify-center text-xs text-muted-foreground/50">…</span>
        ) : (
          <button key={p} onClick={() => setPage(p as number)}
            className={cn(
              'h-7 w-7 rounded-md flex items-center justify-center text-xs font-medium transition-colors',
              p === page ? 'bg-[#378ADD] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/80'
            )}>{p}</button>
        )
      )}
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground
          hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <span className="ml-2 text-[10px] text-muted-foreground/50 tabular-nums">{page} / {totalPages}</span>
    </div>
  )
}

// ─── Sparklines ───────────────────────────────────────────────────────────────

function ScoreSparkline({ score, color }: { score: number; color: string }) {
  const w = 52, h = 32
  const pts = [
    Math.max(0, score - 38), Math.max(0, score - 25), Math.max(0, score - 30),
    Math.max(0, score - 15), Math.max(0, score - 20), Math.max(0, score - 7), score,
  ]
  const xs   = pts.map((_, i) => (i / (pts.length - 1)) * w)
  const ys   = pts.map(v => h - (v / 100) * (h - 4) - 2)
  const d    = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const area = `${d} L${w},${h} L0,${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id="sg-score" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg-score)" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="2.5" fill={color} />
    </svg>
  )
}

function MaturitySparkline({ current }: { current: number }) {
  const w = 48, h = 32, bw = w / 5
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      {[1, 2, 3, 4, 5].map(l => {
        const barH = (l / 5) * (h - 4)
        const filled = l <= current
        return (
          <rect key={l} x={(l - 1) * bw + 1.5} y={h - barH - 2} width={bw - 3} height={barH} rx="2"
            fill={filled ? LEVEL_DOT[l] : 'currentColor'} fillOpacity={filled ? 0.85 : 0.1}
            className={filled ? '' : 'text-muted-foreground'} />
        )
      })}
    </svg>
  )
}

function GapSparkline({ gap }: { gap: number }) {
  const w = 48, h = 32, achieved = 5 - gap, bw = w / 5
  const color = gap === 0 ? '#1D9E75' : '#E24B4A'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      {[1, 2, 3, 4, 5].map(l => {
        const barH = (l / 5) * (h - 4)
        const filled = l <= achieved
        return (
          <rect key={l} x={(l - 1) * bw + 1.5} y={h - barH - 2} width={bw - 3} height={barH} rx="2"
            fill={filled ? color : 'currentColor'} fillOpacity={filled ? 0.8 : 0.1}
            className={filled ? '' : 'text-muted-foreground'} />
        )
      })}
    </svg>
  )
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 90 }: { score: number; size?: number }) {
  const v = isNaN(score) ? 0 : Math.min(100, Math.max(0, score))
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const off  = circ - (v / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="currentColor" strokeWidth="5" className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={scoreColor(v)} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset 0.9s ease' }} />
    </svg>
  )
}

// ─── Domain Section Header ────────────────────────────────────────────────────

function DomainSectionHeader({ group }: { group: DomainGroup }) {
  const meta   = maturityMeta(group.avgMaturity)
  const isNone = group.id === '__none__'
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border',
        isNone ? 'bg-muted/40 border-border/50 text-muted-foreground'
               : 'bg-amber-500/8 border-amber-500/20 text-amber-600 dark:text-amber-400'
      )}>
        <Layers className="h-3 w-3 shrink-0" />
        <span className="text-xs font-semibold">{group.name}</span>
      </div>
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(group.avgScore) }}>
          avg {group.avgScore}%
        </span>
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', meta.bg, meta.color)}>
          L{group.avgMaturity}
        </span>
        <span className="text-[10px] text-muted-foreground/50">
          {group.requirements.length} req{group.requirements.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="hidden sm:block flex-1 h-px bg-border/40 ml-1" />
    </div>
  )
}

// ─── Coverage Bar Chart ───────────────────────────────────────────────────────

const COVERAGE_PER_PAGE = 5

function CoverageBarChart({ requirements }: { requirements: RequirementResult[] }) {
  if (requirements.length === 0) return null
  const allGroups          = groupByDomain(requirements)
  const allReqs            = allGroups.flatMap(g => g.requirements)
  const hasMultipleDomains = allGroups.length > 1 || (allGroups.length === 1 && allGroups[0].id !== '__none__')
  const { page, setPage, totalPages, paginated } = usePagination(allReqs, COVERAGE_PER_PAGE)
  const pagedGroups = groupByDomain(paginated)
  return (
    <div className="space-y-4 w-full">
      <div className="space-y-6">
        {pagedGroups.map((group, gi) => (
          <div key={group.id}>
            {hasMultipleDomains && <DomainSectionHeader group={group} />}
            <div className={cn('space-y-5', hasMultipleDomains && 'pl-2 border-l-2 border-border/30')}>
              {group.requirements.map(req => {
                const score = Math.round(req.score ?? 0)
                const meta  = maturityMeta(req.maturity_level ?? 1)
                return (
                  <div key={req.id} className="space-y-1.5">
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
                    <div className="flex gap-0.5 h-3">
                      {[1, 2, 3, 4, 5].map(lvl => {
                        const filled  = score >= lvl * 20
                        const partial = !filled && score > (lvl - 1) * 20
                        const pct     = partial ? ((score - (lvl - 1) * 20) / 20) * 100 : 0
                        const m       = maturityMeta(lvl)
                        return (
                          <div key={lvl} className="flex-1 relative rounded-sm overflow-hidden bg-muted/50">
                            {(filled || partial) && (
                              <div className="absolute inset-y-0 left-0 rounded-sm transition-all duration-700"
                                style={{ width: filled ? '100%' : `${pct}%`, backgroundColor: m.dot, opacity: filled ? 0.9 : 0.6 }} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between px-0.5">
                      {['L1 Init', 'L2 Basic', 'L3 Def', 'L4 Mgd', 'L5 Opt'].map((l, i) => (
                        <span key={i} className="text-[9px] text-muted-foreground/50">{l}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {gi < pagedGroups.length - 1 && <div className="mt-6 border-t border-border/20" />}
          </div>
        ))}
      </div>
      <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />
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
        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
        </div>
        <span className="text-sm font-bold tabular-nums w-9 text-right" style={{ color: scoreColor(score) }}>
          {score}%
        </span>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', meta.bg, meta.color)}>
          L{req.maturity_level ?? 1}
        </span>
      </div>
    </div>
  )
}

// ─── Requirement Breakdown ────────────────────────────────────────────────────

const BREAKDOWN_PER_PAGE = 8

function RequirementBreakdown({ requirements }: { requirements: RequirementResult[] }) {
  const allGroups          = groupByDomain(requirements)
  const allReqs            = allGroups.flatMap(g => g.requirements)
  const hasMultipleDomains = allGroups.length > 1 || (allGroups.length === 1 && allGroups[0].id !== '__none__')
  const { page, setPage, totalPages, paginated } = usePagination(allReqs, BREAKDOWN_PER_PAGE)
  const pagedGroups = groupByDomain(paginated)
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {pagedGroups.map((group, gi) => (
          <div key={group.id}>
            {hasMultipleDomains && (
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold',
                  group.id === '__none__'
                    ? 'bg-muted/40 border-border/50 text-muted-foreground'
                    : 'bg-amber-500/8 border-amber-500/20 text-amber-600 dark:text-amber-400'
                )}>
                  <Layers className="h-3 w-3" />
                  {group.name}
                </div>
                <span className="text-[10px] text-muted-foreground/60">
                  {group.requirements.length} req{group.requirements.length > 1 ? 's' : ''}
                  {' · '}avg{' '}
                  <span className="font-semibold tabular-nums" style={{ color: scoreColor(group.avgScore) }}>
                    {group.avgScore}%
                  </span>
                </span>
              </div>
            )}
            <div className={cn(hasMultipleDomains && 'pl-2 border-l-2 border-border/30')}>
              {group.requirements.map(req => (
                <RequirementRow key={req.id} req={req} />
              ))}
            </div>
            {gi < pagedGroups.length - 1 && <div className="mt-2 border-t border-border/10" />}
          </div>
        ))}
      </div>
      <PaginationBar page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  )
}

// ─── DatePicker (shadcn Popover + Calendar) ───────────────────────────────────

function DatePicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (val: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 gap-1.5 px-2.5 text-xs font-normal border-border/50',
            'hover:border-border transition-colors min-w-[110px] justify-start',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="h-3 w-3 shrink-0" />
          {value ? format(parseISO(value), 'MMM d, yyyy') : 'Pick date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, 'yyyy-MM-dd') : null)
            setOpen(false)
          }}
          initialFocus
        />
        {value && (
          <div className="border-t border-border/50 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { onChange(null); setOpen(false) }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ─── UserSelect (shadcn Select) ───────────────────────────────────────────────

function UserSelect({
  value,
  users,
  onChange,
}: {
  value: number | null
  users: UserOption[]
  onChange: (val: number | null) => void
}) {
  return (
    <Select
      value={value != null ? String(value) : '__none__'}
      onValueChange={(v) => onChange(v === '__none__' ? null : Number(v))}
    >
      <SelectTrigger
        className={cn(
          'h-7 flex-1 min-w-0 text-xs border-border/50',
          'hover:border-border transition-colors',
          '[&>svg]:text-muted-foreground',
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <User className="h-3 w-3 text-muted-foreground shrink-0" />
          <SelectValue placeholder="— Unassigned —" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__" className="text-xs text-muted-foreground italic">
          — Unassigned —
        </SelectItem>
        {users.map((u) => (
          <SelectItem key={u.id} value={String(u.id)} className="text-xs">
            {u.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ─── Action Row ───────────────────────────────────────────────────────────────

interface ActionRowProps {
  actionText: string
  index: number
  isCurrent: boolean
  plan: ActionPlan | undefined
  users: UserOption[]
  onUpdate: (id: number, field: string, value: string | number | null) => void
  saving: boolean
}

function ActionRow({ actionText, index, isCurrent, plan, users, onUpdate, saving }: ActionRowProps) {
  return (
    <div className={cn(
      'rounded-lg border border-border/30 p-3 space-y-2.5 transition-opacity',
      saving && 'opacity-60',
    )}>
      {/* Action text */}
      <div className="flex items-start gap-2.5">
        <span className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
          isCurrent
            ? 'bg-[#378ADD]/15 text-[#185FA5] dark:text-[#85B7EB]'
            : 'bg-[#EF9F27]/15 text-[#854F0B] dark:text-[#FAC775]',
        )}>
          {index + 1}
        </span>
        <p className="text-sm text-foreground leading-relaxed flex-1">{actionText}</p>
      </div>

      {/* Controls */}
      {plan && (
        <div className="flex items-center gap-2 pl-7 flex-wrap">

          {/* User select — shadcn */}
          <div className="flex-1 min-w-[140px]">
            <UserSelect
              value={plan.assigned_to}
              users={users}
              onChange={(val) => onUpdate(plan.id, 'assigned_to', val)}
            />
          </div>

          {/* Date picker — shadcn Calendar */}
          <DatePicker
            value={plan.due_date}
            onChange={(val) => onUpdate(plan.id, 'due_date', val)}
          />

          {/* Status badge (read-only display) */}
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
            plan.status === 'open'        && 'bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C]/40 dark:text-[#B5D4F4]',
            plan.status === 'in_progress' && 'bg-[#FAEEDA] text-[#854F0B] dark:bg-[#412402]/40 dark:text-[#FAC775]',
            plan.status === 'closed'      && 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#085041]/40 dark:text-[#9FE1CB]',
          )}>
            {plan.status === 'open' ? 'Open' : plan.status === 'in_progress' ? 'In Progress' : 'Closed'}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Roadmap Step Card ────────────────────────────────────────────────────────

interface RoadmapStepCardProps {
  step: RoadmapStep
  plans: ActionPlan[]
  users: UserOption[]
  onUpdate: (id: number, field: string, value: string | number | null) => void
  savingIds: Record<number, boolean>
}

function RoadmapStepCard({ step, plans, users, onUpdate, savingIds }: RoadmapStepCardProps) {
  const [open, setOpen] = useState(step.is_current || step.is_next)

  const isCompleted = step.status === 'completed'
  const isCurrent   = step.is_current
  const isNext      = step.is_next && !step.is_current
  const isTodo      = !isCompleted && !isCurrent && !isNext

  const showSubtitle = step.subtitle
    && !(isCompleted && step.subtitle.toLowerCase().includes('not implemented'))

  const plansForStep = plans.filter(p => p.step_level === step.level)

  return (
    <div className={cn(
      'rounded-xl border transition-all overflow-hidden',
      isCompleted && 'border-[#1D9E75]/25 bg-[#F0FBF6]/40 dark:bg-[#0A2218]/40 opacity-65',
      isCurrent   && 'border-[#378ADD]/40 bg-white dark:bg-[#0F1E2E] shadow-sm',
      isNext      && 'border-[#EF9F27]/40 bg-[#FFFBF0] dark:bg-[#1E1500] shadow-sm',
      isTodo      && 'border-border/25 bg-muted/10 opacity-70',
    )}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => (isCurrent || isNext) && setOpen(v => !v)}
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: LEVEL_DOT[step.level] ?? '#888' }} />
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
            ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (isCurrent || isNext) && step.actions.length > 0 && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/20 pt-3">
          {step.actions.map((action, i) => {
            const plan = plansForStep.find(p => p.step_index === i)
            return (
              <ActionRow
                key={i}
                actionText={action}
                index={i}
                isCurrent={isCurrent}
                plan={plan}
                users={users}
                onUpdate={onUpdate}
                saving={plan ? (savingIds[plan.id] ?? false) : false}
              />
            )
          })}
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
  users,
  action_plans: initialActionPlans,
}: Props) {
  const overall_score    = Math.round(assessment.overall_score ?? 0)
  const overall_maturity = assessment.overall_maturity_level ?? 1

  const [mlResult, setMlResult]       = useState<MLResult | undefined>(initialMlResult)
  const [mlLoading, setMlLoading]     = useState(false)
  const [mlError, setMlError]         = useState<string | null>(null)
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>(initialActionPlans)
  const [savingIds, setSavingIds]     = useState<Record<number, boolean>>({})

  const meta  = maturityMeta(overall_maturity)
  const gap   = 5 - overall_maturity
  const hasML = !!mlResult?.roadmap

  // ── Update action plan ────────────────────────────────────────────────────
  const updateActionPlan = async (id: number, field: string, value: string | number | null) => {
    setSavingIds(s => ({ ...s, [id]: true }))
    try {
      await axios.patch(`/action-plans/${id}`, { [field]: value })
      setActionPlans(prev => prev.map(p =>
        p.id === id
          ? {
              ...p,
              [field]: value,
              assigned_user_name: field === 'assigned_to'
                ? (users.find(u => u.id === value)?.name ?? null)
                : p.assigned_user_name,
            }
          : p
      ))
    } catch {
      // silently ignore
    } finally {
      setSavingIds(s => ({ ...s, [id]: false }))
    }
  }

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

      const { data: fresh } = await axios.get(`/gap-assessments/${assessment.id}/action-plans`)
      setActionPlans(fresh)
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

  return (
    <AppLayout breadcrumbs={[
      { title: 'Gap Assessments', href: '/gap-assessment' },
      { title: 'Results', href: '' },
    ]}>
      <Head title={`Results — ${assessment.name}`} />

      <div className="w-full px-8 py-8 space-y-5">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="default" className="h-9 w-9 shrink-0 p-0"
            onClick={() => router.visit('/gap-assessment')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {assessment.framework && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4]">
                  {assessment.framework.code}
                </span>
              )}
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {assessment.code}
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-1.5 leading-tight">{assessment.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Assessment Results</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="w-[3px] shrink-0" style={{ backgroundColor: scoreColor(overall_score) }} />
                <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <ScoreRing score={overall_score} size={50} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-extrabold tabular-nums" style={{ color: scoreColor(overall_score) }}>
                        {overall_score}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 leading-none">Overall Score</p>
                    <p className="text-[22px] font-extrabold tabular-nums leading-tight mt-0.5" style={{ color: scoreColor(overall_score) }}>
                      {overall_score}%
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 leading-none mt-0.5">
                      {overall_score < 40 ? 'Needs improvement' : overall_score < 70 ? 'Progressing' : 'Good standing'}
                    </p>
                  </div>
                  <ScoreSparkline score={overall_score} color={scoreColor(overall_score)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="w-[3px] shrink-0" style={{ backgroundColor: meta.dot }} />
                <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
                    <Shield className={cn('h-4 w-4', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 leading-none">Maturity Level</p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className={cn('text-[22px] font-extrabold leading-tight', meta.color)}>L{overall_maturity}</span>
                      <span className={cn('text-[11px] font-bold', meta.color)}>{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-[3px] mt-1.5">
                      {[1, 2, 3, 4, 5].map(l => (
                        <div key={l} className="h-[3px] flex-1 rounded-full transition-all duration-500"
                          style={l <= overall_maturity ? { backgroundColor: LEVEL_DOT[l] } : { backgroundColor: 'currentColor', opacity: 0.12 }} />
                      ))}
                    </div>
                  </div>
                  <MaturitySparkline current={overall_maturity} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="w-[3px] shrink-0" style={{ backgroundColor: gap === 0 ? '#1D9E75' : '#E24B4A' }} />
                <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    gap === 0 ? 'bg-[#E1F5EE] dark:bg-[#085041]' : 'bg-[#FCEBEB] dark:bg-[#501313]')}>
                    <TrendingUp className={cn('h-4 w-4',
                      gap === 0 ? 'text-[#0F6E56] dark:text-[#9FE1CB]' : 'text-[#A32D2D] dark:text-[#F09595]')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 leading-none">Gap to L5 Optimized</p>
                    <p className="text-[22px] font-extrabold leading-tight mt-0.5" style={{ color: gap === 0 ? '#1D9E75' : '#E24B4A' }}>
                      {gap === 0 ? '✓ Achieved' : `${gap} level${gap > 1 ? 's' : ''}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 leading-none mt-0.5">
                      {gap === 0 ? 'Maximum maturity reached' : `${gap * 20}% improvement needed`}
                    </p>
                  </div>
                  <GapSparkline gap={gap} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Coverage + Breakdown ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 items-start">
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Coverage by Requirement
                </CardTitle>
                <span className="text-[10px] text-muted-foreground/50">
                  {requirements.length} req{requirements.length !== 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-2 pb-5 px-5">
              <CoverageBarChart requirements={requirements} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Requirement Breakdown
                </CardTitle>
                <span className="text-[10px] text-muted-foreground/50">scores &amp; maturity</span>
              </div>
            </CardHeader>
            <CardContent className="pt-2 px-5">
              <RequirementBreakdown requirements={requirements} />
            </CardContent>
          </Card>
        </div>

        {/* ── AI Action Plan ──────────────────────────────────────────── */}
        {hasML && mlResult ? (
          <Card className="border-2 border-[#378ADD]/25 bg-[#F0F7FF]/50 dark:bg-[#0C1829]/50 overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-6 border-b border-[#378ADD]/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#378ADD]/15 flex items-center justify-center">
                  <Target className="h-5 w-5 text-[#378ADD]" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-bold">AI Action Plan</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Generated based on your assessment answers</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm"
                    onClick={() => router.visit('/action-plans')}
                    className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
                    <ArrowRight className="h-3.5 w-3.5" />
                    View All Plans
                  </Button>
                  <Button variant="ghost" size="sm" onClick={generateActionPlan}
                    disabled={mlLoading} className="gap-1.5 h-8 text-xs">
                    {mlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5 px-6 space-y-5">
              {mlResult.summary && (
                <div className="p-4 rounded-xl bg-white/70 dark:bg-white/5 border border-[#378ADD]/20">
                  <p className="text-sm leading-relaxed text-foreground">{mlResult.summary}</p>
                </div>
              )}

              {mlResult.current_issues && mlResult.current_issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Status</h4>
                  <div className="space-y-2">
                    {mlResult.current_issues.map((issue, i) => {
                      const l = issue.toLowerCase()
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
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Improvement Roadmap</h4>
                <div className="space-y-2">
                  {mlResult.roadmap!.map(step => (
                    <RoadmapStepCard
                      key={step.level}
                      step={step}
                      plans={actionPlans}
                      users={users}
                      onUpdate={updateActionPlan}
                      savingIds={savingIds}
                    />
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
                <p className="text-sm font-medium">No Action Plan Generated</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate a personalized AI-powered action plan based on your answers
                </p>
                {mlError && (
                  <p className="text-xs text-[#A32D2D] dark:text-[#F09595] mt-2">{mlError}</p>
                )}
              </div>
              <Button onClick={generateActionPlan} disabled={mlLoading}
                className="gap-2 bg-[#378ADD] hover:bg-[#2868B0] text-white h-8 text-xs">
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