import { useState, useEffect, useRef, useMemo } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { ServerDataTable } from '@/components/server-data-table'
import { DataTableColumnHeader } from '@/components/server-data-table-column-header'
import { DataTableFacetedFilter } from '@/components/server-data-table-faceted-filter'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
    ClipboardList,
    User,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    CircleDot,
    Clock,
    Flame,
} from 'lucide-react'
import axios from 'axios'
import type { ColumnDef } from '@tanstack/react-table'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Plan {
    id: number
    title: string
    description: string
    assigned_to: number | null
    assigned_user_name: string | null
    due_date: string | null
    status: string
    gap_assessment_id: number
    gap_assessment_name: string | null
    gap_assessment_code: string | null
}

interface UserOption {
    id: number
    name: string
}

interface LaravelPaginator<T> {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
    first_page_url: string
    last_page_url: string
    prev_page_url: string | null
    next_page_url: string | null
    links: { url: string | null; label: string; active: boolean }[]
    path: string
}

interface Props {
    plans: LaravelPaginator<Plan> | Plan[]
    users: UserOption[]
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
    {
        value: 'open',
        label: 'Open',
        dot: 'bg-[#0C447C] dark:bg-[#6CA4E0]',
        triggerClass: 'bg-[#E6F1FB] text-[#0C447C] border-[#6CA4E0]/40 dark:bg-[#0C447C]/30 dark:text-[#B5D4F4] dark:border-[#0C447C]',
        itemClass: 'text-[#0C447C] dark:text-[#B5D4F4] focus:bg-[#E6F1FB] dark:focus:bg-[#0C447C]/30',
    },
    {
        value: 'in_progress',
        label: 'In Progress',
        dot: 'bg-[#854F0B] dark:bg-[#EF9F27]',
        triggerClass: 'bg-[#FAEEDA] text-[#854F0B] border-[#EF9F27]/40 dark:bg-[#412402]/40 dark:text-[#FAC775] dark:border-[#854F0B]',
        itemClass: 'text-[#854F0B] dark:text-[#FAC775] focus:bg-[#FAEEDA] dark:focus:bg-[#412402]/40',
    },
]

function statusMeta(status: string) {
    return STATUS_OPTIONS.find(s => s.value === status) ?? STATUS_OPTIONS[0]
}

function isOverdue(dueDate: string | null, status: string): boolean {
    if (!dueDate || status === 'closed') return false
    return new Date(dueDate) < new Date()
}

function isDueSoon(dueDate: string | null, status: string): boolean {
    if (!dueDate || status === 'closed') return false
    const diff = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
}

