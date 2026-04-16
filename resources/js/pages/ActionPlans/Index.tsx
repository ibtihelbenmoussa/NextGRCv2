import { useMemo, useState, useEffect, useRef } from 'react'
import { Head, Link, router, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem, PaginatedData } from '@/types'
import { ServerDataTable } from '@/components/server-data-table'
import { DataTableColumnHeader } from '@/components/server-data-table-column-header'
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from '@/components/server-data-table-faceted-filter'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  CircleDot,
  TrendingUp,
  CalendarClock,
  User2,
  ArrowLeft,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: number
  name: string
}

interface Requirement {
  id: number
  title: string
  code?: string
}

interface GapAssessment {
  id: number
  requirement: Requirement
}

interface ActionPlan {
  id: number
  gap_id: number
  title: string
  description: string | null
  assigned_to: number
  due_date: string | null
  status: 'open' | 'in_progress' | 'done'
  created_at: string
  gap: GapAssessment | null
  assignee: User | null
}

interface Props {
  actionPlans: PaginatedData<ActionPlan>
  users: User[]
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Compliance Management', href: '/compliance-management' },
  { title: 'Gap Assessment', href: '/gapassessment' },
  { title: 'Action Plans', href: '/action-plans' },
]

// ─── Style maps ───────────────────────────────────────────────────────────────

const statusStyles: Record<string, { pill: string; dot: string }> = {
  open: {
    pill: 'bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4]',
    dot: 'bg-[#185FA5] dark:bg-[#85B7EB]',
  },
  in_progress: {
    pill: 'bg-[#FAEEDA] text-[#412402] dark:bg-[#412402] dark:text-[#FAC775]',
    dot: 'bg-[#854F0B] dark:bg-[#EF9F27]',
  },
  done: {
    pill: 'bg-[#EAF3DE] text-[#27500A] dark:bg-[#27500A] dark:text-[#C0DD97]',
    dot: 'bg-[#3B6D11] dark:bg-[#97C459]',
  },
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  done: 'Done',
}

const fallbackStyle = {
  pill: 'bg-[#F1EFE8] text-[#444441] dark:bg-[#444441] dark:text-[#D3D1C7]',
  dot: 'bg-[#888780]',
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ value }: { value: string }) {
  const key = value?.toLowerCase() ?? ''
  const s = statusStyles[key] ?? fallbackStyle
  const label = statusLabels[key] ?? (key.charAt(0).toUpperCase() + key.slice(1))
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', s.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      {label || '—'}
    </span>
  )
}

