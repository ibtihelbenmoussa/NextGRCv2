import { useMemo, useState, useEffect, useRef } from 'react'

import { Head, Link, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { ServerDataTable } from '@/components/server-data-table'
import { DataTableColumnHeader } from '@/components/server-data-table-column-header'
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from '@/components/server-data-table-faceted-filter'
import {
  DataTableSelectFilter,
  type SelectOption,
} from '@/components/server-data-table-select-filter'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Key,
  BookOpen,
  Layers,
  SignalHigh,
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Archive,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  Tag,
  RefreshCw,
  GripVertical,
  ListFilter,
  CircleDot,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { PaginatedData } from '@/types'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TagItem {
  id: number
  name: string
}

interface Requirement {
  id: number
  code: string
  title: string
  description?: string | null
  type: string
  status: string
  priority: string
  frequency?: string | null
  framework?: { code: string; name: string } | null
  process?: { name: string } | null
  tags?: TagItem[]
  deadline?: string | null
  completion_date?: string | null
  compliance_level: string
  attachments?: string | null
  created_at: string
  updated_at: string
}

interface RequirementsIndexProps {
  requirements: PaginatedData<Requirement>
}

type GroupBy = 'status' | 'priority'
type ViewMode = 'table' | 'kanban'

// ─── Colors ───────────────────────────────────────────────────────────────────

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  active:   { bg: 'bg-emerald-950/40', border: 'border-emerald-700', text: 'text-emerald-400' },
  draft:    { bg: 'bg-amber-950/40',   border: 'border-amber-700',   text: 'text-amber-400'   },
  archived: { bg: 'bg-slate-950/50',   border: 'border-slate-700',   text: 'text-slate-400'   },
}

