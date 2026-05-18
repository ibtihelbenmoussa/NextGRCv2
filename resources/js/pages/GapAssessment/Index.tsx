import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus, Search, Calendar, FileText, X,
  ClipboardList, HelpCircle, CheckCircle2, Clock,
  AlertCircle, BarChart3,
  MoreHorizontal, Eye, Pencil, Trash2,
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  Download, ListFilter, CircleDot, ShieldCheck,
  GripVertical, Tag, RefreshCw, Building2,
  SlidersHorizontal, Check,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Card, CardContent } from '@/components/ui/card'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Framework {
  id: number
  code: string
  name: string
}

interface Requirement {
  id: number
  code: string
  title: string
  questions_count: number
}

interface GapAssessment {
  id: number
  code: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  framework: Framework
  requirements: Requirement[]
  requirements_count: number
  questions_count: number
  answers_count: number
}

interface Props {
  assessments: GapAssessment[]
}

type SortCol = 'code' | 'name' | 'start_date' | 'requirements_count' | 'questions_count' | 'status'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getStatus(item: GapAssessment): 'completed' | 'inprogress' | 'upcoming' | 'overdue' {
  if (item.answers_count === item.questions_count && item.questions_count > 0) return 'completed'
  const now = new Date()
  const end = item.end_date ? new Date(item.end_date) : null
  const start = item.start_date ? new Date(item.start_date) : null
  if (end && end < now && item.answers_count < item.questions_count) return 'overdue'
  if (start && start > now) return 'upcoming'
  return 'inprogress'
}

// ─────────────────────────────────────────────
// Framework color palette
// ─────────────────────────────────────────────

const FRAMEWORK_COLORS = [
  { bg: 'bg-[#E6F1FB]', text: 'text-[#0C447C]', darkBg: 'dark:bg-[#0C447C]', darkText: 'dark:text-[#B5D4F4]', dot: '#2563eb' },
  { bg: 'bg-[#F0E9FB]', text: 'text-[#3B0764]', darkBg: 'dark:bg-[#3B0764]', darkText: 'dark:text-[#D8B4FE]', dot: '#9333ea' },
  { bg: 'bg-[#FEF3C7]', text: 'text-[#78350F]', darkBg: 'dark:bg-[#78350F]', darkText: 'dark:text-[#FDE68A]', dot: '#d97706' },
  { bg: 'bg-[#FCE7F3]', text: 'text-[#831843]', darkBg: 'dark:bg-[#831843]', darkText: 'dark:text-[#FBCFE8]', dot: '#db2777' },
  { bg: 'bg-[#ECFDF5]', text: 'text-[#064E3B]', darkBg: 'dark:bg-[#064E3B]', darkText: 'dark:text-[#A7F3D0]', dot: '#10b981' },
  { bg: 'bg-[#FFF7ED]', text: 'text-[#7C2D12]', darkBg: 'dark:bg-[#7C2D12]', darkText: 'dark:text-[#FED7AA]', dot: '#ea580c' },
  { bg: 'bg-[#F0FDF4]', text: 'text-[#14532D]', darkBg: 'dark:bg-[#14532D]', darkText: 'dark:text-[#BBF7D0]', dot: '#16a34a' },
  { bg: 'bg-[#FDF2F8]', text: 'text-[#701A75]', darkBg: 'dark:bg-[#701A75]', darkText: 'dark:text-[#F5D0FE]', dot: '#c026d3' },
]

function FrameworkPill({ code, colorIndex }: { code: string; colorIndex: number }) {
  const c = FRAMEWORK_COLORS[colorIndex % FRAMEWORK_COLORS.length]
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md tracking-wide',
      c.bg, c.text, c.darkBg, c.darkText,
    )}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.dot }} />
      {code}
    </span>
  )
}

// ─────────────────────────────────────────────
// Status styles
// ─────────────────────────────────────────────

