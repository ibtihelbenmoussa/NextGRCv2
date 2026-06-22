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
    History,
    ArrowRight,
    Loader2,
    Bot,
    Send,
    X,
    Minimize2,
    Maximize2,
    Sparkles,
} from 'lucide-react'
import axios from 'axios'
import type { ColumnDef } from '@tanstack/react-table'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Plan {
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
    filters?: {
        status?: string
        
    }
    allPlans: Plan[]
}

interface LogEntry {
    id: number
    event: string
    field: string | null
    field_label: string
    old_value: string | null
    new_value: string | null
    user_name: string
    created_at: string
}

interface ChatMessage {
    id: string
    role: 'user' | 'bot'
    text: string
    intent?: string
    timestamp: Date
    typing?: boolean
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
    {
        value: 'closed',
        label: 'Closed',
        dot: 'bg-[#166534] dark:bg-[#4ADE80]',
        triggerClass: 'bg-[#DCFCE7] text-[#166534] border-[#4ADE80]/40 dark:bg-[#14532D]/40 dark:text-[#86EFAC] dark:border-[#166534]',
        itemClass: 'text-[#166534] dark:text-[#86EFAC] focus:bg-[#DCFCE7] dark:focus:bg-[#14532D]/40',
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

// ─── Level badge ──────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
    L1: { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' },
    L2: { bg: 'bg-[#FFEDD5]', text: 'text-[#9A3412]' },
    L3: { bg: 'bg-[#FEF9C3]', text: 'text-[#854D0E]' },
    L4: { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]' },
    L5: { bg: 'bg-[#EDE9FE]', text: 'text-[#5B21B6]' },
}

function LevelBadge({ description }: { description: string }) {
    const match = description?.match(/^(L\d)\[/)
    if (!match) return null
    const level = match[1]
    const colors = LEVEL_COLORS[level] ?? { bg: 'bg-muted', text: 'text-muted-foreground' }
    return (
        <span className={cn(
            'inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded',
            colors.bg, colors.text,
        )}>
            {level}
        </span>
    )
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

// ─── Assignee Avatar Cell ─────────────────────────────────────────────────────
function AssigneeCell({ name }: { name: string | null }) {
    if (!name) return <span className="text-muted-foreground italic text-xs">Unassigned</span>
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    return (
        <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 select-none">
                {initials}
            </span>
            <span className="text-sm truncate max-w-[120px]">{name}</span>
        </div>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ activeFilter }: { activeFilter: string | null }) {
    return (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 opacity-25" />
            <p className="text-sm font-medium">
                {activeFilter
                    ? `No action plans with status "${STATUS_OPTIONS.find(s => s.value === activeFilter)?.label ?? activeFilter}".`
                    : 'No action plans found.'}
            </p>
            {activeFilter && (
                <p className="text-xs opacity-60">Try clearing the filter to see all plans.</p>
            )}
        </div>
    )
}

// ─── History Drawer ───────────────────────────────────────────────────────────
const EVENT_ICONS: Record<string, string> = {
    created: '✦',
    status_changed: '◈',
    assigned_to_changed: '◎',
    due_date_changed: '◷',
}

const STATUS_BADGE: Record<string, string> = {
    open: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    in_progress: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    closed: 'bg-green-500/15 text-green-400 border border-green-500/30',
    done: 'bg-green-500/15 text-green-400 border border-green-500/30',
}

function HistoryStatusBadge({ value }: { value: string | null }) {
    if (!value) return <span className="text-muted-foreground italic text-xs">—</span>
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', STATUS_BADGE[value] ?? 'bg-muted text-muted-foreground')}>
            {value.replace('_', ' ')}
        </span>
    )
}

function HistoryDrawer({
    planId, planTitle, open, onClose,
}: {
    planId: number | null
    planTitle: string
    open: boolean
    onClose: () => void
}) {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!open || !planId) return
        setLoading(true)
        axios
            .get(`/action-plans/${planId}/logs`)
            .then(res => setLogs(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [open, planId])

    return (
        <Sheet open={open} onOpenChange={v => !v && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md bg-background border-l border-border p-0 flex flex-col"
            >
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <History size={13} />
                        <span>History log</span>
                    </div>
                    <SheetTitle className="text-base font-semibold leading-snug line-clamp-2">
                        {planTitle}
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {loading && (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-muted-foreground" size={20} />
                        </div>
                    )}
                    {!loading && logs.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground text-sm">
                            <History size={32} className="opacity-25" />
                            <span>No activity yet</span>
                        </div>
                    )}
                    {!loading && logs.length > 0 && (
                        <ol className="relative border-l border-border ml-2 space-y-0">
                            {logs.map(log => (
                                <li key={log.id} className="ml-5 pb-6 relative">
                                    <span className="absolute -left-[1.45rem] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground text-[10px]">
                                        {EVENT_ICONS[log.event] ?? '·'}
                                    </span>
                                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-sm font-medium">
                                                {log.event === 'created' ? 'Action created' : `${log.field_label} changed`}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5 tabular-nums">
                                                {log.created_at}
                                            </span>
                                        </div>
                                        {log.event !== 'created' && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {log.field === 'status' ? (
                                                    <>
                                                        <HistoryStatusBadge value={log.old_value} />
                                                        <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                                                        <HistoryStatusBadge value={log.new_value} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-xs text-muted-foreground line-through">{log.old_value ?? '—'}</span>
                                                        <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                                                        <span className="text-xs text-foreground">{log.new_value ?? '—'}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 pt-0.5">
                                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary uppercase select-none">
                                                {log.user_name.charAt(0)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{log.user_name}</span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────
const CHAT_SUGGESTIONS = [
    { label: '🔴 Overdue', query: 'show overdue plans' },
    { label: '⏰ Due soon', query: 'due this week' },
    { label: '🎯 Priority', query: 'top priority plans' },
    { label: '👥 Workload', query: 'assignee workload' },
    { label: '📊 Summary', query: 'status summary' },
    { label: '👤 Unassigned', query: 'unassigned plans' },
]

function MessageContent({ text }: { text: string }) {
    const lines = text.split('\n')
    return (
        <div className="space-y-0.5 text-sm leading-relaxed">
            {lines.map((line, i) => {
                const rendered = line
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                if (!line.trim()) return <div key={i} className="h-1.5" />
                return (
                    <div
                        key={i}
                        dangerouslySetInnerHTML={{ __html: rendered }}
                        className="leading-relaxed"
                    />
                )
            })}
        </div>
    )
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
                />
            ))}
        </div>
    )
}

export function ActionPlanChatbot({ plans }: { plans: Plan[] }) {
    const [open, setOpen] = useState(false)
    const [minimized, setMinimized] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'bot',
            text: "👋 **Hi! I'm your Action Plans AI assistant.**\n\nI analyze your plans using local ML models.\n\nAsk me anything or pick a suggestion below:",
            timestamp: new Date(),
        },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [unread, setUnread] = useState(0)

    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setUnread(0)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open])

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, open])

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return

        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            role: 'user',
            text: text.trim(),
            timestamp: new Date(),
        }
        const typingId = `typing-${Date.now()}`
        const typingMsg: ChatMessage = {
            id: typingId,
            role: 'bot',
            text: '',
            typing: true,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMsg, typingMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await axios.post('/ml/chat', {
                question: text.trim(),
                plans,
            })
            const botMsg: ChatMessage = {
                id: `b-${Date.now()}`,
                role: 'bot',
                text: res.data.answer || 'No response',
                intent: res.data.intent,
                timestamp: new Date(),
            }
            setMessages(prev => prev.filter(m => m.id !== typingId).concat(botMsg))
            if (!open) setUnread(u => u + 1)
        } catch {
            setMessages(prev => prev.filter(m => m.id !== typingId).concat({
                id: `err-${Date.now()}`,
                role: 'bot',
                text: '⚠️ Cannot reach ML service. Make sure Flask is running on port 5000.',
                timestamp: new Date(),
            }))
        } finally {
            setLoading(false)
        }
    }

    const activeCount = plans.filter(p => p.status !== 'closed').length
    const overdueCount = plans.filter(p => {
        if (!p.due_date || p.status === 'closed') return false
        return new Date(p.due_date) < new Date()
    }).length

    return (
        <>
            {/* ── Floating Button ── */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                {overdueCount > 0 && !open && (
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
                )}
                <button
                    onClick={() => { setOpen(o => !o); setMinimized(false) }}
                    className={cn(
                        'relative flex items-center gap-2.5 px-4 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all duration-300',
                        open
                            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95',
                    )}
                >
                    {open ? <X size={17} /> : <Bot size={17} />}
                    {open ? 'Close' : 'AI Assistant'}
                    {!open && unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {unread}
                        </span>
                    )}
                    {!open && overdueCount > 0 && (
                        <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {overdueCount} overdue
                        </span>
                    )}
                </button>
            </div>

            {/* ── Chat Window ── */}
            {open && (
                <div
                    className={cn(
                        'fixed bottom-20 right-6 z-50 w-[380px] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden transition-all duration-300',
                        minimized ? 'h-14' : 'h-[560px]',
                    )}
                    style={{ boxShadow: '0 24px 60px -12px rgba(0,0,0,0.35)' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                                <Bot size={16} className="text-primary" />
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold leading-none">Plans AI</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {activeCount} active · ML-powered
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setMinimized(m => !m)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {!minimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            'flex gap-2',
                                            msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                                        )}
                                    >
                                        {msg.role === 'bot' && (
                                            <div className="shrink-0 w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                                                <Sparkles size={13} className="text-primary" />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                'max-w-[85%] px-3.5 py-2.5 rounded-2xl',
                                                msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                    : 'bg-muted/60 border border-border/50 rounded-tl-sm',
                                            )}
                                        >
                                            {msg.typing
                                                ? <TypingDots />
                                                : <MessageContent text={msg.text} />
                                            }
                                            {msg.intent && msg.intent !== 'unknown' && msg.role === 'bot' && (
                                                <span className="inline-block mt-1.5 text-[9px] font-mono text-muted-foreground/60 bg-muted/40 px-1.5 py-0.5 rounded">
                                                    {msg.intent}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            {/* Suggestions */}
                            <div className="px-3 pb-2 flex gap-1.5 flex-wrap border-t border-border/50 pt-2 shrink-0">
                                {CHAT_SUGGESTIONS.map(s => (
                                    <button
                                        key={s.query}
                                        onClick={() => sendMessage(s.query)}
                                        disabled={loading}
                                        className="text-[11px] px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/50 transition-colors disabled:opacity-50"
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* Input */}
                            <form
                                onSubmit={e => { e.preventDefault(); sendMessage(input) }}
                                className="px-3 pb-3 pt-1 shrink-0"
                            >
                                <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-xl px-3 py-2 focus-within:border-primary/50 focus-within:bg-muted/60 transition-all">
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Ask about your plans..."
                                        disabled={loading}
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-60"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || loading}
                                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-primary/90 active:scale-95"
                                    >
                                        {loading
                                            ? <Loader2 size={13} className="animate-spin" />
                                            : <Send size={13} />
                                        }
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ActionPlansIndex({ plans: rawPlans, users, filters: serverFilters, allPlans }: Props) {
    const [planStatuses, setPlanStatuses] = useState<Record<number, string>>({})
    const [exportLoading, setExportLoading] = useState(false)
    const [historyPlan, setHistoryPlan] = useState<{ id: number; title: string } | null>(null)
    const [activeFilter, setActiveFilter] = useState<string | null>(serverFilters?.status ?? null)

    const plans: LaravelPaginator<Plan> = Array.isArray(rawPlans)
        ? {
            data: rawPlans, current_page: 1, last_page: 1,
            per_page: rawPlans.length, total: rawPlans.length,
            from: 1, to: rawPlans.length,
            first_page_url: '', last_page_url: '',
            prev_page_url: null, next_page_url: null, links: [], path: '',
        }
        : (rawPlans ?? {
            data: [], current_page: 1, last_page: 1, per_page: 0, total: 0,
            from: 0, to: 0, first_page_url: '', last_page_url: '',
            prev_page_url: null, next_page_url: null, links: [], path: '',
        })

    const mergedData = useMemo(() =>
        (plans.data ?? []).map(p => ({ ...p, status: planStatuses[p.id] ?? p.status })),
        [plans.data, planStatuses]
    )

    const stats = useMemo(() => {
        const total = plans.total
        const pageSize = mergedData.length || 1
        const open = mergedData.filter(p => p.status === 'open').length
        const in_progress = mergedData.filter(p => p.status === 'in_progress').length
        const closed = mergedData.filter(p => p.status === 'closed').length
        const overdue = mergedData.filter(p => isOverdue(p.due_date, p.status)).length
        return {
            total, open, in_progress, closed, overdue,
            openRate: Math.round((open / pageSize) * 100),
            inProgressRate: Math.round((in_progress / pageSize) * 100),
            closedRate: Math.round((closed / pageSize) * 100),
            overdueRate: Math.round((overdue / pageSize) * 100),
        }
    }, [mergedData, plans.total])

    const handleKpiClick = (filterKey: string | null) => {
        if (!filterKey) return
        const next = activeFilter === filterKey ? null : filterKey
        setActiveFilter(next)
        router.get('/action-plans', next ? { status: next } : {}, {
            preserveState: true, preserveScroll: true,
        })
    }

    const kpiCards = [
        { label: 'Total', value: stats.total, sub: `${plans.data.length} on page`, fillPercent: 100, fillColor: '#378add', icon: <CircleDot className="h-4 w-4" />, valueColor: 'text-foreground', delay: 0, filterKey: null as string | null },
        { label: 'Open', value: stats.open, sub: `${stats.openRate}%`, fillPercent: stats.openRate, fillColor: '#0C447C', icon: <Clock className="h-4 w-4" />, valueColor: 'text-[#0C447C] dark:text-[#B5D4F4]', delay: 80, filterKey: 'open' },
        { label: 'In Progress', value: stats.in_progress, sub: `${stats.inProgressRate}%`, fillPercent: stats.inProgressRate, fillColor: '#ba7517', icon: <ClipboardList className="h-4 w-4" />, valueColor: 'text-[#854F0B] dark:text-[#EF9F27]', delay: 160, filterKey: 'in_progress' },
        { label: 'Closed', value: stats.closed, sub: `${stats.closedRate}%`, fillPercent: stats.closedRate, fillColor: '#166534', icon: <CheckCircle2 className="h-4 w-4" />, valueColor: 'text-[#166534] dark:text-[#4ADE80]', delay: 240, filterKey: 'closed' },
        { label: 'Overdue', value: stats.overdue, sub: `${stats.overdueRate}%`, fillPercent: stats.overdueRate, fillColor: '#a32d2d', icon: <Flame className="h-4 w-4" />, valueColor: 'text-[#A32D2D] dark:text-[#F09595]', delay: 320, filterKey: null },
    ]

    const updateStatus = async (id: number, status: string) => {
        setPlanStatuses(prev => ({ ...prev, [id]: status }))
        try {
            await axios.patch(`/action-plans/${id}`, { status })
        } catch {
            setPlanStatuses(prev => { const next = { ...prev }; delete next[id]; return next })
        }
    }

    const handleExport = async () => {
        setExportLoading(true)
        try {
            const params = new URLSearchParams(window.location.search)
            const response = await fetch(`/action-plans/export?${params.toString()}`, {
                method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest' },
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

    const goToPage = (url: string | null) => {
        if (!url) return
        router.get(url, {}, { preserveState: true, preserveScroll: true })
    }

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
            header: ({ column }) => <DataTableColumnHeader column={column} title="Action Plan" />,
            cell: ({ row }) => {
                const plan = row.original
                const currentStatus = planStatuses[plan.id] ?? plan.status
                const overdue = isOverdue(plan.due_date, currentStatus)
                return (
                    <div className={cn(overdue && 'opacity-90')}>
                        <div className="flex items-center gap-1.5">
                            <p className="font-medium text-foreground leading-snug">{plan.title}</p>
                            {plan.description && <LevelBadge description={plan.description} />}
                        </div>
                        {plan.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {plan.description.replace(/^L\d\[\d+\]\|[^:]+:\s*/, '')}
                            </p>
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
            cell: ({ row }) => <AssigneeCell name={row.getValue('assigned_user_name')} />,
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
        {
            id: 'history',
            header: () => null,
            cell: ({ row }) => (
                <button
                    onClick={() => setHistoryPlan({ id: row.original.id, title: row.original.title })}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="View history"
                >
                    <History size={15} />
                </button>
            ),
            enableSorting: false,
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" style={{ perspective: '1200px' }}>
                    {kpiCards.map((card) => (
                        <KpiCard
                            key={card.label}
                            {...card}
                            onClick={card.filterKey ? () => handleKpiClick(card.filterKey) : undefined}
                            active={card.filterKey !== null && activeFilter === card.filterKey}
                        />
                    ))}
                </div>

                {/* ── Active filter banner ── */}
                {activeFilter && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                            Filtered by status:{' '}
                            <span className="font-semibold text-foreground">
                                {STATUS_OPTIONS.find(s => s.value === activeFilter)?.label}
                            </span>
                        </span>
                        <button
                            onClick={() => handleKpiClick(activeFilter)}
                            className="text-xs underline underline-offset-2 hover:text-foreground transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                )}

                <Separator className="my-6" />

                {/* ── Empty State ── */}
                {plans.total === 0 ? (
                    <EmptyState activeFilter={activeFilter} />
                ) : (
                    <>
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
                                        { label: 'Open', value: 'open', icon: Clock },
                                        { label: 'In Progress', value: 'in_progress', icon: ClipboardList },
                                        { label: 'Closed', value: 'closed', icon: CheckCircle2 },
                                    ]}
                                />
                            }
                            initialState={{ columnPinning: { right: ['status'] } }}
                            getRowClassName={(row) => {
                                const plan = row.original as Plan
                                const currentStatus = planStatuses[plan.id] ?? plan.status
                                if (currentStatus === 'closed') return 'opacity-60'
                                return isOverdue(plan.due_date, currentStatus)
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
                               
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── History Drawer ── */}
            <HistoryDrawer
                planId={historyPlan?.id ?? null}
                planTitle={historyPlan?.title ?? ''}
                open={!!historyPlan}
                onClose={() => setHistoryPlan(null)}
            />

            {/* ── AI Chatbot ── */}
            <ActionPlanChatbot plans={allPlans} />


        </AppLayout>
    )
}