const priorityColors: Record<string, { bg: string; border: string; text: string }> = {
  high:   { bg: 'bg-red-950/40',     border: 'border-red-700',     text: 'text-red-400'     },
  medium: { bg: 'bg-amber-950/40',   border: 'border-amber-700',   text: 'text-amber-400'   },
  low:    { bg: 'bg-emerald-950/40', border: 'border-emerald-700', text: 'text-emerald-400' },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequirementsIndex({ requirements }: RequirementsIndexProps) {
  const [deleteDialogOpen, setDeleteDialogOpen]       = useState(false)
  const [requirementToDelete, setRequirementToDelete] = useState<Requirement | null>(null)
  const [exportLoading, setExportLoading]             = useState(false)
  const [viewMode, setViewMode]                       = useState<ViewMode>('table')
  const [groupBy, setGroupBy]                         = useState<GroupBy>('status')

  // ── Stats ────────────────────────────────────────────────────
  const statusStats = useMemo(() => {
    const data  = requirements.data
    const total = data.length || 1
    const active   = data.filter(r => r.status?.toLowerCase() === 'active').length
    const draft    = data.filter(r => r.status?.toLowerCase() === 'draft').length
    const archived = data.filter(r => r.status?.toLowerCase() === 'archived').length
    return {
      total: data.length,
      active, draft, archived,
      activeRate:   Math.round((active   / total) * 100),
      draftRate:    Math.round((draft    / total) * 100),
      archivedRate: Math.round((archived / total) * 100),
    }
  }, [requirements.data])

  const priorityStats = useMemo(() => {
    const data  = requirements.data
    const total = data.length || 1
    const high   = data.filter(r => r.priority?.toLowerCase() === 'high').length
    const medium = data.filter(r => r.priority?.toLowerCase() === 'medium').length
    const low    = data.filter(r => r.priority?.toLowerCase() === 'low').length
    return {
      total: data.length,
      high, medium, low,
      highRate:   Math.round((high   / total) * 100),
      mediumRate: Math.round((medium / total) * 100),
      lowRate:    Math.round((low    / total) * 100),
    }
  }, [requirements.data])

  // ── KPI cards config — switches with groupBy ─────────────────
  const kpiCards = groupBy === 'status'
    ? [
        {
          label:       'Total',
          value:       statusStats.total,
          sub:         'requirements on page',
          fillPercent: 100,
          fillColor:   '#378add',
          icon:        <CircleDot className="h-4 w-4" />,
          valueColor:  'text-foreground',
          delay:       0,
        },
        {
          label:       'Active',
          value:       statusStats.active,
          sub:         `${statusStats.activeRate}% `,
          fillPercent: statusStats.activeRate,
          fillColor:   '#639922',
          icon:        <CheckCircle2 className="h-4 w-4" />,
          valueColor:  statusStats.active > 0 ? 'text-emerald-500' : 'text-foreground',
          delay:       80,
        },
        {
          label:       'Draft',
          value:       statusStats.draft,
          sub:         `${statusStats.draftRate}% `,
          fillPercent: statusStats.draftRate,
          fillColor:   '#ba7517',
          icon:        <FileText className="h-4 w-4" />,
          valueColor:  statusStats.draft > 0 ? 'text-amber-500' : 'text-foreground',
          delay:       160,
        },
        {
          label:       'Archived',
          value:       statusStats.archived,
          sub:         `${statusStats.archivedRate}% `,
          fillPercent: statusStats.archivedRate,
          fillColor:   '#6b7280',
          icon:        <Archive className="h-4 w-4" />,
          valueColor:  statusStats.archived > 0 ? 'text-slate-400' : 'text-foreground',
          delay:       240,
        },
      ]
    : [
        {
          label:       'Total',
          value:       priorityStats.total,
          sub:         'requirements on page',
          fillPercent: 100,
          fillColor:   '#378add',
          icon:        <CircleDot className="h-4 w-4" />,
          valueColor:  'text-foreground',
          delay:       0,
        },
        {
          label:       'High',
          value:       priorityStats.high,
          sub:         `${priorityStats.highRate}% `,
          fillPercent: priorityStats.highRate,
          fillColor:   '#e24b4a',
          icon:        <AlertTriangle className="h-4 w-4" />,
          valueColor:  priorityStats.high > 0 ? 'text-red-500' : 'text-foreground',
          delay:       80,
        },
        {
          label:       'Medium',
          value:       priorityStats.medium,
          sub:         `${priorityStats.mediumRate}% of page`,
          fillPercent: priorityStats.mediumRate,
          fillColor:   '#ba7517',
          icon:        <AlertTriangle className="h-4 w-4" />,
          valueColor:  priorityStats.medium > 0 ? 'text-amber-500' : 'text-foreground',
          delay:       160,
        },
        {
          label:       'Low',
          value:       priorityStats.low,
          sub:         `${priorityStats.lowRate}% `,
          fillPercent: priorityStats.lowRate,
          fillColor:   '#639922',
          icon:        <CheckCircle2 className="h-4 w-4" />,
          valueColor:  priorityStats.low > 0 ? 'text-emerald-500' : 'text-foreground',
          delay:       240,
        },
      ]

  // ── Export ───────────────────────────────────────────────────
  const handleExport = async () => {
    setExportLoading(true)
    try {
      const params   = new URLSearchParams(window.location.search)
      const response = await fetch(`/requirements/export?${params.toString()}`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url  = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `requirements-${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExportLoading(false)
    }
  }

  // ── Kanban grouping ──────────────────────────────────────────
  const groupedData = useMemo(() => {
    return requirements.data.reduce((acc, req) => {
      const key = (req[groupBy]?.toLowerCase() ?? 'other')
      if (!acc[key]) acc[key] = []
      acc[key].push(req)
      return acc
    }, {} as Record<string, Requirement[]>)
  }, [requirements.data, groupBy])

  const groupOrder = groupBy === 'status'
    ? ['active', 'draft', 'archived', 'other']
    : ['high', 'medium', 'low', 'other']

  const getGroupTitle = (key: string) =>
    key === 'other' ? 'Other' : key.charAt(0).toUpperCase() + key.slice(1)

  // ── Columns ──────────────────────────────────────────────────
  const statusOptions: FacetedFilterOption[] = [
    { label: 'Active',   value: 'active',   icon: CheckCircle2 },
    { label: 'Draft',    value: 'draft',    icon: FileText     },
    { label: 'Archived', value: 'archived', icon: Archive      },
  ]

  const priorityOptions: SelectOption[] = [
    { label: 'All',    value: 'all'    },
    { label: 'High',   value: 'high'   },
    { label: 'Medium', value: 'medium' },
    { label: 'Low',    value: 'low'    },
  ]

  const columns: ColumnDef<Requirement>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <Key className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Code" />
        </div>
      ),
      cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('code')}</div>,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Title" />
        </div>
      ),
      cell: ({ row }) => (
        <Link href={`/requirements/${row.original.id}`} className="font-medium hover:underline">
          {row.getValue('title')}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Type" />
        </div>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {(row.getValue('type') as string) || '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <SignalHigh className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      cell: ({ row }) => {
        const status = (row.getValue('status') as string)?.toLowerCase() || 'other'
        const { bg, border, text } = statusColors[status] || statusColors.archived
        return (
          <Badge variant="outline" className={cn('capitalize', bg, border, text)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Priority" />
        </div>
      ),
      cell: ({ row }) => {
        const priority = (row.getValue('priority') as string)?.toLowerCase() || 'other'
        const { bg, border, text } = priorityColors[priority] || priorityColors.low
        return (
          <Badge variant="outline" className={cn('capitalize', bg, border, text)}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'frequency',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Frequency" />
        </div>
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{(row.getValue('frequency') as string) ?? '—'}</Badge>
      ),
    },
    {
      accessorKey: 'framework.code',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Framework" />
        </div>
      ),
      cell: ({ row }) => {
        const fw = row.original.framework
        return fw ? `${fw.code} — ${fw.name}` : '—'
      },
    },
    {
      accessorKey: 'tags',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Tags" />
        </div>
      ),
      cell: ({ row }) => {
        const tags = row.original.tags ?? []
        if (tags.length === 0) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">+{tags.length - 3}</Badge>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const requirement = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.visit(`/requirements/${requirement.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.visit(`/requirements/${requirement.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10"
                onClick={() => {
                  setRequirementToDelete(requirement)
                  setDeleteDialogOpen(true)
                }}
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
    if (requirementToDelete) {
      router.delete(`/requirements/${requirementToDelete.id}`, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setRequirementToDelete(null)
        },
      })
    }
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    const requirementId = Number(draggableId)
    const newValue      = destination.droppableId
    const field         = groupBy === 'status' ? 'status' : 'priority'
    router.put(`/requirements/${requirementId}`, { [field]: newValue }, {
      preserveState: true, preserveScroll: true,
      onError: (errors) => console.error('Update failed', errors),
    })
  }

  return (
    <AppLayout>
      <Head title="Requirements" />

      <div className="container mx-auto space-y-6 py-6 px-4 md:px-6 lg:px-8">

        {/* ── Header ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Requirements</h1>
            <p className="text-muted-foreground mt-1.5">
              Track and manage your compliance requirements
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/requirements/create">
                <Plus className="mr-2 h-4 w-4" />
                New Requirement
              </Link>
            </Button>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="hidden sm:block">
              <TabsList className="grid w-44 grid-cols-2">
                <TabsTrigger value="table">
                  <TableIcon className="mr-2 h-4 w-4" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="kanban">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Board
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ perspective: '1200px' }}>
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>

        <Separator className="my-6" />

        {/* ── Table / Kanban ───────────────────────────── */}
        {viewMode === 'table' ? (
          <ServerDataTable
            columns={columns}
            data={requirements}
            searchPlaceholder="Search code, title, tags..."
            onExport={handleExport}
            exportLoading={exportLoading}
            filters={
              <>
                <DataTableFacetedFilter filterKey="status" title="Status" options={statusOptions} />
                <DataTableSelectFilter
                  filterKey="priority"
                  title="Priority"
                  placeholder="All priorities"
                  options={priorityOptions}
                />
              </>
            }
            initialState={{ columnPinning: { right: ['actions'] } }}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg font-semibold tracking-tight">
                {groupBy === 'status' ? 'Status Board' : 'Priority Board'}
              </h2>

              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                <SelectTrigger className="w-48">
                  <ListFilter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Group by Status</SelectItem>
                  <SelectItem value="priority">Group by Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="overflow-x-auto pb-6 scrollbar-thin">
                <div className="grid grid-flow-col auto-cols-[minmax(320px,1fr)] gap-5 lg:gap-6">
                  {groupOrder.map((key) => {
                    const items = groupedData[key] || []
                    const color =
                      groupBy === 'status'
                        ? statusColors[key]   || statusColors.archived
                        : priorityColors[key] || priorityColors.low

                    return (
                      <Droppable droppableId={key} key={key}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              'flex flex-col min-w-[320px] rounded-xl border bg-gradient-to-b from-card/80 to-card/40 shadow-sm transition-all duration-200',
                              snapshot.isDraggingOver && 'ring-2 ring-primary/50 shadow-xl'
                            )}
                          >
                            <div className={cn(
                              'px-5 py-4 rounded-t-xl border-b font-medium text-lg flex items-center justify-between',
                              color.bg, color.border, 'border-b-2'
                            )}>
                              <span>{getGroupTitle(key)}</span>
                              <Badge variant="outline" className="bg-background/70">{items.length}</Badge>
                            </div>

                            <div className="p-4 flex-1 space-y-4 min-h-[500px]">
                              {items.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground/70 italic py-12">
                                  Empty column
                                </div>
                              ) : (
                                items.map((req, idx) => (
                                  <Draggable key={req.id} draggableId={String(req.id)} index={idx}>
                                    {(dragProvided, dragSnapshot) => (
                                      <Card
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        className={cn(
                                          'transition-all duration-200 cursor-grab active:cursor-grabbing',
                                          dragSnapshot.isDragging
                                            ? 'shadow-2xl ring-2 ring-primary/60 scale-[1.02]'
                                            : 'hover:shadow-md hover:ring-1 hover:ring-primary/30'
                                        )}
                                      >
                                        <CardContent className="p-4 space-y-3">
                                          <div className="flex items-start justify-between gap-3">
                                            <div {...dragProvided.dragHandleProps}>
                                              <GripVertical className="h-5 w-5 text-muted-foreground/70 hover:text-foreground transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium leading-tight mb-1.5">
                                                {req.code} — {req.title}
                                              </div>
                                              <p className="text-sm text-muted-foreground line-clamp-2">
                                                {req.description || 'No description provided'}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex flex-wrap gap-2 pt-2">
                                            <Badge variant="outline" className="text-xs">{req.type || '—'}</Badge>
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                'text-xs',
                                                priorityColors[req.priority?.toLowerCase() ?? 'other']?.text || 'text-muted-foreground'
                                              )}
                                            >
                                              {req.priority?.toUpperCase() || '—'}
                                            </Badge>
                                            {req.frequency && (
                                              <Badge variant="outline" className="text-xs">
                                                {req.frequency.replace('_', ' ')}
                                              </Badge>
                                            )}
                                          </div>

                                          {req.tags?.length ? (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                              {req.tags.slice(0, 4).map((tag) => (
                                                <Badge key={tag.id} variant="secondary" className="text-xs">
                                                  {tag.name}
                                                </Badge>
                                              ))}
                                              {req.tags.length > 4 && (
                                                <Badge variant="secondary" className="text-xs">
                                                  +{req.tags.length - 4}
                                                </Badge>
                                              )}
                                            </div>
                                          ) : null}

                                          <div className="pt-3 flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                                              <Link href={`/requirements/${req.id}`}>
                                                <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                                              </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                                              <Link href={`/requirements/${req.id}/edit`}>
                                                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                                              </Link>
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}
                            </div>
                          </div>
                        )}
                      </Droppable>
                    )
                  })}
                </div>
              </div>
            </DragDropContext>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{requirementToDelete?.title}"? This action cannot be undone.
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