const statusStyles: Record<string, { pill: string; dot: string }> = {
  completed: {
    pill: 'bg-[#EAF3DE] text-[#27500A] dark:bg-[#27500A] dark:text-[#C0DD97]',
    dot: 'bg-[#3B6D11] dark:bg-[#97C459]',
  },
  inprogress: {
    pill: 'bg-[#FAEEDA] text-[#412402] dark:bg-[#412402] dark:text-[#FAC775]',
    dot: 'bg-[#854F0B] dark:bg-[#EF9F27]',
  },
  upcoming: {
    pill: 'bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4]',
    dot: 'bg-[#2563eb] dark:bg-[#60A5FA]',
  },
  overdue: {
    pill: 'bg-[#FCEBEB] text-[#501313] dark:bg-[#501313] dark:text-[#F7C1C1]',
    dot: 'bg-[#A32D2D] dark:bg-[#E24B4A]',
  },
}

const fallbackStyle = {
  pill: 'bg-[#F1EFE8] text-[#444441] dark:bg-[#444441] dark:text-[#D3D1C7]',
  dot: 'bg-[#888780]',
}

function StatusPill({ value }: { value: string }) {
  const s = statusStyles[value] ?? fallbackStyle
  const labels: Record<string, string> = {
    completed: 'Completed',
    inprogress: 'In Progress',
    upcoming: 'Upcoming',
    overdue: 'Overdue',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', s.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      {labels[value] ?? value}
    </span>
  )
}

// ─────────────────────────────────────────────
// Animated counter hook
// ─────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────

