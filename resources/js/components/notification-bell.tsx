import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { Bell, AlertTriangle, Clock, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppNotification {
    id: number
    object: string
    date: string
    is_read: boolean
    days_remaining: number
    action_plan_id: number
}

// ─── Date formatter ───────────────────────────────────────────────────────────
function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return iso
    }
}

// ─── Urgency config ───────────────────────────────────────────────────────────
function urgencyMeta(days: number) {
    if (days === 0) return {
        label: 'Due today',
        dot: 'bg-[#991B1B]',
        badge: 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#450a0a]/60 dark:text-[#fca5a5]',
        border: 'border-l-[#E24B4A]',
        group: 'urgent',
    }
    if (days <= 3) return {
        label: `${days}d left`,
        dot: 'bg-[#9A3412]',
        badge: 'bg-[#FFEDD5] text-[#9A3412] dark:bg-[#431407]/60 dark:text-[#fdba74]',
        border: 'border-l-[#EA580C]',
        group: 'urgent',
    }
    if (days <= 7) return {
        label: `${days}d left`,
        dot: 'bg-[#854D0E]',
        badge: 'bg-[#FEF9C3] text-[#854D0E] dark:bg-[#422006]/60 dark:text-[#fde047]',
        border: 'border-l-[#CA8A04]',
        group: 'upcoming',
    }
    return {
        label: `${days}d left`,
        dot: 'bg-[#0C447C]',
        badge: 'bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0c447c]/30 dark:text-[#B5D4F4]',
        border: 'border-l-[#378ADD]',
        group: 'upcoming',
    }
}

// ─── Group label ──────────────────────────────────────────────────────────────
function GroupLabel({ label, icon }: { label: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 sticky top-0 z-10">
            {icon}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
        </div>
    )
}

// ─── Single notification row ──────────────────────────────────────────────────
function NotifRow({
    notif,
    onRead,
}: {
    notif: AppNotification
    onRead: (id: number) => void
}) {
    const meta = urgencyMeta(notif.days_remaining)

    const handleView = (e: React.MouseEvent) => {
        e.stopPropagation()
        window.location.href = `/action-plans/${notif.action_plan_id}`
    }

    return (
        <div
            onClick={() => !notif.is_read && onRead(notif.id)}
            className={cn(
                'flex gap-3 px-3 py-2.5 border-l-2 transition-colors group',
                meta.border,
                notif.is_read
                    ? 'opacity-50 cursor-default'
                    : 'cursor-pointer hover:bg-muted/50',
            )}
        >
            {/* urgency dot */}
            <div className="mt-1 shrink-0">
                <span className={cn('block w-2 h-2 rounded-full', meta.dot)} />
            </div>

            {/* content */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    'text-xs leading-snug line-clamp-2',
                    notif.is_read ? 'text-muted-foreground' : 'text-foreground font-medium',
                )}>
                    {notif.object}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                        meta.badge,
                    )}>
                        {meta.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        {formatDate(notif.date)}
                    </span>
                </div>
            </div>

            {/* view button + unread dot */}
            <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                    onClick={handleView}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="View action plan"
                >
                    <ExternalLink className="h-3 w-3" />
                </button>
                {!notif.is_read && (
                    <span className="block w-1.5 h-1.5 rounded-full bg-primary mt-auto" />
                )}
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 5 * 60 * 1000

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const mountedRef = useRef(true)

    const fetchNotifications = useCallback(async () => {
        if (!mountedRef.current) return
        try {
            setLoading(true)
            const { data } = await axios.get<AppNotification[]>('/notifications')
            if (mountedRef.current) setNotifications(data)
        } catch {
        } finally {
            if (mountedRef.current) setLoading(false)
        }
    }, [])

    const scheduleNext = useCallback(() => {
        timeoutRef.current = setTimeout(async () => {
            await fetchNotifications()
            scheduleNext()
        }, POLL_INTERVAL_MS)
    }, [fetchNotifications])

    useEffect(() => {
        mountedRef.current = true
        fetchNotifications()
        scheduleNext()
        return () => {
            mountedRef.current = false
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [fetchNotifications, scheduleNext])

    const handleRead = async (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        try {
            await axios.patch(`/notifications/${id}/read`)
        } catch {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n))
        }
    }

    const handleReadAll = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        try {
            await axios.patch('/notifications/read-all')
        } catch {
            await fetchNotifications()
        }
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    const handleOpenChange = (val: boolean) => {
        setOpen(val)
        if (val && unreadCount > 0) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            axios.patch('/notifications/read-all').catch(() => fetchNotifications())
        }
    }

    // ── Grouping ───────────────────────────────────────────────────────────
    const urgent   = notifications.filter(n => n.days_remaining <= 3)
    const upcoming = notifications.filter(n => n.days_remaining > 3)

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        'relative flex h-8 w-8 items-center justify-center rounded-md',
                        'bg-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-sidebar-accent focus:ring-offset-2',
                        'transition-colors',
                    )}
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                    <Bell className={cn(
                        'h-4 w-4 transition-all duration-300',
                        unreadCount > 0 && 'text-primary',
                        loading && 'animate-pulse',
                    )} />

                    {/* Badge with pulse */}
                    {unreadCount > 0 && (
                        <span className={cn(
                            'absolute -top-0.5 -right-0.5',
                            'min-w-4 h-4 px-1',
                            'flex items-center justify-center',
                            'rounded-full bg-destructive text-destructive-foreground',
                            'text-[10px] font-bold leading-none',
                            'ring-1 ring-background',
                            'animate-in zoom-in-50 duration-200',
                        )}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                            {/* pulse ring */}
                            <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-40" />
                        </span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent align="end" sideOffset={8} className="w-80 p-0 shadow-lg">

                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-sm font-semibold">Deadline Alerts</span>
                        {notifications.length > 0 && (
                            <span className="text-xs bg-muted text-muted-foreground font-medium px-1.5 py-0.5 rounded-full">
                                {notifications.length}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                            onClick={handleReadAll}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                <Separator />

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                            <Clock className="h-7 w-7 opacity-20" />
                            <p className="text-xs">All deadlines are on track</p>
                        </div>
                    ) : (
                        <>
                            {urgent.length > 0 && (
                                <>
                                    <GroupLabel
                                        label="Urgent"
                                        icon={<AlertTriangle className="h-3 w-3 text-red-500" />}
                                    />
                                    <div className="divide-y divide-border/50">
                                        {urgent.map(notif => (
                                            <NotifRow key={notif.id} notif={notif} onRead={handleRead} />
                                        ))}
                                    </div>
                                </>
                            )}
                            {upcoming.length > 0 && (
                                <>
                                    <GroupLabel
                                        label="Upcoming"
                                        icon={<Clock className="h-3 w-3 text-amber-500" />}
                                    />
                                    <div className="divide-y divide-border/50">
                                        {upcoming.map(notif => (
                                            <NotifRow key={notif.id} notif={notif} onRead={handleRead} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <>
                        <Separator />
                        <div className="px-3 py-2 text-center">
                            <span className="text-[10px] text-muted-foreground">
                                Refreshes every 5 min · {notifications.length} total
                            </span>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    )
}