// ─── useCountUp ───────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])
  return value
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, fillPercent, fillColor, icon, valueColor, delay = 0 }: {
  label: string; value: number | string; sub?: string
  fillPercent?: number; fillColor: string; icon: React.ReactNode
  valueColor?: string; delay?: number
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
    const card = cardRef.current; if (!card) return
    const rect = card.getBoundingClientRect()
    setTilt({
      x: ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -10,
      y: ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 10,
    })
    setGlowPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 })
  }

  const isH = isHovered
  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setIsHovered(false) }}
      style={{
        transform: isH
          ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04) translateY(-3px)`
          : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: isH
          ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out, opacity 0.5s ease-out'
          : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease-out, opacity 0.5s ease-out',
        boxShadow: isH
          ? `0 12px 32px -8px ${fillColor}40, 0 4px 16px -4px ${fillColor}25`
          : '0 1px 3px rgba(0,0,0,0.12)',
        opacity: mounted ? 1 : 0,
      }}
      className="bg-muted/40 rounded-lg p-4 flex flex-col gap-1.5 cursor-default relative overflow-hidden"
    >
      {isH && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{ background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${fillColor}18 0%, transparent 65%)` }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-lg transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${fillColor}80, transparent)`, opacity: isH ? 1 : 0 }}
      />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs text-muted-foreground font-mono tracking-wide uppercase">{label}</span>
        <span className={cn('transition-all duration-300', isH ? 'text-foreground/80 scale-110' : 'text-muted-foreground/60')}>{icon}</span>
      </div>
      <div className={cn('text-2xl font-semibold leading-none tabular-nums relative z-10', valueColor, isH && 'scale-105 origin-left')}>
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
            transition: isH ? 'width 0.3s ease-out' : `width 900ms cubic-bezier(0.4,0,0.2,1) ${delay + 150}ms`,
            filter: isH ? `drop-shadow(0 0 3px ${fillColor})` : 'none',
          }}
        />
      </div>
    </div>
  )
}

// ─── EditActionSheet ──────────────────────────────────────────────────────────

function EditActionSheet({ plan, users, open, onClose }: {
  plan: ActionPlan | null
  users: User[]
  open: boolean
  onClose: () => void
}) {
  const { data, setData, patch, processing, errors, reset } = useForm({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    status: 'open' as ActionPlan['status'],
  })

  useEffect(() => {
    if (plan) {
      setData({
        title: plan.title,
        description: plan.description ?? '',
        assigned_to: String(plan.assigned_to),
        due_date: plan.due_date ? plan.due_date.split('T')[0] : '',
        status: plan.status,
      })
    }
  }, [plan])

  const submit = () => {
    if (!plan) return
    patch(`/action-plans/${plan.id}`, {
      onSuccess: () => { reset(); onClose() },
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Action Plan
          </SheetTitle>
          {plan?.gap && (
            <SheetDescription>
              Linked to:{' '}
              <span className="font-medium text-foreground">
                {plan.gap.requirement?.code} — {plan.gap.requirement?.title}
              </span>
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              value={data.title}
              onChange={(e) => setData('title', e.target.value)}
              placeholder="e.g. Implement access controls"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              placeholder="Describe the corrective action..."
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status <span className="text-destructive">*</span></Label>
            <Select
              value={data.status}
              onValueChange={(v) => setData('status', v as ActionPlan['status'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-blue-500" /> Open
                  </span>
                </SelectItem>
                <SelectItem value="in_progress">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-500" /> In Progress
                  </span>
                </SelectItem>
                <SelectItem value="done">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Done
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
          </div>

          {/* Assigned To */}
          <div className="space-y-1.5">
            <Label>Assigned To <span className="text-destructive">*</span></Label>
            <Select
              value={String(data.assigned_to)}
              onValueChange={(v) => setData('assigned_to', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigned_to && <p className="text-xs text-destructive">{errors.assigned_to}</p>}
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-due">
              Due Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-due"
              type="date"
              value={data.due_date}
              onChange={(e) => setData('due_date', e.target.value)}
            />
            {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
          </div>

          <Separator />

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={submit} disabled={processing}>
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── QuickStatusDropdown ──────────────────────────────────────────────────────

function QuickStatusDropdown({ plan }: { plan: ActionPlan }) {
  const handleChange = (newStatus: string) => {
    router.patch(
      `/action-plans/${plan.id}`,
      { status: newStatus },
      { preserveScroll: true },
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer">
          <StatusPill value={plan.status} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Change status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(['open', 'in_progress', 'done'] as const).map((s) => (
          <DropdownMenuItem
            key={s}
            disabled={plan.status === s}
            onClick={() => handleChange(s)}
            className={cn(plan.status === s && 'opacity-50 cursor-default')}
          >
            {s === 'open' && <AlertCircle className="mr-2 h-3.5 w-3.5 text-blue-500" />}
            {s === 'in_progress' && <Clock className="mr-2 h-3.5 w-3.5 text-amber-500" />}
            {s === 'done' && <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-green-500" />}
            {statusLabels[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActionPlansIndex({ actionPlans, users }: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<ActionPlan | null>(null)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [planToEdit, setPlanToEdit] = useState<ActionPlan | null>(null)

  // ── Stats ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const data = actionPlans.data
    const total = data.length || 1
    const open = data.filter((p) => p.status === 'open').length
    const inProgress = data.filter((p) => p.status === 'in_progress').length
    const done = data.filter((p) => p.status === 'done').length
    const overdue = data.filter(
      (p) => p.status !== 'done' && p.due_date && new Date(p.due_date) < new Date(),
    ).length
    return {
      total: data.length, open, inProgress, done, overdue,
      openRate: Math.round((open / total) * 100),
      inProgressRate: Math.round((inProgress / total) * 100),
      doneRate: Math.round((done / total) * 100),
      overdueRate: Math.round((overdue / total) * 100),
    }
  }, [actionPlans.data])

  const kpiCards = [
    {
      label: 'Total',
      value: stats.total,
      sub: `${actionPlans.data.length} on page`,
      fillPercent: 100,
      fillColor: '#378add',
      icon: <CircleDot className="h-4 w-4" />,
      valueColor: 'text-foreground',
      delay: 0,
    },
    {
      label: 'Open',
      value: stats.open,
      sub: `${stats.openRate}%`,
      fillPercent: stats.openRate,
      fillColor: '#378add',
      icon: <AlertCircle className="h-4 w-4" />,
      valueColor: stats.open > 0 ? 'text-[#185FA5] dark:text-[#85B7EB]' : 'text-foreground',
      delay: 80,
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      sub: `${stats.inProgressRate}%`,
      fillPercent: stats.inProgressRate,
      fillColor: '#ba7517',
      icon: <Clock className="h-4 w-4" />,
      valueColor: stats.inProgress > 0 ? 'text-[#854F0B] dark:text-[#EF9F27]' : 'text-foreground',
      delay: 160,
    },
    {
      label: 'Done',
      value: stats.done,
      sub: `${stats.doneRate}%`,
      fillPercent: stats.doneRate,
      fillColor: '#639922',
      icon: <CheckCircle2 className="h-4 w-4" />,
      valueColor: stats.done > 0 ? 'text-[#3B6D11] dark:text-[#97C459]' : 'text-foreground',
      delay: 240,
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      sub: `${stats.overdueRate}%`,
      fillPercent: stats.overdueRate,
      fillColor: '#e24b4a',
      icon: <CalendarClock className="h-4 w-4" />,
      valueColor: stats.overdue > 0 ? 'text-[#A32D2D] dark:text-[#F09595]' : 'text-foreground',
      delay: 320,
    },
  ]

  // ── Status filter options ─────────────────────────────────────
  const statusOptions: FacetedFilterOption[] = [
    { label: 'Open', value: 'open', icon: AlertCircle },
    { label: 'In Progress', value: 'in_progress', icon: Clock },
    { label: 'Done', value: 'done', icon: CheckCircle2 },
  ]

  // ── Columns ──────────────────────────────────────────────────
  const columns: ColumnDef<ActionPlan>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Title" />
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.title}</span>
      ),
    },
    {
      id: 'gap',
      accessorFn: (row) => row.gap?.requirement?.title ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Linked Gap" />
      ),
      cell: ({ row }) => {
        const gap = row.original.gap
        if (!gap) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <div className="flex flex-col gap-0.5 max-w-[200px]">
            {gap.requirement?.code && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {gap.requirement.code}
              </span>
            )}
            <span className="text-xs text-muted-foreground line-clamp-1">
              {gap.requirement?.title ?? '—'}
            </span>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      cell: ({ row }) => <QuickStatusDropdown plan={row.original} />,
    },
    {
      id: 'assignee',
      accessorFn: (row) => row.assignee?.name ?? '',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <User2 className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Assigned To" />
        </div>
      ),
      cell: ({ row }) => {
        const assignee = row.original.assignee
        if (!assignee) return <span className="text-muted-foreground text-xs">Unassigned</span>
        return (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground flex-shrink-0">
              {assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm">{assignee.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'due_date',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Due Date" />
        </div>
      ),
      cell: ({ row }) => {
        const due = row.original.due_date
        if (!due) return <span className="text-muted-foreground text-xs">—</span>

        const dueDate = new Date(due)
        const isOverdue = row.original.status !== 'done' && dueDate < new Date()

        return (
          <div className="flex items-center gap-1.5">
            <span className={cn('text-xs whitespace-nowrap', isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
              {dueDate.toLocaleDateString('fr-TN', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                overdue
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.getValue('created_at')).toLocaleDateString('fr-TN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const plan = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => { setPlanToEdit(plan); setEditSheetOpen(true) }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10"
                onClick={() => { setPlanToDelete(plan); setDeleteDialogOpen(true) }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const handleDeleteConfirm = () => {
    if (planToDelete) {
      router.delete(`/action-plans/${planToDelete.id}`, {
        onSuccess: () => { setDeleteDialogOpen(false); setPlanToDelete(null) },
      })
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Action Plans" />

      <div className="space-y-6 py-6 px-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <Link href="/gapassessment">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Action Plans</h1>
            </div>
            <p className="text-muted-foreground mt-1.5 ml-9">
              Track remediation actions linked to compliance gaps
            </p>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" style={{ perspective: '1200px' }}>
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>

        <Separator className="my-6" />

        {/* ── Table ── */}
        <ServerDataTable
          columns={columns}
          data={actionPlans}
          searchPlaceholder="Search action plans..."
          filters={
            <DataTableFacetedFilter
              filterKey="status"
              title="Status"
              options={statusOptions}
            />
          }
          initialState={{ columnPinning: { right: ['actions'] } }}
        />
      </div>

      {/* ── Edit Sheet ── */}
      <EditActionSheet
        plan={planToEdit}
        users={users}
        open={editSheetOpen}
        onClose={() => { setEditSheetOpen(false); setPlanToEdit(null) }}
      />

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{planToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}