function KpiCard({
  label, value, sub, fillPercent, fillColor, icon, valueColor, delay = 0,
}: {
  label: string
  value: number | string
  sub?: string
  fillPercent?: number
  fillColor: string
  icon: React.ReactNode
  valueColor?: string
  delay?: number
}) {
  const numericValue = typeof value === 'number' ? value : 0
  const [mounted, setMounted] = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  const animatedValue = useCountUp(mounted ? numericValue : 0, 900)
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), delay)
    const t2 = setTimeout(() => setBarWidth(fillPercent ?? 0), delay + 120)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [delay, fillPercent])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    setTilt({ x: dy * -10, y: dx * 10 })
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const handleMouseLeave = () => { setTilt({ x: 0, y: 0 }); setIsHovered(false) }

  const transformValue = isHovered
    ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04) translateY(-3px)`
    : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)'

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformValue,
        transition: isHovered
          ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out, opacity 0.5s ease-out'
          : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease-out, opacity 0.5s ease-out',
        boxShadow: isHovered
          ? `0 12px 32px -8px ${fillColor}40, 0 4px 16px -4px ${fillColor}25`
          : '0 1px 3px rgba(0,0,0,0.12)',
        opacity: mounted ? 1 : 0,
      }}
      className="bg-muted/40 rounded-lg p-4 flex flex-col gap-1.5 cursor-default relative overflow-hidden"
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{ background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${fillColor}18 0%, transparent 65%)` }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-lg transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${fillColor}80, transparent)`, opacity: isHovered ? 1 : 0 }}
      />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs text-muted-foreground font-mono tracking-wide uppercase">{label}</span>
        <span className={cn('transition-all duration-300', isHovered ? 'text-foreground/80 scale-110' : 'text-muted-foreground/60')}>
          {icon}
        </span>
      </div>
      <div className={cn('text-2xl font-semibold leading-none tabular-nums relative z-10 transition-transform duration-200', valueColor, isHovered && 'scale-105 origin-left')}>
        {typeof value === 'number' ? animatedValue : value}
      </div>
      {sub && (
        <div
          className={cn('text-xs font-mono relative z-10 transition-opacity duration-500', mounted ? 'opacity-100' : 'opacity-0')}
          style={{ color: fillColor, transitionDelay: `${delay + 350}ms` }}
        >
          {sub}
        </div>
      )}
      <div className="h-0.5 rounded-full bg-border mt-1 overflow-hidden relative z-10">
        <div
          className="h-0.5 rounded-full"
          style={{
            width: `${Math.min(barWidth, 100)}%`,
            backgroundColor: fillColor,
            transition: isHovered
              ? 'width 0.3s ease-out, filter 0.2s ease-out'
              : `width 900ms cubic-bezier(0.4, 0, 0.2, 1) ${delay + 150}ms`,
            filter: isHovered ? `drop-shadow(0 0 3px ${fillColor})` : 'none',
          }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Filters Popover (Status + Framework — same logic as Requirements)
// ─────────────────────────────────────────────

function FiltersPopover({
  frameworks,
  frameworkColorMap,
  statusFilter,
  frameworkFilter,
  onStatusChange,
  onFrameworkChange,
  activeCount,
}: {
  frameworks: Framework[]
  frameworkColorMap: Record<number, number>
  statusFilter: string
  frameworkFilter: number[]
  onStatusChange: (v: string) => void
  onFrameworkChange: (ids: number[]) => void
  activeCount: number
}) {
  const [open, setOpen] = useState(false)

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'inprogress', label: 'In Progress' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'overdue', label: 'Overdue' },
  ]

  const toggleFramework = (id: number) => {
    onFrameworkChange(
      frameworkFilter.includes(id)
        ? frameworkFilter.filter(x => x !== id)
        : [...frameworkFilter, id]
    )
  }

  const clearAll = () => {
    onStatusChange('all')
    onFrameworkChange([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2 text-sm font-medium',
            activeCount > 0 && 'border-primary/50 bg-primary/5 text-primary hover:bg-primary/10',
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Filters</span>
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="px-3 py-3 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Status</p>
          <div className="space-y-0.5">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors',
                  statusFilter === opt.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted/60 text-foreground/80',
                )}
              >
                <span className="flex items-center gap-2">
                  {opt.value !== 'all' && (
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      opt.value === 'completed' ? 'bg-[#3B6D11] dark:bg-[#97C459]' :
                        opt.value === 'inprogress' ? 'bg-[#854F0B] dark:bg-[#EF9F27]' :
                          opt.value === 'upcoming' ? 'bg-[#2563eb]' : 'bg-[#A32D2D] dark:bg-[#E24B4A]'
                    )} />
                  )}
                  {opt.label}
                </span>
                {statusFilter === opt.value && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Framework filter */}
        {frameworks.length > 0 && (
          <div className="px-3 py-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Framework</p>
            <div className="space-y-0.5">
              {frameworks.map((fw) => {
                const colorIndex = frameworkColorMap[fw.id] ?? 0
                const c = FRAMEWORK_COLORS[colorIndex % FRAMEWORK_COLORS.length]
                const isActive = frameworkFilter.includes(fw.id)
                return (
                  <button
                    key={fw.id}
                    onClick={() => toggleFramework(fw.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors',
                      isActive ? 'bg-muted/60' : 'hover:bg-muted/40',
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded tracking-wide shrink-0',
                          c.bg, c.text, c.darkBg, c.darkText,
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
                        {fw.code}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{fw.name}</span>
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ─────────────────────────────────────────────
// Sort icon
// ─────────────────────────────────────────────

function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: 'asc' | 'desc' }) {
  if (sortCol !== col) return <ChevronsUpDown size={13} className="text-muted-foreground/40" />
  return sortDir === 'asc'
    ? <ChevronUp size={13} className="text-primary" />
    : <ChevronDown size={13} className="text-primary" />
}

// ─────────────────────────────────────────────
// Drawer
// ─────────────────────────────────────────────

function AssessmentDrawer({ item, onClose, frameworkColorMap }: {
  item: GapAssessment
  onClose: () => void
  frameworkColorMap: Record<number, number>
}) {
  const status = getStatus(item)
  const pct = item.questions_count > 0
    ? Math.round((item.answers_count / item.questions_count) * 100) : 0

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-background border-l border-border z-50 flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground">{item.code}</p>
              <h2 className="text-lg font-semibold mt-1">{item.name}</h2>
              <div className="mt-2 flex items-center gap-2">
                <StatusPill value={status} />
                <FrameworkPill code={item.framework.code} colorIndex={frameworkColorMap[item.framework.id] ?? 0} />
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            {[
              { val: item.requirements_count, lbl: 'Requirements', cls: 'text-blue-400' },
              { val: item.questions_count, lbl: 'Questions', cls: 'text-purple-400' },
              {
                val: status === 'completed' ? '✓' : status === 'upcoming' ? '—' : `${pct}%`,
                lbl: status === 'completed' ? 'Completed' : status === 'overdue' ? 'Overdue' : 'Progress',
                cls: status === 'completed' ? 'text-[#3B6D11] dark:text-[#97C459]' : status === 'overdue' ? 'text-[#A32D2D] dark:text-[#E24B4A]' : status === 'upcoming' ? 'text-[#0C447C] dark:text-[#B5D4F4]' : 'text-[#854F0B] dark:text-[#EF9F27]',
              },
            ].map(({ val, lbl, cls }) => (
              <div key={lbl} className="p-4 text-center">
                <p className={cn('text-2xl font-bold font-mono', cls)}>{val}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wide">{lbl}</p>
              </div>
            ))}
          </div>

          <div className="p-5 space-y-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Framework</p>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <FrameworkPill code={item.framework.code} colorIndex={frameworkColorMap[item.framework.id] ?? 0} />
                <span className="text-sm text-muted-foreground">{item.framework.name}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Period</p>
              <div className="flex items-center gap-2 text-sm font-mono text-foreground">
                <Calendar size={13} className="text-muted-foreground" />
                <span>{item.start_date ?? '—'}</span>
                <span className="text-muted-foreground">→</span>
                <span>{item.end_date ?? '—'}</span>
              </div>
            </div>
            {item.description && (
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Requirements ({item.requirements_count})
              </p>
              <div className="space-y-2">
                {item.requirements?.length ? item.requirements.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4] border border-blue-500/20 shrink-0">
                      {r.code}
                    </span>
                    <span className="text-sm flex-1 min-w-0 truncate">{r.title}</span>
                    <span className="text-xs font-mono text-muted-foreground shrink-0 flex items-center gap-1">
                      <HelpCircle size={11} />{r.questions_count}Q
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No requirements attached</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => router.visit(`/gap-assessments/${item.id}`)}>
            <FileText size={15} /> Details
          </Button>
          <Button className="flex-1 gap-2" onClick={() => router.visit(`/gap-assessments/${item.id}/answer`)}>
            <ClipboardList size={15} /> Answer Questions
          </Button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Framework accordion with table
// ─────────────────────────────────────────────

function FrameworkGroup({
  framework,
  rows,
  colorIndex,
  onSelect,
  onDeleteClick,
  globalSearch,
}: {
  framework: Framework
  rows: GapAssessment[]
  colorIndex: number
  onSelect: (a: GapAssessment) => void
  onDeleteClick: (a: GapAssessment) => void
  globalSearch: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('code')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [rpp, setRpp] = useState(10)

  useEffect(() => {
    if (globalSearch.trim()) setOpen(true)
    else setOpen(false)
  }, [globalSearch])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let res = rows.filter(a =>
      !q ||
      a.code.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q) ||
      a.framework.code.toLowerCase().includes(q) ||
      a.framework.name.toLowerCase().includes(q)
    )
    res = [...res].sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      if (sortCol === 'code') { av = a.code; bv = b.code }
      else if (sortCol === 'name') { av = a.name; bv = b.name }
      else if (sortCol === 'start_date') { av = a.start_date ?? ''; bv = b.start_date ?? '' }
      else if (sortCol === 'requirements_count') { av = a.requirements_count; bv = b.requirements_count }
      else if (sortCol === 'questions_count') { av = a.questions_count; bv = b.questions_count }
      else if (sortCol === 'status') { av = getStatus(a); bv = getStatus(b) }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return res
  }, [rows, search, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rpp))
  const paginated = filtered.slice((page - 1) * rpp, page * rpp)

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setPage(1)
  }

  const fw_completed = rows.filter(a => getStatus(a) === 'completed').length
  const fw_inprogress = rows.filter(a => getStatus(a) === 'inprogress').length
  const fw_overdue = rows.filter(a => getStatus(a) === 'overdue').length

  const thCls = "text-xs font-mono uppercase tracking-widest text-muted-foreground"

  const handleExportGroup = async () => {
    try {
      const params = new URLSearchParams()
      params.set('framework_ids', String(framework.id))
      if (search) params.set('search', search)
      const response = await fetch(`/gap-assessments/export?${params.toString()}`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `gap-assessments-${framework.code}-${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">

      {/* Accordion header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <ChevronRight
          size={16}
          className={cn('text-muted-foreground transition-transform duration-200 shrink-0', open && 'rotate-90')}
        />
        <FrameworkPill code={framework.code} colorIndex={colorIndex} />
        <span className="text-sm font-medium">{framework.name}</span>

        <div className="ml-auto flex items-center gap-3">
          {fw_completed > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-mono text-[#3B6D11] dark:text-[#97C459]">
              <CheckCircle2 size={11} /> {fw_completed}
            </span>
          )}
          {fw_inprogress > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-mono text-[#854F0B] dark:text-[#EF9F27]">
              <Clock size={11} /> {fw_inprogress}
            </span>
          )}
          {fw_overdue > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-mono text-[#A32D2D] dark:text-[#E24B4A]">
              <AlertCircle size={11} /> {fw_overdue}
            </span>
          )}
          <span className="text-xs font-mono text-muted-foreground border-l border-border pl-3">
            {rows.length} assessment{rows.length !== 1 ? 's' : ''}
          </span>
        </div>
      </button>

      {/* Accordion body */}
      {open && (
        <div className="border-t border-border">

          {/* Inner toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/10 border-b border-border flex-wrap">
            <div className="relative max-w-xs flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search in group…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-8 h-8 text-xs"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setPage(1) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <span className="text-xs font-mono text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>

            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleExportGroup}
              >
                <Download size={12} />
                Export
              </Button>
            </div>
          </div>

          {/* TABLE VIEW */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/5">
                  {(
                    [
                      { col: 'code', label: 'Code', w: 'w-[120px]', align: 'text-left' },
                      { col: 'name', label: 'Name', w: '', align: 'text-left' },
                      { col: 'start_date', label: 'Period', w: 'w-[160px]', align: 'text-left' },
                      { col: 'requirements_count', label: 'Req.', w: 'w-[65px]', align: 'text-center' },
                      { col: 'questions_count', label: 'Q.', w: 'w-[55px]', align: 'text-center' },
                      { col: 'status', label: 'Status', w: 'w-[140px]', align: 'text-left' },
                    ] as { col: SortCol; label: string; w: string; align: string }[]
                  ).map(({ col, label, w, align }) => (
                    <th key={col} className={cn('px-4 py-2.5', align, w)}>
                      <button
                        className={cn(thCls, 'flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer')}
                        onClick={() => handleSort(col)}
                      >
                        {label} <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-2.5 w-[40px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                      No assessments match your search
                    </td>
                  </tr>
                ) : paginated.map(a => {
                  const progress = a.questions_count > 0
                    ? Math.round((a.answers_count / a.questions_count) * 100) : 0
                  const st = getStatus(a)
                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer group"
                      onClick={() => onSelect(a)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">{a.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[260px]">{a.name}</p>
                        {a.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[260px] mt-0.5">{a.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                          <Calendar size={11} />
                          <span>{a.start_date ?? '—'}</span>
                          {a.end_date && <><span>→</span><span>{a.end_date}</span></>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-mono font-semibold">{a.requirements_count}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-mono font-semibold">{a.questions_count}</span>
                          {st !== 'upcoming' && a.questions_count > 0 && (
                            <div className="w-10 h-0.5 rounded-full bg-border overflow-hidden">
                              <div
                                className="h-0.5 rounded-full transition-all duration-500"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: st === 'completed' ? '#639922' : st === 'overdue' ? '#e24b4a' : '#ba7517',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill value={st} />
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onSelect(a)}>
                              <Eye className="mr-2 h-4 w-4" /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.visit(`/gap-assessments/${a.id}`)}>
                              <FileText className="mr-2 h-4 w-4" /> Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.visit(`/gap-assessments/${a.id}/answer`)}>
                              <ClipboardList className="mr-2 h-4 w-4" /> Answer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.visit(`/gap-assessments/${a.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10"
                              onClick={() => onDeleteClick(a)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/5 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows per page</span>
              <Select value={String(rpp)} onValueChange={v => { setRpp(Number(v)); setPage(1) }}>
                <SelectTrigger className="h-7 w-[65px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 30].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-xs font-mono text-muted-foreground">
              {filtered.length === 0
                ? 'No results'
                : `${(page - 1) * rpp + 1}–${Math.min(page * rpp, filtered.length)} of ${filtered.length}`}
            </span>

            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(1)} disabled={page === 1}>
                <ChevronsLeft size={13} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={13} />
              </Button>
              <span className="px-2 text-xs font-mono text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={13} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                <ChevronsRight size={13} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileText size={24} className="text-muted-foreground" />
      </div>
      <p className="text-base font-semibold">No gap assessments yet</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Create your first assessment to start evaluating compliance
      </p>
      <Button onClick={() => router.visit('/gap-assessment/create')}>
        <Plus size={16} className="mr-1.5" /> New Assessment
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function GapAssessmentIndex({ assessments }: Props) {
  const [globalSearch, setGlobalSearch] = useState('')
  const [selected, setSelected] = useState<GapAssessment | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState<GapAssessment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [frameworkFilter, setFrameworkFilter] = useState<number[]>([])
  const [exportLoading, setExportLoading] = useState(false)
  const [globalPage, setGlobalPage] = useState(1)
const [globalRpp, setGlobalRpp] = useState(3)  
  const allFrameworks = useMemo(() => {
    const seen = new Set<number>()
    const list: Framework[] = []
    assessments.forEach(a => {
      if (!seen.has(a.framework.id)) {
        seen.add(a.framework.id)
        list.push(a.framework)
      }
    })
    return list
  }, [assessments])

  // ── Framework color index map ─────────────────────────────────
  const frameworkColorMap = useMemo(() => {
    const map: Record<number, number> = {}
    allFrameworks.forEach((fw, idx) => { map[fw.id] = idx })
    return map
  }, [allFrameworks])

  // ── Global stats ──────────────────────────────────────────────
  const total = assessments.length
  const completed = assessments.filter(a => getStatus(a) === 'completed').length
  const inprogress = assessments.filter(a => getStatus(a) === 'inprogress').length
  const overdue = assessments.filter(a => getStatus(a) === 'overdue').length
  const upcoming = assessments.filter(a => getStatus(a) === 'upcoming').length

  const kpiCards = [
    {
      label: 'Total', value: total,
      sub: `${allFrameworks.length} framework${allFrameworks.length !== 1 ? 's' : ''}`,
      fillPercent: 100, fillColor: '#378add',
      icon: <CircleDot className="h-4 w-4" />,
      valueColor: 'text-foreground', delay: 0,
    },
    {
      label: 'Completed', value: completed,
      sub: total > 0 ? `${Math.round(completed / total * 100)}%` : '0%',
      fillPercent: total > 0 ? Math.round(completed / total * 100) : 0,
      fillColor: '#639922',
      icon: <CheckCircle2 className="h-4 w-4" />,
      valueColor: completed > 0 ? 'text-[#3B6D11] dark:text-[#97C459]' : 'text-foreground', delay: 80,
    },
    {
      label: 'In Progress', value: inprogress,
      sub: total > 0 ? `${Math.round(inprogress / total * 100)}%` : '0%',
      fillPercent: total > 0 ? Math.round(inprogress / total * 100) : 0,
      fillColor: '#ba7517',
      icon: <Clock className="h-4 w-4" />,
      valueColor: inprogress > 0 ? 'text-[#854F0B] dark:text-[#EF9F27]' : 'text-foreground', delay: 160,
    },
    {
      label: overdue > 0 ? 'Overdue' : 'Upcoming', value: overdue > 0 ? overdue : upcoming,
      sub: total > 0 ? `${Math.round((overdue > 0 ? overdue : upcoming) / total * 100)}%` : '0%',
      fillPercent: total > 0 ? Math.round((overdue > 0 ? overdue : upcoming) / total * 100) : 0,
      fillColor: overdue > 0 ? '#e24b4a' : '#378add',
      icon: overdue > 0 ? <AlertCircle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />,
      valueColor: overdue > 0
        ? 'text-[#A32D2D] dark:text-[#F09595]'
        : (upcoming > 0 ? 'text-[#0C447C] dark:text-[#B5D4F4]' : 'text-foreground'),
      delay: 240,
    },
  ]

  // ── Filtered assessments ──────────────────────────────────────
  const globalFiltered = useMemo(() => {
    const q = globalSearch.toLowerCase()
    return assessments.filter(a => {
      const matchSearch = !q ||
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.framework.code.toLowerCase().includes(q) ||
        a.framework.name.toLowerCase().includes(q)

      const matchStatus = statusFilter === 'all' || getStatus(a) === statusFilter
      const matchFramework = frameworkFilter.length === 0 || frameworkFilter.includes(a.framework.id)

      return matchSearch && matchStatus && matchFramework
    })
  }, [assessments, globalSearch, statusFilter, frameworkFilter])

  // ── Group by framework ────────────────────────────────────────
  const byFramework = useMemo(() =>
    globalFiltered.reduce<Record<number, { framework: Framework; rows: GapAssessment[] }>>(
      (acc, a) => {
        if (!acc[a.framework.id]) acc[a.framework.id] = { framework: a.framework, rows: [] }
        acc[a.framework.id].rows.push(a)
        return acc
      }, {}
    ),
    [globalFiltered]
  )

  // ── Active filter count (for badge on Filters button) ─────────
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'all') count++
    count += frameworkFilter.length
    return count
  }, [statusFilter, frameworkFilter])
  useEffect(() => {
    setGlobalPage(1)
  }, [globalSearch, statusFilter, frameworkFilter])
  // ── Export all ────────────────────────────────────────────────
  const handleExportAll = async () => {
    setExportLoading(true)
    try {
      const params = new URLSearchParams()
      if (globalSearch) params.set('search', globalSearch)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (frameworkFilter.length) params.set('framework_ids', frameworkFilter.join(','))

      const response = await fetch(`/gap-assessments/export?${params.toString()}`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `gap-assessments-${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteClick = (a: GapAssessment) => {
    setAssessmentToDelete(a)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (assessmentToDelete) {
      router.delete(`/gap-assessments/${assessmentToDelete.id}`, {
        onSuccess: () => { setDeleteDialogOpen(false); setAssessmentToDelete(null) },
      })
    }
  }

  const hasActiveFilters = statusFilter !== 'all' || frameworkFilter.length > 0 || globalSearch !== ''

  return (
    <AppLayout breadcrumbs={[{ title: 'Gap Assessments', href: '/gap-assessment' }]}>
      <Head title="Gap Assessments" />

      <div className="space-y-6 py-6 px-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gap Assessments</h1>
            <p className="text-muted-foreground mt-1.5">Track and manage compliance gap evaluations</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => router.visit('/gap-assessment/create')}>
              <Plus className="mr-2 h-4 w-4" /> New Assessment
            </Button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {assessments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ perspective: '1200px' }}>
            {kpiCards.map(card => <KpiCard key={card.label} {...card} />)}
          </div>
        )}

        <Separator className="my-6" />

        {assessments.length === 0 ? <EmptyState /> : (
          <>
            {/* ── Search & Filters toolbar — mirroring Requirements layout ── */}
            <div className="flex items-center gap-3 flex-wrap">

              {/* Global search — left side */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search assessments…"
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Right-side controls — Filters | Export Excel */}
              <div className="ml-auto flex items-center gap-0">

                {/* Filters popover (status + framework) */}
                <FiltersPopover
                  frameworks={allFrameworks}
                  frameworkColorMap={frameworkColorMap}
                  statusFilter={statusFilter}
                  frameworkFilter={frameworkFilter}
                  onStatusChange={v => setStatusFilter(v)}
                  onFrameworkChange={ids => setFrameworkFilter(ids)}
                  activeCount={activeFilterCount}
                />

                {/* Divider */}
                <div className="w-px h-5 bg-border mx-1" />

                {/* Export Excel button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAll}
                  disabled={exportLoading || globalFiltered.length === 0}
                  className="h-9 gap-2 text-sm font-medium"
                >
                  {exportLoading
                    ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Exporting…</>
                    : <><Download className="h-3.5 w-3.5" /> Export Excel</>}
                </Button>
              </div>
            </div>

            {/* Active filter tags row (shown below toolbar when filters are active) */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-md border border-border">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium capitalize">{statusFilter === 'inprogress' ? 'In Progress' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                    <button onClick={() => setStatusFilter('all')} className="text-muted-foreground hover:text-foreground ml-0.5">
                      <X size={11} />
                    </button>
                  </span>
                )}
                {frameworkFilter.map(id => {
                  const fw = allFrameworks.find(f => f.id === id)
                  if (!fw) return null
                  const colorIndex = frameworkColorMap[id] ?? 0
                  const c = FRAMEWORK_COLORS[colorIndex % FRAMEWORK_COLORS.length]
                  return (
                    <span key={id} className={cn(
                      'inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-transparent font-medium',
                      c.bg, c.text, c.darkBg, c.darkText,
                    )}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
                      {fw.code}
                      <button onClick={() => setFrameworkFilter(frameworkFilter.filter(x => x !== id))} className="ml-0.5 opacity-70 hover:opacity-100">
                        <X size={11} />
                      </button>
                    </span>
                  )
                })}
                <span className="text-xs font-mono text-muted-foreground">
                  {globalFiltered.length} result{globalFiltered.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => { setGlobalSearch(''); setStatusFilter('all'); setFrameworkFilter([]) }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

{/* ── Framework groups ── */}
{(() => {
  const frameworkEntries = Object.values(byFramework)
  const totalGlobalPages = Math.max(1, Math.ceil(frameworkEntries.length / globalRpp))
  const paginatedFrameworks = frameworkEntries.slice(
    (globalPage - 1) * globalRpp,
    globalPage * globalRpp,
  )

  if (frameworkEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Search size={20} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No results found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Try adjusting your search or filters
        </p>
        <button
          onClick={() => { setGlobalSearch(''); setStatusFilter('all'); setFrameworkFilter([]) }}
          className="mt-3 text-xs text-primary underline underline-offset-2"
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {paginatedFrameworks.map(({ framework, rows }) => (
          <FrameworkGroup
            key={framework.id}
            framework={framework}
            rows={rows}
            colorIndex={frameworkColorMap[framework.id] ?? 0}
            onSelect={setSelected}
            onDeleteClick={handleDeleteClick}
            globalSearch={globalSearch}
          />
        ))}
      </div>

       <div className="flex items-center justify-between px-1 pt-3 border-t border-border flex-wrap gap-2">
        {/* Gauche — Showing X to Y of Z */}
        <p className="text-sm text-muted-foreground">
          {frameworkEntries.length === 0
            ? 'No results'
            : `Showing ${(globalPage - 1) * globalRpp + 1} to ${Math.min(globalPage * globalRpp, frameworkEntries.length)} of ${frameworkEntries.length} result${frameworkEntries.length !== 1 ? 's' : ''}`}
        </p>

        {/* Droite — Rows per page + Page X of Y + nav */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(globalRpp)}
              onValueChange={v => { setGlobalRpp(Number(v)); setGlobalPage(1) }}
            >
              <SelectTrigger className="h-8 w-[70px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 10, 15].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Page {globalPage} of {totalGlobalPages}
          </span>

          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setGlobalPage(1)}
              disabled={globalPage === 1}>
              <ChevronsLeft size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setGlobalPage(p => Math.max(1, p - 1))}
              disabled={globalPage === 1}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setGlobalPage(p => Math.min(totalGlobalPages, p + 1))}
              disabled={globalPage === totalGlobalPages}>
              <ChevronRight size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setGlobalPage(totalGlobalPages)}
              disabled={globalPage === totalGlobalPages}>
              <ChevronsRight size={14} />
            </Button>
          </div>
        </div>
      </div>
      
   </>
  )
})()}
          </>
        )}
      </div>

      {/* ── Drawer ── */}
      {selected && (
        <AssessmentDrawer
          item={selected}
          onClose={() => setSelected(null)}
          frameworkColorMap={frameworkColorMap}
        />
      )}

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gap Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{assessmentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}