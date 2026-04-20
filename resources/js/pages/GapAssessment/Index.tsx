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
import { Separator } from '@/components/ui/separator'
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Plus,
  CircleDot,
  ListTodo,
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
  requirement_id: number
  current_state: string | null
  expected_state: string | null
  gap_description: string | null
  compliance_level: 'compliant' | 'partial' | 'non_compliant'
  score: number | null
  recommendation: string | null
  created_at: string
  requirement: Requirement
}

interface Props {
  gapAssessments: PaginatedData<GapAssessment>
  users: User[]
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Gap Assessment', href: '/gapassessment' },
]

// ─── Style maps ───────────────────────────────────────────────────────────────

const complianceStyles: Record<string, {
  pill: string; dot: string
}> = {
  compliant: {
    pill: 'bg-[#EAF3DE] text-[#27500A] dark:bg-[#27500A] dark:text-[#C0DD97]',
    dot: 'bg-[#3B6D11] dark:bg-[#97C459]',
  },
  partial: {
    pill: 'bg-[#FAEEDA] text-[#412402] dark:bg-[#412402] dark:text-[#FAC775]',
    dot: 'bg-[#854F0B] dark:bg-[#EF9F27]',
  },
  non_compliant: {
    pill: 'bg-[#FCEBEB] text-[#501313] dark:bg-[#501313] dark:text-[#F7C1C1]',
    dot: 'bg-[#A32D2D] dark:bg-[#E24B4A]',
  },
}

const fallbackStyle = {
  pill: 'bg-[#F1EFE8] text-[#444441] dark:bg-[#444441] dark:text-[#D3D1C7]',
  dot: 'bg-[#888780]',
}

const complianceLabels: Record<string, string> = {
  compliant: 'Compliant',
  partial: 'Partial',
  non_compliant: 'Non Compliant',
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ value, styleMap, labelMap }: {
  value: string
  styleMap: typeof complianceStyles
  labelMap?: Record<string, string>
}) {
  const key = value?.toLowerCase() ?? ''
  const s = styleMap[key] ?? fallbackStyle
  const label = labelMap?.[key] ?? (key.charAt(0).toUpperCase() + key.slice(1))
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', s.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      {label || '—'}
    </span>
  )
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs">—</span>
  const color = score >= 75 ? '#3B6D11' : score >= 40 ? '#854F0B' : '#A32D2D'
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(Math.max(score, 0), 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium tabular-nums w-9 text-right">{score}%</span>
    </div>
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
    setTilt({ x: ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -10, y: ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 10 })
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
        transform: isH ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04) translateY(-3px)` : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: isH ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out, opacity 0.5s ease-out' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease-out, opacity 0.5s ease-out',
        boxShadow: isH ? `0 12px 32px -8px ${fillColor}40, 0 4px 16px -4px ${fillColor}25` : '0 1px 3px rgba(0,0,0,0.12)',
        opacity: mounted ? 1 : 0,
      }}
      className="bg-muted/40 rounded-lg p-4 flex flex-col gap-1.5 cursor-default relative overflow-hidden"
    >
      {isH && <div className="pointer-events-none absolute inset-0 rounded-lg" style={{ background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${fillColor}18 0%, transparent 65%)` }} />}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-lg transition-opacity duration-300" style={{ background: `linear-gradient(90deg, transparent, ${fillColor}80, transparent)`, opacity: isH ? 1 : 0 }} />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs text-muted-foreground font-mono tracking-wide uppercase">{label}</span>
        <span className={cn('transition-all duration-300', isH ? 'text-foreground/80 scale-110' : 'text-muted-foreground/60')}>{icon}</span>
      </div>
      <div className={cn('text-2xl font-semibold leading-none tabular-nums relative z-10', valueColor, isH && 'scale-105 origin-left')}>
        {typeof value === 'number' ? animatedValue : value}
      </div>
      {sub && <div className={cn('text-xs font-mono relative z-10 transition-opacity duration-500', mounted ? 'opacity-100' : 'opacity-0')} style={{ color: fillColor, transitionDelay: `${delay + 350}ms` }}>{sub}</div>}
      <div className="h-0.5 rounded-full bg-border mt-1 overflow-hidden relative z-10">
        <div className="h-0.5 rounded-full" style={{ width: `${Math.min(barWidth, 100)}%`, backgroundColor: fillColor, transition: isH ? 'width 0.3s ease-out' : `width 900ms cubic-bezier(0.4,0,0.2,1) ${delay + 150}ms`, filter: isH ? `drop-shadow(0 0 3px ${fillColor})` : 'none' }} />
      </div>
    </div>
  )
}