// ─── Animated counter hook ────────────────────────────────────────────────────
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

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
    label, value, sub, fillPercent, fillColor, icon, valueColor, delay = 0,
    onClick, active,
}: {
    label: string
    value: number | string
    sub?: string
    fillPercent?: number
    fillColor: string
    icon: React.ReactNode
    valueColor?: string
    delay?: number
    onClick?: () => void
    active?: boolean
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

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 })
        setIsHovered(false)
    }

    const transformValue = isHovered
        ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04) translateY(-3px)`
        : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)'

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{
                transform: transformValue,
                transition: isHovered
                    ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out, opacity 0.5s ease-out'
                    : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease-out, opacity 0.5s ease-out',
                boxShadow: active
                    ? `0 0 0 2px ${fillColor}60, 0 8px 24px -6px ${fillColor}35`
                    : isHovered
                        ? `0 12px 32px -8px ${fillColor}40, 0 4px 16px -4px ${fillColor}25`
                        : '0 1px 3px rgba(0,0,0,0.12)',
                opacity: mounted ? 1 : 0,
            }}
            className={cn(
                'bg-muted/40 rounded-lg p-4 flex flex-col gap-1.5 relative overflow-hidden',
                onClick ? 'cursor-pointer select-none' : 'cursor-default',
                active && 'ring-2 ring-offset-1',
            )}
        >
            {isHovered && (
                <div
                    className="pointer-events-none absolute inset-0 rounded-lg"
                    style={{ background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${fillColor}18 0%, transparent 65%)` }}
                />
            )}
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-lg transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${fillColor}80, transparent)`, opacity: isHovered || active ? 1 : 0 }}
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

// ─── Status Select Cell ───────────────────────────────────────────────────────
function StatusSelectCell({ plan, onUpdate }: { plan: Plan; onUpdate: (id: number, status: string) => void }) {
    const [saving, setSaving] = useState(false)
    const meta = statusMeta(plan.status)

    const handleChange = async (val: string) => {
        setSaving(true)
        await onUpdate(plan.id, val)
        setSaving(false)
    }

    return (
        <Select value={plan.status} onValueChange={handleChange} disabled={saving}>
            <SelectTrigger
                className={cn(
                    'h-7 w-36 text-xs font-semibold rounded-lg px-2.5',
                    'border focus:ring-1 focus:ring-[#378ADD]/40',
                    'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    '[&>svg]:text-current',
                    meta.triggerClass,
                )}
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', meta.dot)} />
                    <SelectValue />
                </div>
            </SelectTrigger>
            <SelectContent>
                {STATUS_OPTIONS.map(s => (
                    <SelectItem
                        key={s.value}
                        value={s.value}
                        className={cn('text-xs font-semibold', s.itemClass)}
                    >
                        <div className="flex items-center gap-2">
                            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
                            {s.label}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

// ─── Due Date Cell ────────────────────────────────────────────────────────────
function DueDateCell({ plan }: { plan: Plan }) {
    const overdue = isOverdue(plan.due_date, plan.status)
    const dueSoon = isDueSoon(plan.due_date, plan.status)

    if (!plan.due_date) return <span className="text-muted-foreground italic text-xs">—</span>

    return (
        <div className="flex items-center gap-1.5">
            {overdue && <AlertTriangle className="h-3.5 w-3.5 text-[#E24B4A] shrink-0" />}
            <span className={cn(
                'text-xs tabular-nums',
                overdue && 'text-[#A32D2D] dark:text-[#F09595] font-semibold',
                dueSoon && !overdue && 'text-[#854F0B] dark:text-[#FAC775] font-semibold',
                !overdue && !dueSoon && 'text-foreground',
            )}>
                {plan.due_date}
            </span>
            {dueSoon && !overdue && (
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FAEEDA] text-[#854F0B] dark:bg-[#412402] dark:text-[#FAC775]">
                    SOON
                </span>
            )}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ActionPlansIndex({ plans: rawPlans, users }: Props) {
    const [planStatuses, setPlanStatuses] = useState<Record<number, string>>({})
    const [exportLoading, setExportLoading] = useState(false)

    // Normalize: support both LaravelPaginator and plain array
    const plans: LaravelPaginator<Plan> = Array.isArray(rawPlans)
        ? {
              data: rawPlans,
              current_page: 1,
              last_page: 1,
              per_page: rawPlans.length,
              total: rawPlans.length,
              from: 1,
              to: rawPlans.length,
              first_page_url: '',
              last_page_url: '',
              prev_page_url: null,
              next_page_url: null,
              links: [],
              path: '',
          }
        : (rawPlans ?? {
              data: [],
              current_page: 1,
              last_page: 1,
              per_page: 0,
              total: 0,
              from: 0,
              to: 0,
              first_page_url: '',
              last_page_url: '',
              prev_page_url: null,
              next_page_url: null,
              links: [],
              path: '',
          })

    // Merge optimistic status updates with server data
    const mergedData = useMemo(() =>
        (plans.data ?? []).map(p => ({
            ...p,
            status: planStatuses[p.id] ?? p.status,
        })),
        [plans.data, planStatuses]
    )

    // ── Stats (page-level) ─────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total       = plans.total
        const pageSize    = mergedData.length || 1
        const open        = mergedData.filter(p => p.status === 'open').length
        const in_progress = mergedData.filter(p => p.status === 'in_progress').length
        const overdue     = mergedData.filter(p => isOverdue(p.due_date, p.status)).length
        return {
            total, open, in_progress, overdue,
            openRate:       Math.round((open        / pageSize) * 100),
            inProgressRate: Math.round((in_progress / pageSize) * 100),
            overdueRate:    Math.round((overdue     / pageSize) * 100),
        }
    }, [mergedData, plans.total])

    const kpiCards = [
        {
            label: 'Total',
            value: stats.total,
            sub: `${plans.data.length} on page`,
            fillPercent: 100,
            fillColor: '#378add',
            icon: <CircleDot className="h-4 w-4" />,
            valueColor: 'text-foreground',
            delay: 0,
            filterKey: null as string | null,
        },
        {
            label: 'Open',
            value: stats.open,
            sub: `${stats.openRate}%`,
            fillPercent: stats.openRate,
            fillColor: '#0C447C',
            icon: <Clock className="h-4 w-4" />,
            valueColor: 'text-[#0C447C] dark:text-[#B5D4F4]',
            delay: 80,
            filterKey: 'open',
        },
        {
            label: 'In Progress',
            value: stats.in_progress,
            sub: `${stats.inProgressRate}%`,
            fillPercent: stats.inProgressRate,
            fillColor: '#ba7517',
            icon: <ClipboardList className="h-4 w-4" />,
            valueColor: 'text-[#854F0B] dark:text-[#EF9F27]',
            delay: 160,
            filterKey: 'in_progress',
        },
        {
            label: 'Overdue',
            value: stats.overdue,
            sub: `${stats.overdueRate}%`,
            fillPercent: stats.overdueRate,
            fillColor: '#a32d2d',
            icon: <Flame className="h-4 w-4" />,
            valueColor: 'text-[#A32D2D] dark:text-[#F09595]',
            delay: 240,
            filterKey: null,
        },
    ]

    // ── Status update (optimistic) ─────────────────────────────────────────
    const updateStatus = async (id: number, status: string) => {
        setPlanStatuses(prev => ({ ...prev, [id]: status }))
        try {
            await axios.patch(`/action-plans/${id}`, { status })
        } catch {
            // revert on error
            setPlanStatuses(prev => {
                const next = { ...prev }
                delete next[id]
                return next
            })
        }
    }

    // ── Export ─────────────────────────────────────────────────────────────
    const handleExport = async () => {
        setExportLoading(true)
        try {
            const params = new URLSearchParams(window.location.search)
            const response = await fetch(`/action-plans/export?${params.toString()}`, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            })
            if (!response.ok) throw new Error('Export failed')
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `action-plans-${new Date().toISOString().split('T')[0]}.xlsx`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Export error:', error)
        } finally {
            setExportLoading(false)
        }
    }

    // ── Pagination ─────────────────────────────────────────────────────────
    const goToPage = (url: string | null) => {
        if (!url) return
        router.get(url, {}, { preserveState: true, preserveScroll: true })
    }

    // ── Columns ────────────────────────────────────────────────────────────
    const columns: ColumnDef<Plan>[] = [
        {
            id: 'gap_assessment',
            header: ({ column }) => (
                <div className="flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <DataTableColumnHeader column={column} title="Gap Assessment" />
                </div>
            ),
            cell: ({ row }) => {
                const plan = row.original
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded w-fit">
                            {plan.gap_assessment_code ?? '—'}
                        </span>
                        <span className="text-xs text-foreground font-medium truncate max-w-[200px]">
                            {plan.gap_assessment_name ?? '—'}
                        </span>
                    </div>
                )
            },
            enableSorting: false,
        },
        {
            accessorKey: 'title',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Action Plan" />
            ),
            cell: ({ row }) => {
                const plan = row.original
                const overdue = isOverdue(plan.due_date, planStatuses[plan.id] ?? plan.status)
                return (
                    <div className={cn(overdue && 'opacity-90')}>
                        <p className="font-medium text-foreground leading-snug">{plan.title}</p>
                        {plan.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.description}</p>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: 'assigned_user_name',
            header: ({ column }) => (
                <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <DataTableColumnHeader column={column} title="Assigned To" />
                </div>
            ),
            cell: ({ row }) => {
                const name = row.getValue('assigned_user_name') as string | null
                return name
                    ? <span className="text-sm">{name}</span>
                    : <span className="text-muted-foreground italic text-xs">Unassigned</span>
            },
        },
        {
            accessorKey: 'due_date',
            header: ({ column }) => (
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <DataTableColumnHeader column={column} title="Due Date" />
                </div>
            ),
            cell: ({ row }) => {
                const plan = { ...row.original, status: planStatuses[row.original.id] ?? row.original.status }
                return <DueDateCell plan={plan} />
            },
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <DataTableColumnHeader column={column} title="Status" />
                </div>
            ),
            cell: ({ row }) => {
                const plan = { ...row.original, status: planStatuses[row.original.id] ?? row.original.status }
                return <StatusSelectCell plan={plan} onUpdate={updateStatus} />
            },
        },
    ]

    return (
        <AppLayout breadcrumbs={[{ title: 'Action Plans', href: '/action-plans' }]}>
            <Head title="Action Plans" />

            <div className="space-y-6 py-6 px-4">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Action Plans</h1>
                        <p className="text-muted-foreground mt-1.5">
                            Track and manage remediation actions across all assessments
                        </p>
                    </div>
                </div>

                {/* ── KPI Cards ── */}
                <div
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                    style={{ perspective: '1200px' }}
                >
                    {kpiCards.map((card) => (
                        <KpiCard key={card.label} {...card} />
                    ))}
                </div>

                <Separator className="my-6" />

                {/* ── ServerDataTable ── */}
                <ServerDataTable
                    columns={columns}
                    data={plans}
                    searchPlaceholder="Search title, assessment, assignee..."
                    onExport={handleExport}
                    exportLoading={exportLoading}
                    filters={
                        <DataTableFacetedFilter
                            filterKey="status"
                            title="Status"
                            options={[
                                { label: 'Open',        value: 'open',        icon: Clock },
                                { label: 'In Progress', value: 'in_progress', icon: ClipboardList },
                            ]}
                        />
                    }
                    initialState={{ columnPinning: { right: ['status'] } }}
                    getRowClassName={(row) => {
                        const plan = row.original as Plan
                        return isOverdue(plan.due_date, planStatuses[plan.id] ?? plan.status)
                            ? 'bg-[#FCEBEB]/20 dark:bg-[#501313]/10'
                            : ''
                    }}
                />

                {/* ── Pagination ── */}
                {plans.last_page > 1 && (
                    <div className="flex items-center justify-between px-2 py-4">
                        <p className="text-sm text-muted-foreground">
                            Showing{' '}
                            <span className="font-medium">{plans.from}</span> –{' '}
                            <span className="font-medium">{plans.to}</span> of{' '}
                            <span className="font-medium">{plans.total}</span> results
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline" size="sm"
                                disabled={!plans.prev_page_url}
                                onClick={() => goToPage(plans.prev_page_url)}
                            >
                                Previous
                            </Button>
                            {plans.links
                                .filter(l => !['&laquo; Previous', 'Next &raquo;'].includes(l.label))
                                .map((link, idx) => (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url || link.active}
                                        onClick={() => goToPage(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            <Button
                                variant="outline" size="sm"
                                disabled={!plans.next_page_url}
                                onClick={() => goToPage(plans.next_page_url)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    )
}