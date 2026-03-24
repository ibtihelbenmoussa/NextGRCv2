// resources/js/pages/RequirementTests/Index.tsx
import { Head, Link, router } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { useEffect, useMemo, useRef, useCallback, useState } from 'react'

import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedData } from '@/types'

import AppLayout from '@/layouts/app-layout'
import { ServerDataTable } from '@/components/server-data-table'
import { DataTableColumnHeader } from '@/components/server-data-table-column-header'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Key,
  FileText,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CheckCheck,
  CircleDot,
  X,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Framework { id: number; code: string; name: string }
interface Process   { id: number; name: string }
interface Tag       { id: number; name: string }

interface Requirement {
  id: number
  code: string
  title: string
  frequency: string
  deadline?: string | null
  framework?: Framework | null
  process?: Process | null
  tags?: Tag[] | null
  latest_test_status?: 'pending' | 'accepted' | 'rejected' | null
  latest_test_comment?: string | null
  latest_test_id?: number | null
}

interface KpiData {
  total: number
  completed: number
  pending: number
  overdue: number
  completionRate: number
}

interface Props {
  date: string
  requirements: PaginatedData<Requirement>
  filters?: { search?: string; date?: string }
  isToday: boolean
  missedToday: number
  dueToday: number
  kpi: KpiData
}

// ─── Animated counter hook ────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed  = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

// ─── KPI Card — animated + 3D tilt on hover ──────────────────────────────────

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

  const [mounted, setMounted]   = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  const animatedValue           = useCountUp(mounted ? numericValue : 0, 900)

  // Tilt
  const cardRef                   = useRef<HTMLDivElement>(null)
  const [tilt, setTilt]           = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [glowPos, setGlowPos]     = useState({ x: 50, y: 50 })

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true),              delay)
    const t2 = setTimeout(() => setBarWidth(fillPercent ?? 0), delay + 120)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [delay, fillPercent])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const dx   = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)
    const dy   = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)
    setTilt({ x: dy * -10, y: dx * 10 })
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setIsHovered(false)
  }

  // ── Construit le transform CSS complet ici (pas de propriété translateY seule)
  const transformValue = isHovered
    ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04) translateY(-3px)`
    : `perspective(600px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)`

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform:  transformValue,
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
      {/* Moving glow */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${fillColor}18 0%, transparent 65%)`,
          }}
        />
      )}

      {/* Top border glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-lg transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${fillColor}80, transparent)`,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Label + icon */}
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs text-muted-foreground font-mono tracking-wide uppercase">{label}</span>
        <span
          className={cn(
            'transition-all duration-300',
            isHovered ? 'text-foreground/80 scale-110' : 'text-muted-foreground/60',
          )}
        >
          {icon}
        </span>
      </div>

      {/* Animated number */}
      <div
        className={cn(
          'text-2xl font-semibold leading-none tabular-nums relative z-10 transition-transform duration-200',
          valueColor,
          isHovered && 'scale-105 origin-left',
        )}
      >
        {typeof value === 'number' ? animatedValue : value}
      </div>

      {/* Sub text */}
      {sub && (
        <div
          className={cn(
            'text-xs font-mono relative z-10 transition-opacity duration-500',
            mounted ? 'opacity-100' : 'opacity-0',
          )}
          style={{ color: fillColor, transitionDelay: `${delay + 350}ms` }}
        >
          {sub}
        </div>
      )}

      {/* Progress bar */}
      <div className="h-0.5 rounded-full bg-border mt-1 overflow-hidden relative z-10">
        <div
          className="h-0.5 rounded-full"
          style={{
            width:           `${Math.min(barWidth, 100)}%`,
            backgroundColor: fillColor,
            transition:      isHovered
              ? 'width 0.3s ease-out, filter 0.2s ease-out'
              : `width 900ms cubic-bezier(0.4, 0, 0.2, 1) ${delay + 150}ms`,
            filter: isHovered ? `drop-shadow(0 0 3px ${fillColor})` : 'none',
          }}
        />
      </div>
    </div>
  )
}

// ─── Overdue Modal ────────────────────────────────────────────────────────────