// ─── CreateActionForm (inside Sheet) ─────────────────────────────────────────

function CreateActionSheet({ gap, users, open, onClose }: {
  gap: GapAssessment | null
  users: User[]
  open: boolean
  onClose: () => void
}) {
  const { data, setData, post, processing, errors, reset } = useForm({
    gap_id: gap?.id ?? '',
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    status: 'open',
  })

  // sync gap_id when gap changes
  useEffect(() => {
    if (gap) setData('gap_id', gap.id)
  }, [gap])

  const submit = () => {
    post('/action-plans', {
      onSuccess: () => { reset(); onClose() },
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            Create Action Plan
          </SheetTitle>
          {gap && (
            <SheetDescription>
              Linked to: <span className="font-medium text-foreground">{gap.requirement?.code} — {gap.requirement?.title}</span>
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="ap-title"
              value={data.title}
              onChange={e => setData('title', e.target.value)}
              placeholder="e.g. Implement access controls"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-desc">Description</Label>
            <Textarea
              id="ap-desc"
              value={data.description}
              onChange={e => setData('description', e.target.value)}
              placeholder="Describe the corrective action..."
              rows={3}
            />
          </div>

          {/* Assigned To */}
          <div className="space-y-1.5">
            <Label>Assigned To <span className="text-destructive">*</span></Label>
            <Select value={String(data.assigned_to)} onValueChange={v => setData('assigned_to', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users?.map(u => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigned_to && <p className="text-xs text-destructive">{errors.assigned_to}</p>}
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-due">Due Date <span className="text-destructive">*</span></Label>
            <Input
              id="ap-due"
              type="date"
              value={data.due_date}
              onChange={e => setData('due_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
          </div>

          <Separator />

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={submit} disabled={processing}>
              {processing ? 'Creating...' : 'Create Action'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GapAssessmentIndex({ gapAssessments, users }: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState<GapAssessment | null>(null)
  const [actionSheetOpen, setActionSheetOpen] = useState(false)
  const [selectedGap, setSelectedGap] = useState<GapAssessment | null>(null)

  // ── Stats ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const data = gapAssessments.data
    const total = data.length || 1
    const compliant = data.filter(g => g.compliance_level === 'compliant').length
    const partial = data.filter(g => g.compliance_level === 'partial').length
    const nonCompliant = data.filter(g => g.compliance_level === 'non_compliant').length
    const scores = data.filter(g => g.score !== null).map(g => g.score!)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
    return {
      total: data.length, compliant, partial, nonCompliant, avgScore,
      compliantRate: Math.round((compliant / total) * 100),
      partialRate: Math.round((partial / total) * 100),
      nonCompliantRate: Math.round((nonCompliant / total) * 100),
    }
  }, [gapAssessments.data])

  const kpiCards = [
    { label: 'Total', value: stats.total, sub: `${gapAssessments.data.length} on page`, fillPercent: 100, fillColor: '#378add', icon: <CircleDot className="h-4 w-4" />, valueColor: 'text-foreground', delay: 0 },
    { label: 'Compliant', value: stats.compliant, sub: `${stats.compliantRate}%`, fillPercent: stats.compliantRate, fillColor: '#639922', icon: <CheckCircle2 className="h-4 w-4" />, valueColor: stats.compliant > 0 ? 'text-[#3B6D11] dark:text-[#97C459]' : 'text-foreground', delay: 80 },
    { label: 'Partial', value: stats.partial, sub: `${stats.partialRate}%`, fillPercent: stats.partialRate, fillColor: '#ba7517', icon: <AlertCircle className="h-4 w-4" />, valueColor: stats.partial > 0 ? 'text-[#854F0B] dark:text-[#EF9F27]' : 'text-foreground', delay: 160 },
    { label: 'Non Compliant', value: stats.nonCompliant, sub: `${stats.nonCompliantRate}%`, fillPercent: stats.nonCompliantRate, fillColor: '#e24b4a', icon: <XCircle className="h-4 w-4" />, valueColor: stats.nonCompliant > 0 ? 'text-[#A32D2D] dark:text-[#F09595]' : 'text-foreground', delay: 240 },
    { label: 'Avg Score', value: stats.avgScore !== null ? stats.avgScore : '—', sub: stats.avgScore !== null ? 'out of 100' : 'no scores yet', fillPercent: stats.avgScore ?? 0, fillColor: '#378add', icon: <TrendingUp className="h-4 w-4" />, valueColor: 'text-foreground', delay: 320 },
  ]

  // ── Columns ──────────────────────────────────────────────────
  const complianceOptions: FacetedFilterOption[] = [
    { label: 'Compliant', value: 'compliant', icon: CheckCircle2 },
    { label: 'Partial', value: 'partial', icon: AlertCircle },
    { label: 'Non Compliant', value: 'non_compliant', icon: XCircle },
  ]

  const columns: ColumnDef<GapAssessment>[] = [
    {
      accessorKey: 'requirement.code',
      header: ({ column }) => <div className="flex items-center gap-1.5"><ClipboardList className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Code" /></div>,
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.requirement?.code ?? '—'}</span>,
    },
    {
      accessorKey: 'requirement.title',
      header: ({ column }) => <div className="flex items-center gap-1.5"><ClipboardList className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Requirement" /></div>,
      cell: ({ row }) => (
        <Link href={`/gapassessment/${row.original.id}`} className="font-medium hover:underline">
          {row.original.requirement?.title ?? '—'}
        </Link>
      ),
    },
    {
      accessorKey: 'compliance_level',
      header: ({ column }) => <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Compliance Level" /></div>,
      cell: ({ row }) => <StatusPill value={row.getValue('compliance_level')} styleMap={complianceStyles} labelMap={complianceLabels} />,
    },
    {
      accessorKey: 'score',
      header: ({ column }) => <div className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Score" /></div>,
      cell: ({ row }) => <ScoreBar score={row.getValue('score')} />,
    },
    {
      accessorKey: 'gap_description',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Gap Description" />,
      cell: ({ row }) => {
        const desc = row.getValue('gap_description') as string | null
        if (!desc) return <span className="text-muted-foreground text-xs">—</span>
        return <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">{desc}</p>
      },
      enableSorting: false,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.getValue('created_at')).toLocaleDateString('fr-TN', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const assessment = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.visit(`/gapassessment/${assessment.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.visit(`/gapassessment/${assessment.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* ── Bouton Create Action ── */}
              <DropdownMenuItem
                onClick={() => { setSelectedGap(assessment); setActionSheetOpen(true) }}
                className="text-primary focus:bg-primary/10"
              >
                <ListTodo className="mr-2 h-4 w-4" /> Create Action
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10"
                onClick={() => { setAssessmentToDelete(assessment); setDeleteDialogOpen(true) }}
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
    if (assessmentToDelete) {
      router.delete(`/gapassessment/${assessmentToDelete.id}`, {
        onSuccess: () => { setDeleteDialogOpen(false); setAssessmentToDelete(null) },
      })
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Gap Assessment" />

      <div className="space-y-6 py-6 px-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gap Assessment</h1>
            <p className="text-muted-foreground mt-1.5">Track and manage compliance gaps across requirements</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/action-plans">
                <ListTodo className="mr-2 h-4 w-4" /> Action Plans
              </Link>
            </Button>
            <Button asChild>
              <Link href="/gapassessment/create">
                <Plus className="mr-2 h-4 w-4" /> New Assessment
              </Link>
            </Button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" style={{ perspective: '1200px' }}>
          {kpiCards.map(card => <KpiCard key={card.label} {...card} />)}
        </div>

        <Separator className="my-6" />

        {/* ── Table ── */}
        <ServerDataTable
          columns={columns}
          data={gapAssessments}
          searchPlaceholder="Search requirement title or code..."
          filters={
            <DataTableFacetedFilter
              filterKey="compliance_level"
              title="Compliance"
              options={complianceOptions}
            />
          }
          initialState={{ columnPinning: { right: ['actions'] } }}
        />
      </div>

      {/* ── Create Action Sheet ── */}
      <CreateActionSheet
        gap={selectedGap}
        users={users}
        open={actionSheetOpen}
        onClose={() => { setActionSheetOpen(false); setSelectedGap(null) }}
      />

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this gap assessment for "{assessmentToDelete?.requirement?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}