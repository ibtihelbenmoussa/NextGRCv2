import { Head, router } from '@inertiajs/react'
import { route } from 'ziggy-js'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  CheckCircle,
  XCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Test {
  id: number
  test_code: string
  status: string
  comment?: string
  evidence?: any
  test_date?: string
  validation_status: 'pending' | 'accepted' | 'rejected'
  validation_comment?: string
  created_at: string
  requirement?: {
    code: string
    title: string
  }
}

interface Props {
  tests: {
    data: Test[]
    links: any
    meta: any
  }
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

// ─── KPI Card with 3D tilt on hover ──────────────────────────────────────────

function KpiCard({
  label, value, sub, fillPercent, fillColor, icon, valueColor, delay = 0,
}: {
  label: string
  value: number
  sub?: string
  fillPercent?: number
  fillColor: string
  icon: React.ReactNode
  valueColor?: string
  delay?: number
}) {
  const [mounted, setMounted]   = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  const animatedValue           = useCountUp(mounted ? value : 0, 900)

  // Tilt state
  const cardRef                     = useRef<HTMLDivElement>(null)
  const [tilt, setTilt]             = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered]   = useState(false)
  const [glowPos, setGlowPos]       = useState({ x: 50, y: 50 })

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true),              delay)
    const t2 = setTimeout(() => setBarWidth(fillPercent ?? 0), delay + 120)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [delay, fillPercent])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect   = card.getBoundingClientRect()
    const cx     = rect.left + rect.width  / 2
    const cy     = rect.top  + rect.height / 2
    const dx     = (e.clientX - cx) / (rect.width  / 2)   // -1 → 1
    const dy     = (e.clientY - cy) / (rect.height / 2)   // -1 → 1
    setTilt({ x: dy * -10, y: dx * 10 })                  // rotateX / rotateY
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setIsHovered(false)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04) translateY(-3px)`
          : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)',
        transition: isHovered
          ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out'
          : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease-out',
        boxShadow: isHovered
          ? `0 12px 32px -8px ${fillColor}40, 0 4px 16px -4px ${fillColor}25`
          : '0 1px 3px rgba(0,0,0,0.12)',
      }}
      className={cn(
        'bg-muted/40 rounded-lg p-4 flex flex-col gap-1.5 cursor-default relative overflow-hidden',
        'transition-opacity duration-500 ease-out',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
      )}
    >
      {/* Moving glow highlight */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${fillColor}18 0%, transparent 65%)`,
          }}
        />
      )}

      {/* Top border glow on hover */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-lg transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${fillColor}80, transparent)`,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Label + icon */}
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs text-muted-foreground font-mono tracking-wide uppercase">
          {label}
        </span>
        <span
          className={cn(
            'transition-all duration-500',
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
            isHovered ? 'text-foreground/80 scale-110' : 'text-muted-foreground/60',
          )}
          style={{ transitionDelay: mounted ? '0ms' : `${delay + 200}ms` }}
        >
          {icon}
        </span>
      </div>

      {/* Animated number */}
      <div
        className={cn(
          'text-2xl font-semibold leading-none tabular-nums relative z-10 transition-all duration-200',
          valueColor,
          isHovered && 'scale-105 origin-left',
        )}
      >
        {animatedValue}
      </div>

      {/* Sub text */}
      {sub && (
        <div
          className={cn(
            'text-xs font-mono transition-opacity duration-500 relative z-10',
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
          className="h-0.5 rounded-full transition-all"
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getValidationBadge = (status: Test['validation_status']) => {
  switch (status) {
    case 'accepted':
      return (
        <Badge className="bg-emerald-950/60 text-emerald-300 border border-emerald-700 gap-1.5 px-3 py-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accepted
        </Badge>
      )
    case 'rejected':
      return (
        <Badge className="bg-red-950/60 text-red-300 border border-red-700 gap-1.5 px-3 py-1">
          <XCircle className="h-3.5 w-3.5" />
          Rejected
        </Badge>
      )
    default:
      return (
        <Badge className="bg-amber-950/60 text-amber-300 border border-amber-700 gap-1.5 px-3 py-1">
          <Clock className="h-3.5 w-3.5" />
          Pending
        </Badge>
      )
  }
}

type FilterType = 'all' | 'pending' | 'accepted' | 'rejected'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Validation({ tests }: Props) {
  const [modalOpen, setModalOpen]         = useState(false)
  const [selectedTest, setSelectedTest]   = useState<Test | null>(null)
  const [actionType, setActionType]       = useState<'accept' | 'reject' | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [processing, setProcessing]       = useState(false)
  const [activeFilter, setActiveFilter]   = useState<FilterType>('all')

  const stats = useMemo(() => {
    const all      = tests.data
    const total    = all.length
    const pending  = all.filter(t => t.validation_status === 'pending').length
    const accepted = all.filter(t => t.validation_status === 'accepted').length
    const rejected = all.filter(t => t.validation_status === 'rejected').length
    return { total, pending, accepted, rejected }
  }, [tests.data])

  const filteredTests = useMemo(() => {
    if (activeFilter === 'all') return tests.data
    return tests.data.filter(t => t.validation_status === activeFilter)
  }, [tests.data, activeFilter])

  const openModal = (test: Test, type: 'accept' | 'reject') => {
    setSelectedTest(test)
    setActionType(type)
    setRejectComment('')
    setModalOpen(true)
  }

  const handleAction = () => {
    if (!selectedTest || !actionType) return
    if (actionType === 'reject' && !rejectComment.trim()) {
      alert('Rejection reason is required')
      return
    }
    setProcessing(true)
    const routeName = actionType === 'accept'
      ? 'requirement-tests.accept'
      : 'requirement-tests.reject'
    router.patch(
      route(routeName, selectedTest.id),
      { comment: actionType === 'reject' ? rejectComment : undefined },
      {
        preserveScroll: true,
        onSuccess: () => {
          setModalOpen(false)
          setSelectedTest(null)
          setActionType(null)
          setRejectComment('')
          setProcessing(false)
        },
        onError: (errors) => {
          console.error('Validation error:', errors)
          setProcessing(false)
        },
      },
    )
  }

  const safeTotal = stats.total || 1
  const kpiCards = [
    {
      label:       'Total',
      value:       stats.total,
      sub:         'tests on this page',
      fillPercent: 100,
      fillColor:   '#378add',
      icon:        <ClipboardList className="h-4 w-4" />,
      valueColor:  'text-foreground' as const,
      delay:       0,
    },
    {
      label:       'Pending',
      value:       stats.pending,
      sub:         `${Math.round((stats.pending / safeTotal) * 100)}% of total`,
      fillPercent: Math.round((stats.pending / safeTotal) * 100),
      fillColor:   '#ba7517',
      icon:        <Clock className="h-4 w-4" />,
      valueColor:  (stats.pending > 0 ? 'text-amber-500' : 'text-foreground') as string,
      delay:       80,
    },
    {
      label:       'Accepted',
      value:       stats.accepted,
      sub:         `${Math.round((stats.accepted / safeTotal) * 100)}% of total`,
      fillPercent: Math.round((stats.accepted / safeTotal) * 100),
      fillColor:   '#639922',
      icon:        <ShieldCheck className="h-4 w-4" />,
      valueColor:  (stats.accepted > 0 ? 'text-emerald-500' : 'text-foreground') as string,
      delay:       160,
    },
    {
      label:       'Rejected',
      value:       stats.rejected,
      sub:         `${Math.round((stats.rejected / safeTotal) * 100)}% of total`,
      fillPercent: Math.round((stats.rejected / safeTotal) * 100),
      fillColor:   '#e24b4a',
      icon:        <ShieldX className="h-4 w-4" />,
      valueColor:  (stats.rejected > 0 ? 'text-red-500' : 'text-foreground') as string,
      delay:       240,
    },
  ]

  const filterTabs: { key: FilterType; label: string; count: number; activeClass: string }[] = [
    { key: 'all',      label: 'All',      count: stats.total,    activeClass: 'bg-blue-600 text-white border-blue-600'       },
    { key: 'pending',  label: 'Pending',  count: stats.pending,  activeClass: 'bg-amber-600 text-white border-amber-600'     },
    { key: 'accepted', label: 'Accepted', count: stats.accepted, activeClass: 'bg-emerald-700 text-white border-emerald-700' },
    { key: 'rejected', label: 'Rejected', count: stats.rejected, activeClass: 'bg-red-700 text-white border-red-700'         },
  ]

  const emptyState: Record<FilterType, { icon: React.ReactNode; title: string; sub: string }> = {
    all:      { icon: <ClipboardList className="h-8 w-8 text-muted-foreground" />, title: 'No tests found',                               sub: 'Tests will appear here once they are submitted' },
    pending:  { icon: <Clock         className="h-8 w-8 text-amber-400"        />, title: 'No tests pending validation',                  sub: 'Tests will appear here once they are submitted' },
    accepted: { icon: <ShieldCheck   className="h-8 w-8 text-emerald-400"      />, title: 'No accepted tests yet',                        sub: 'Try switching to a different filter'            },
    rejected: { icon: <ShieldX       className="h-8 w-8 text-red-400"          />, title: 'No rejected tests — all tests passed validation', sub: 'Try switching to a different filter'          },
  }

  return (
    <AppLayout>
      <Head title="Test Validation" />

      <div className="container mx-auto space-y-6 py-6 px-4 md:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Test Validation</h1>
            <p className="text-muted-foreground mt-1.5">
              Review and validate compliance test results
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ perspective: '1200px' }}>
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>

        <Separator />

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-150',
                activeFilter === tab.key
                  ? tab.activeClass
                  : 'border-border/60 text-muted-foreground bg-muted/20 hover:bg-muted/40 hover:text-foreground',
              )}
            >
              {tab.label}
              <span className={cn(
                'inline-flex items-center justify-center rounded-full text-xs font-semibold min-w-[20px] h-5 px-1.5',
                activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
          <div className="grid grid-cols-[130px_140px_1fr_130px_150px_160px] gap-4 px-5 py-3 bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Validation</span>
            <span>Test Code</span>
            <span>Requirement</span>
            <span>Date</span>
            <span>Comment</span>
            <span className="text-right">Actions</span>
          </div>

          {filteredTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="p-4 rounded-full bg-muted/40">{emptyState[activeFilter].icon}</div>
              <p className="text-muted-foreground font-medium">{emptyState[activeFilter].title}</p>
              <p className="text-sm text-muted-foreground/60">{emptyState[activeFilter].sub}</p>
            </div>
          ) : (
            filteredTests.map((test, idx) => (
              <div
                key={test.id}
                className={cn(
                  'grid grid-cols-[130px_140px_1fr_130px_150px_160px] gap-4 px-5 py-4 items-center',
                  'border-b last:border-0 transition-colors hover:bg-muted/20',
                  idx % 2 === 0 ? 'bg-background' : 'bg-muted/5',
                )}
              >
                <div>{getValidationBadge(test.validation_status)}</div>
                <div className="font-mono text-sm font-medium">{test.test_code || '—'}</div>
                <div className="min-w-0">
                  {test.requirement ? (
                    <div>
                      <span className="text-xs font-mono text-muted-foreground">{test.requirement.code}</span>
                      <p className="text-sm font-medium truncate">{test.requirement.title}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {test.test_date ? format(new Date(test.test_date), 'MMM d, yyyy', { locale: enUS }) : '—'}
                </div>
                <div className="text-sm text-muted-foreground truncate max-w-[140px]" title={test.comment || undefined}>
                  {test.comment || '—'}
                </div>
                <div className="flex justify-end gap-2">
                  {test.validation_status === 'pending' ? (
                    <>
                      <Button size="sm" className="bg-emerald-700 hover:bg-emerald-600 text-white gap-1.5" onClick={() => openModal(test, 'accept')}>
                        <CheckCircle className="h-3.5 w-3.5" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-700 text-red-400 hover:bg-red-950/40 gap-1.5" onClick={() => openModal(test, 'reject')}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic pr-2">
                      {test.validation_status === 'accepted' ? '✓ Validated' : '✗ Rejected'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Validation Modal ───────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              {actionType === 'accept'
                ? <ShieldCheck className="h-5 w-5 text-emerald-400" />
                : <ShieldX     className="h-5 w-5 text-red-400"     />}
              Test Validation
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="rounded-lg border border-border/60 bg-muted/20 px-5 py-4 space-y-2">
              <p className="font-mono text-sm text-muted-foreground">{selectedTest?.test_code}</p>
              <p className="font-medium">{selectedTest?.requirement?.title || 'Compliance Test'}</p>
            </div>

            <div className="flex justify-center gap-6">
              <button
                onClick={() => setActionType('accept')}
                className={cn(
                  'flex flex-col items-center gap-2 px-8 py-5 rounded-xl border-2 transition-all duration-200',
                  actionType === 'accept'
                    ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 scale-105 shadow-lg shadow-emerald-950/50'
                    : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-emerald-700 hover:text-emerald-400',
                )}
              >
                <CheckCircle className="h-8 w-8" />
                <span className="font-semibold text-sm">Accept</span>
              </button>

              <button
                onClick={() => setActionType('reject')}
                className={cn(
                  'flex flex-col items-center gap-2 px-8 py-5 rounded-xl border-2 transition-all duration-200',
                  actionType === 'reject'
                    ? 'border-red-500 bg-red-950/50 text-red-300 scale-105 shadow-lg shadow-red-950/50'
                    : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-red-700 hover:text-red-400',
                )}
              >
                <XCircle className="h-8 w-8" />
                <span className="font-semibold text-sm">Reject</span>
              </button>
            </div>

            {actionType === 'reject' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Rejection reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Explain why this test is being rejected..."
                  className="min-h-[100px] resize-none"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              disabled={!actionType || processing}
              onClick={handleAction}
              className={cn(
                'min-w-[140px]',
                actionType === 'accept' ? 'bg-emerald-700 hover:bg-emerald-600 text-white' :
                actionType === 'reject' ? 'bg-red-700 hover:bg-red-600 text-white' : '',
              )}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  Saving...
                </span>
              ) : actionType === 'accept' ? (
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Confirm Accept</span>
              ) : actionType === 'reject' ? (
                <span className="flex items-center gap-2"><XCircle className="h-4 w-4" /> Confirm Reject</span>
              ) : (
                'Select an action'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}