function OverdueModal({
  open, onClose, overdueRequirements, todayMidnight, onGoToDate,
}: {
  open: boolean
  onClose: () => void
  overdueRequirements: Requirement[]
  todayMidnight: Date
  onGoToDate: (req: Requirement) => void
}) {
  const getDaysLate = (deadline: string) => {
    const dl = new Date(deadline); dl.setHours(0, 0, 0, 0)
    return Math.abs(Math.floor((dl.getTime() - todayMidnight.getTime()) / 86400000))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold leading-none">Overdue tests</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {overdueRequirements.length} requirement{overdueRequirements.length !== 1 ? 's' : ''} — click a row to go to that date
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
          {overdueRequirements.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No overdue tests found.</div>
          ) : (
            overdueRequirements.map((req) => {
              const daysLate          = req.deadline ? getDaysLate(req.deadline) : 0
              const badgeColor        = daysLate >= 3
                ? 'text-red-400 border-red-500/30 bg-red-500/10'
                : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
              const deadlineFormatted = req.deadline
                ? format(new Date(req.deadline), 'MMM d, yyyy', { locale: enUS })
                : '—'
              return (
                <button
                  key={req.id}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/40 transition-colors group cursor-pointer"
                  onClick={() => onGoToDate(req)}
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-foreground">{req.code}</span>
                      <span className={cn('inline-flex items-center text-xs font-mono px-1.5 py-0.5 rounded border', badgeColor)}>
                        +{daysLate}d
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{req.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarIcon className="h-3 w-3 text-red-400/70" />
                      <span className="text-xs text-red-400/80 font-mono">{deadlineFormatted}</span>
                      <span className="text-xs text-muted-foreground/50">·</span>
                      <span className="text-xs text-muted-foreground capitalize">{req.frequency?.replace(/_/g, ' ')}</span>
                      {req.framework && (
                        <>
                          <span className="text-xs text-muted-foreground/50">·</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[100px]">{req.framework.code}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground">Clicking a row navigates to that requirement's deadline date</p>
          <Button size="sm" variant="ghost" className="h-8 text-muted-foreground hover:text-foreground" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequirementTestsIndex({
  date: initialDate,
  requirements: paginatedRequirements,
  filters = {},
  isToday,
  missedToday,
  dueToday,
  kpi = { total: 0, completed: 0, pending: 0, overdue: 0, completionRate: 0 },
}: Props) {

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date(initialDate)
    return isNaN(d.getTime()) ? new Date() : d
  })

  const [exportLoading, setExportLoading]       = useState(false)
  const [highlightMissed, setHighlightMissed]   = useState(false)
  const missedRowRef = useRef<HTMLDivElement | null>(null)

  const [selectedIds, setSelectedIds]           = useState<Set<number>>(new Set())
  const [dueFilterActive, setDueFilterActive]   = useState(false)
  const [overdueModalOpen, setOverdueModalOpen] = useState(false)
  const [pendingTestReqId, setPendingTestReqId] = useState<number | null>(null)

  const formattedDate = useMemo(
    () => format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: enUS }),
    [selectedDate],
  )

  const selectedDateMidnight = useMemo(() => {
    const d = new Date(selectedDate); d.setHours(0, 0, 0, 0); return d
  }, [selectedDate])

  const todayMidnight = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  const isPastDate = useMemo(
    () => selectedDateMidnight < todayMidnight,
    [selectedDateMidnight, todayMidnight],
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get('date')) {
      params.set('date', format(selectedDate, 'yyyy-MM-dd'))
      router.visit(`${window.location.pathname}?${params.toString()}`, {
        preserveState: false, preserveScroll: true, replace: true,
      })
    }
  }, [])

  const navigate = useCallback((newDate: Date) => {
    setSelectedIds(new Set())
    setDueFilterActive(false)
    setOverdueModalOpen(false)
    const params = new URLSearchParams(window.location.search)
    params.set('date', format(newDate, 'yyyy-MM-dd'))
    params.delete('page')
    router.visit(`${window.location.pathname}?${params.toString()}`, {
      preserveState: false, preserveScroll: true, replace: true,
    })
  }, [])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate || isNaN(newDate.getTime())) return
    setSelectedDate(newDate)
    navigate(newDate)
  }

  const navigateToCreate = useCallback((reqId: number) => {
    router.visit(route('requirements.test.create', reqId) + `?date=${format(selectedDate, 'yyyy-MM-dd')}`)
  }, [selectedDate])

  const handleGoToOverdueDate = useCallback((req: Requirement) => {
    if (!req.deadline) return
    setOverdueModalOpen(false)
    const deadlineDate = new Date(req.deadline)
    deadlineDate.setHours(0, 0, 0, 0)
    setSelectedDate(deadlineDate)
    navigate(deadlineDate)
  }, [navigate])

  const handleCompleteNow = useCallback(() => {
    const dueIds = new Set<number>()
    paginatedRequirements.data.forEach((req) => {
      if (req.latest_test_status !== 'accepted' && req.latest_test_status !== 'pending') {
        if (req.deadline) {
          const dl = new Date(req.deadline); dl.setHours(0, 0, 0, 0)
          if (dl.getTime() === selectedDateMidnight.getTime()) dueIds.add(req.id)
        }
      }
    })
    if (dueIds.size === 0) {
      paginatedRequirements.data.forEach((req) => {
        if (req.latest_test_status !== 'accepted' && req.latest_test_status !== 'pending')
          dueIds.add(req.id)
      })
    }
    setSelectedIds(dueIds)
    setDueFilterActive(true)
    setTimeout(() => {
      document.getElementById('compliance-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }, [paginatedRequirements.data, selectedDateMidnight])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setDueFilterActive(false)
  }, [])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const params = new URLSearchParams(window.location.search)
      const response = await fetch(
        `${route('requirement-tests.export')}?${params.toString()}`,
        { headers: { 'X-Requested-With': 'XMLHttpRequest' } },
      )
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url  = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `compliance-tests-${format(selectedDate, 'yyyy-MM-dd')}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setExportLoading(false)
    }
  }

  const isOverdueRow = useCallback((req: Requirement): boolean => {
    if (req.latest_test_status === 'accepted' || req.latest_test_status === 'pending') return false
    if (!req.deadline) return false
    const dl = new Date(req.deadline); dl.setHours(0, 0, 0, 0)
    return dl < todayMidnight
  }, [todayMidnight])

  const isMissedRow = useCallback((req: Requirement): boolean => {
    if (req.latest_test_status === 'accepted' || req.latest_test_status === 'pending') return false
    if (!isPastDate) return false
    return req.latest_test_status === null || req.latest_test_status === 'rejected'
  }, [isPastDate])

  const isDueRow = useCallback((req: Requirement): boolean => {
    if (!req.deadline) return false
    if (!isToday) return false
    if (req.latest_test_status === 'accepted' || req.latest_test_status === 'pending') return false
    const dl = new Date(req.deadline); dl.setHours(0, 0, 0, 0)
    return dl.getTime() === todayMidnight.getTime()
  }, [isToday, todayMidnight])

  const overdueRequirements = useMemo(
    () => paginatedRequirements.data.filter(isOverdueRow),
    [paginatedRequirements.data, isOverdueRow],
  )

  const safeTotal = kpi.total || 1

  const columns = useMemo<ColumnDef<Requirement>[]>(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => (
          <div className="flex items-center gap-1.5">
            <Key className="h-4 w-4 text-muted-foreground" />
            <DataTableColumnHeader column={column} title="Code" />
          </div>
        ),
        cell: ({ row }) => {
          const req      = row.original
          const missed   = isMissedRow(req)
          const due      = isDueRow(req)
          const selected = selectedIds.has(req.id)
          return (
            <div className="flex items-center gap-2">
              {missed && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}
              {due && selected && !missed && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
              <div className={cn(
                'font-mono font-medium',
                missed              && 'text-red-400',
                selected && !missed && 'text-amber-400',
              )}>
                {row.getValue('code') || '—'}
              </div>
            </div>
          )
        },
        size: 140,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <DataTableColumnHeader column={column} title="Title" />
          </div>
        ),
        cell: ({ row }) => (
          <Link href={`/requirements/${row.original.id}`} className="font-medium hover:underline line-clamp-1">
            {row.getValue('title')}
          </Link>
        ),
      },
      {
        accessorKey: 'frequency',
        header: ({ column }) => (
          <div className="flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <DataTableColumnHeader column={column} title="Frequency" />
          </div>
        ),
        cell: ({ row }) => {
          const freq = (row.getValue('frequency') as string | undefined)?.toLowerCase() || ''
          let badgeClass = 'border-gray-700 bg-gray-900/40 text-gray-300'
          if (freq.includes('daily'))     badgeClass = 'border-blue-600 bg-blue-950/50 text-blue-200'
          if (freq.includes('weekly'))    badgeClass = 'border-violet-600 bg-violet-950/50 text-violet-200'
          if (freq.includes('monthly'))   badgeClass = 'border-amber-600 bg-amber-950/50 text-amber-200'
          if (freq.includes('quarterly')) badgeClass = 'border-cyan-600 bg-cyan-950/50 text-cyan-200'
          if (freq.includes('yearly') || freq.includes('annual'))
            badgeClass = 'border-emerald-600 bg-emerald-950/50 text-emerald-200'
          if (freq.includes('one_time') || freq.includes('one-time') || freq.includes('onetime'))
            badgeClass = 'border-indigo-600 bg-indigo-950/50 text-indigo-200'
          const display = freq
            ? freq.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            : '—'
          return (
            <Badge variant="outline" className={cn('capitalize px-2.5 py-0.5 min-w-[100px] text-center', badgeClass)}>
              {display}
            </Badge>
          )
        },
        size: 160,
      },
      {
        id: 'framework',
        accessorFn: row => row.framework ? `${row.framework.code} — ${row.framework.name}` : '—',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Framework" />,
        cell: ({ row }) => {
          const fw = row.original.framework
          if (!fw) return <span className="text-muted-foreground">—</span>
          const initials = fw.code ? fw.code.slice(0, 3).toUpperCase() : fw.name.slice(0, 2).toUpperCase()
          const hue = (fw.id * 47) % 360
          return (
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: `hsl(${hue}, 70%, 48%)` }}
              >
                {initials}
              </div>
              <span className="text-muted-foreground truncate max-w-[160px]">{fw.code} — {fw.name}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'deadline',
        header: ({ column }) => (
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <DataTableColumnHeader column={column} title="Deadline" />
          </div>
        ),
        cell: ({ row }) => {
          const dl  = row.original.deadline
          const req = row.original
          if (!dl) return <span className="text-muted-foreground">—</span>
          const dateMs = new Date(dl).setHours(0, 0, 0, 0)
          if (isNaN(dateMs)) return <span className="text-red-400">Invalid</span>

          const diffDays = Math.floor((dateMs - todayMidnight.getTime()) / 86400000)
          const missed   = isMissedRow(req)
          const overdue  = isOverdueRow(req)
          const due      = isDueRow(req)
          const selected = selectedIds.has(req.id)

          if (overdue && !missed) {
            const daysLate = Math.abs(diffDays)
            return (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border bg-red-500/10 border-red-500/30">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                <span className="text-red-400 font-medium text-sm">
                  {format(new Date(dl), 'MMM d, yyyy', { locale: enUS })}
                </span>
                {daysLate > 0 && (
                  <span className="text-xs font-mono text-red-400/70 border border-red-500/30 rounded px-1.5 py-0.5 bg-red-500/10">
                    +{daysLate}d
                  </span>
                )}
              </div>
            )
          }
          if (missed) {
            return (
              <div className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-500',
                'bg-red-500/10 border-red-500/30',
                highlightMissed && 'bg-red-500/25 border-red-500/60 scale-105',
              )}>
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                <span className="text-red-400 font-medium text-sm">
                  {format(new Date(dl), 'MMM d, yyyy', { locale: enUS })}
                </span>
              </div>
            )
          }
          if (due && selected) {
            return (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/40">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
                <span className="text-amber-400 font-medium text-sm">
                  {format(new Date(dl), 'MMM d, yyyy', { locale: enUS })}
                </span>
              </div>
            )
          }
          const color =
            diffDays < 0  ? 'text-red-400 font-medium'   :
            diffDays <= 3 ? 'text-amber-400 font-medium' :
            'text-emerald-400'
          return <span className={color}>{format(new Date(dl), 'MMM d, yyyy', { locale: enUS })}</span>
        },
        size: 200,
      },
      {
        id: 'actions',
        header: () => null,
        cell: ({ row }) => {
          const req      = row.original
          const status   = req.latest_test_status
          const missed   = isMissedRow(req)
          const selected = selectedIds.has(req.id)

          let config: {
            label: string; icon: React.ReactNode
            className?: string; disabled: boolean; tooltip?: string
          } = { label: 'Create Test', icon: <Plus className="h-4 w-4 mr-2" />, disabled: false }

          if (isToday) {
            if (status === 'accepted') config = { label: 'Accepted', icon: <CheckCircle2 className="h-4 w-4 mr-2" />, className: 'bg-emerald-800/90 hover:bg-emerald-800 text-white cursor-not-allowed opacity-80', disabled: true, tooltip: 'Test already accepted for today' }
            else if (status === 'pending') config = { label: 'Pending', icon: <Clock className="h-4 w-4 mr-2" />, className: 'bg-amber-700/90 hover:bg-amber-700 text-white cursor-not-allowed opacity-80', disabled: true, tooltip: 'Test is awaiting validation' }
            else if (status === 'rejected') config = { label: 'Rejected – Retry', icon: <AlertTriangle className="h-4 w-4 mr-2" />, className: 'bg-orange-600 hover:bg-orange-700 text-white', disabled: false, tooltip: req.latest_test_comment || 'Previous test was rejected' }
          } else {
            if (status === 'accepted') config = { label: 'Accepted', icon: <CheckCircle2 className="h-4 w-4 mr-2" />, className: 'bg-emerald-800/90 hover:bg-emerald-800 text-white cursor-not-allowed opacity-80', disabled: true, tooltip: 'Test already accepted for this date' }
            else if (status === 'pending') config = { label: 'Pending', icon: <Clock className="h-4 w-4 mr-2" />, className: 'bg-amber-700/90 hover:bg-amber-700 text-white cursor-not-allowed opacity-80', disabled: true, tooltip: 'Test is awaiting validation' }
          }

          return (
            <div
              ref={missed ? (el) => { if (el && !missedRowRef.current) missedRowRef.current = el } : undefined}
              className={cn(
                'flex justify-end items-center gap-2 pr-3 rounded-md transition-all duration-500',
                missed   && highlightMissed && 'bg-red-500/10 ring-1 ring-red-500/50 ring-offset-1',
                selected && !missed         && 'bg-amber-500/5 ring-1 ring-amber-500/40 ring-offset-1',
              )}
            >
              <Button variant="outline" size="sm"
                onClick={() => router.visit(route('requirement-tests.show', req.id))}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Tests
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default" size="sm"
                      disabled={config.disabled}
                      className={cn(
                        'min-w-[155px] justify-center', config.className,
                        selected && !config.disabled && !missed ? 'bg-amber-600 hover:bg-amber-700 text-white border-0' : '',
                      )}
                      onClick={() => {
                        if (config.disabled) return
                        if (isPastDate) setPendingTestReqId(req.id)
                        else navigateToCreate(req.id)
                      }}
                    >
                      {config.icon}{config.label}
                    </Button>
                  </TooltipTrigger>
                  {config.tooltip && (
                    <TooltipContent side="top"><p>{config.tooltip}</p></TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        },
        size: 220,
      },
    ],
    [isToday, isPastDate, highlightMissed, selectedIds, navigateToCreate,
     isMissedRow, isOverdueRow, isDueRow, todayMidnight],
  )

  return (
    <AppLayout>
      <Head title="Compliance Tests" />

      <div className="container mx-auto space-y-6 py-6 px-4 md:px-6 lg:px-8">

        {/* Header + date picker */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance Tests</h1>
            <p className="text-muted-foreground mt-1.5">Track and manage scheduled compliance activities</p>
          </div>

          <div className="flex items-center gap-2 bg-muted/40 border rounded-md px-2 py-1">
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => { const p = new Date(selectedDate); p.setDate(p.getDate() - 1); handleDateSelect(p) }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="gap-2 px-3 min-w-[220px] justify-start font-normal">
                  <CalendarIcon className="h-4 w-4 opacity-80" />
                  {formattedDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => { const n = new Date(selectedDate); n.setDate(n.getDate() + 1); handleDateSelect(n) }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ perspective: '1200px' }}>
          <KpiCard
            label="Total today"
            value={kpi.total}
            sub={`${kpi.completionRate}% completed`}
            fillPercent={kpi.completionRate}
            fillColor="#378add"
            valueColor="text-foreground"
            icon={<CircleDot className="h-4 w-4" />}
            delay={0}
          />
          <KpiCard
            label="Completed"
            value={kpi.completed}
            sub={kpi.total > 0 ? `${Math.round((kpi.completed / safeTotal) * 100)}% of total` : '—'}
            fillPercent={kpi.total > 0 ? (kpi.completed / safeTotal) * 100 : 0}
            fillColor="#639922"
            valueColor="text-emerald-500"
            icon={<CheckCheck className="h-4 w-4" />}
            delay={80}
          />
          <KpiCard
            label="Pending"
            value={kpi.pending}
            sub="awaiting validation"
            fillPercent={kpi.total > 0 ? (kpi.pending / safeTotal) * 100 : 0}
            fillColor="#ba7517"
            valueColor={kpi.pending > 0 ? 'text-amber-500' : 'text-foreground'}
            icon={<Clock className="h-4 w-4" />}
            delay={160}
          />
          <KpiCard
            label="Overdue"
            value={kpi.overdue}
            sub="deadline missed"
            fillPercent={kpi.total > 0 ? (kpi.overdue / safeTotal) * 100 : 0}
            fillColor="#e24b4a"
            valueColor={kpi.overdue > 0 ? 'text-red-500' : 'text-foreground'}
            icon={<AlertTriangle className="h-4 w-4" />}
            delay={240}
          />
        </div>

        {/* Banners */}
        {(missedToday > 0 || dueToday > 0) && (
          <div className="flex flex-col gap-2">
            {missedToday > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-400">
                    {missedToday} missed test{missedToday > 1 ? 's' : ''} — deadline passed
                  </p>
                  <p className="font-mono text-xs text-red-400/70 mt-0.5">
                    These requirements were not tested before their deadline
                  </p>
                </div>
                <Button size="sm" variant="outline"
                  className="shrink-0 border-red-500/50 text-red-400 hover:bg-red-500/20 gap-1.5"
                  onClick={() => setOverdueModalOpen(true)}
                >
                  View overdue <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {dueToday > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
                <Clock className="h-5 w-5 shrink-0 text-amber-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-400">
                    {dueToday} test{dueToday > 1 ? 's' : ''} due today
                  </p>
                  <p className="font-mono text-xs text-amber-400/70 mt-0.5">
                    Deadline: {format(selectedDate, 'EEEE, MMMM d', { locale: enUS })} · 11:59 PM
                  </p>
                </div>
                <Button size="sm" variant="outline"
                  className="shrink-0 border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                  onClick={handleCompleteNow}
                >
                  Complete now
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Selection bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <p className="text-sm font-medium text-amber-400">
                {selectedIds.size} test{selectedIds.size > 1 ? 's' : ''} highlighted — complete them before end of day
              </p>
            </div>
            <Button size="sm" variant="ghost"
              className="text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 h-7 w-7 p-0"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Banner date passée */}
        {isPastDate && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-2.5">
            <CalendarIcon className="h-4 w-4 shrink-0 text-blue-400" />
            <p className="text-sm text-blue-400">
              Viewing <span className="font-semibold">{formattedDate}</span> — past date.
              Tests created here will be recorded with this date.
            </p>
          </div>
        )}

        {/* Table */}
        <div id="compliance-table">
          <ServerDataTable
            columns={columns}
            data={paginatedRequirements}
            searchPlaceholder="Search by code or title..."
            onExport={handleExport}
            exportLoading={exportLoading}
            initialState={{
              columnPinning: { right: ['actions'] },
              sorting: [{ id: 'code', desc: false }],
            }}
          />
        </div>
      </div>

      <OverdueModal
        open={overdueModalOpen}
        onClose={() => setOverdueModalOpen(false)}
        overdueRequirements={overdueRequirements}
        todayMidnight={todayMidnight}
        onGoToDate={handleGoToOverdueDate}
      />

      <AlertDialog
        open={pendingTestReqId !== null}
        onOpenChange={(open) => { if (!open) setPendingTestReqId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create test for a past date?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                You are about to create a test for{' '}
                <span className="font-semibold text-amber-500">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: enUS })}
                </span>
                {' '}which is in the past.
                <br /><br />
                The test will be recorded with this date and will appear as{' '}
                <span className="font-semibold">Pending</span> for{' '}
                {format(selectedDate, 'MMM d', { locale: enUS })}.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTestReqId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                if (pendingTestReqId !== null) navigateToCreate(pendingTestReqId)
                setPendingTestReqId(null)
              }}
            >
              Yes, create for {format(selectedDate, 'MMM d', { locale: enUS })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}