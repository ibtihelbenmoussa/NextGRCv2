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

// ─── Style A : Soft filled pill avec dot ─────────────────────────────────────
// Light : fond teinté clair  + texte dark du même ramp
// Dark  : fond dark du ramp  + texte light du ramp   → auto via media query

const statusStyles: Record<string, { pill: string; dot: string; kanbanBg: string; kanbanBorder: string; kanbanText: string }> = {
  active: {
    pill:         'bg-[#EAF3DE] text-[#27500A] dark:bg-[#27500A] dark:text-[#C0DD97]',
    dot:          'bg-[#3B6D11]               dark:bg-[#97C459]',
    kanbanBg:     'bg-[#EAF3DE]/60            dark:bg-[#27500A]/40',
    kanbanBorder: 'border-[#97C459]           dark:border-[#3B6D11]',
    kanbanText:   'text-[#27500A]             dark:text-[#C0DD97]',
  },
  draft: {
    pill:         'bg-[#FAEEDA] text-[#412402] dark:bg-[#412402] dark:text-[#FAC775]',
    dot:          'bg-[#854F0B]               dark:bg-[#EF9F27]',
    kanbanBg:     'bg-[#FAEEDA]/60            dark:bg-[#412402]/40',
    kanbanBorder: 'border-[#EF9F27]           dark:border-[#854F0B]',
    kanbanText:   'text-[#412402]             dark:text-[#FAC775]',
  },
  archived: {
    pill:         'bg-[#F1EFE8] text-[#444441] dark:bg-[#444441] dark:text-[#D3D1C7]',
    dot:          'bg-[#888780]               dark:bg-[#B4B2A9]',
    kanbanBg:     'bg-[#F1EFE8]/60            dark:bg-[#444441]/40',
    kanbanBorder: 'border-[#B4B2A9]           dark:border-[#5F5E5A]',
    kanbanText:   'text-[#444441]             dark:text-[#D3D1C7]',
  },
}

const priorityStyles: Record<string, { pill: string; dot: string; kanbanBg: string; kanbanBorder: string; kanbanText: string }> = {
  high: {
    pill:         'bg-[#FCEBEB] text-[#501313] dark:bg-[#501313] dark:text-[#F7C1C1]',
    dot:          'bg-[#A32D2D]               dark:bg-[#E24B4A]',
    kanbanBg:     'bg-[#FCEBEB]/60            dark:bg-[#501313]/40',
    kanbanBorder: 'border-[#E24B4A]           dark:border-[#A32D2D]',
    kanbanText:   'text-[#501313]             dark:text-[#F7C1C1]',
  },
  medium: {
    pill:         'bg-[#FAEEDA] text-[#412402] dark:bg-[#412402] dark:text-[#FAC775]',
    dot:          'bg-[#854F0B]               dark:bg-[#EF9F27]',
    kanbanBg:     'bg-[#FAEEDA]/60            dark:bg-[#412402]/40',
    kanbanBorder: 'border-[#EF9F27]           dark:border-[#854F0B]',
    kanbanText:   'text-[#412402]             dark:text-[#FAC775]',
  },
  low: {
    pill:         'bg-[#EAF3DE] text-[#27500A] dark:bg-[#27500A] dark:text-[#C0DD97]',
    dot:          'bg-[#3B6D11]               dark:bg-[#97C459]',
    kanbanBg:     'bg-[#EAF3DE]/60            dark:bg-[#27500A]/40',
    kanbanBorder: 'border-[#97C459]           dark:border-[#3B6D11]',
    kanbanText:   'text-[#27500A]             dark:text-[#C0DD97]',
  },
}

const fallbackStyle = {
  pill:         'bg-[#F1EFE8] text-[#444441] dark:bg-[#444441] dark:text-[#D3D1C7]',
  dot:          'bg-[#888780]',
  kanbanBg:     'bg-muted/40',
  kanbanBorder: 'border-muted',
  kanbanText:   'text-muted-foreground',
}

// ─── StatusPill — badge Style A ───────────────────────────────────────────────

function StatusPill({ value, styleMap }: { value: string; styleMap: typeof statusStyles }) {
  const key = value?.toLowerCase() ?? ''
  const s   = styleMap[key] ?? fallbackStyle
  const label = key.charAt(0).toUpperCase() + key.slice(1)
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', s.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      {label || '—'}
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
  const [deleteDialogOpen, setDeleteDialogOpen]     = useState(false)
  const [requirementToDelete, setRequirementToDelete] = useState<Requirement | null>(null)
  const [exportLoading, setExportLoading]           = useState(false)
  const [viewMode, setViewMode]                     = useState<ViewMode>('table')
  const [groupBy, setGroupBy]                       = useState<GroupBy>('status')

  // ── Stats ────────────────────────────────────────────────────
  const statusStats = useMemo(() => {
    const data  = requirements.data
    const total = data.length || 1
    const active   = data.filter(r => r.status?.toLowerCase() === 'active').length
    const draft    = data.filter(r => r.status?.toLowerCase() === 'draft').length
    const archived = data.filter(r => r.status?.toLowerCase() === 'archived').length
    return {
      total: data.length, active, draft, archived,
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
      total: data.length, high, medium, low,
      highRate:   Math.round((high   / total) * 100),
      mediumRate: Math.round((medium / total) * 100),
      lowRate:    Math.round((low    / total) * 100),
    }
  }, [requirements.data])

  // ── KPI cards ────────────────────────────────────────────────
  const kpiCards = groupBy === 'status'
    ? [
        { label: 'Total',    value: statusStats.total,    sub: 'requirements on page', fillPercent: 100,                     fillColor: '#378add', icon: <CircleDot    className="h-4 w-4" />, valueColor: 'text-foreground',                                                 delay: 0   },
        { label: 'Active',   value: statusStats.active,   sub: `${statusStats.activeRate}%`,   fillPercent: statusStats.activeRate,   fillColor: '#639922', icon: <CheckCircle2 className="h-4 w-4" />, valueColor: statusStats.active   > 0 ? 'text-[#3B6D11] dark:text-[#97C459]' : 'text-foreground', delay: 80  },
        { label: 'Draft',    value: statusStats.draft,    sub: `${statusStats.draftRate}%`,    fillPercent: statusStats.draftRate,    fillColor: '#ba7517', icon: <FileText     className="h-4 w-4" />, valueColor: statusStats.draft    > 0 ? 'text-[#854F0B] dark:text-[#EF9F27]' : 'text-foreground', delay: 160 },
        { label: 'Archived', value: statusStats.archived, sub: `${statusStats.archivedRate}%`, fillPercent: statusStats.archivedRate, fillColor: '#6b7280', icon: <Archive      className="h-4 w-4" />, valueColor: statusStats.archived > 0 ? 'text-[#5F5E5A] dark:text-[#B4B2A9]' : 'text-foreground', delay: 240 },
      ]
    : [
        { label: 'Total',  value: priorityStats.total,  sub: 'requirements on page', fillPercent: 100,                       fillColor: '#378add', icon: <CircleDot    className="h-4 w-4" />, valueColor: 'text-foreground',                                                   delay: 0   },
        { label: 'High',   value: priorityStats.high,   sub: `${priorityStats.highRate}%`,   fillPercent: priorityStats.highRate,   fillColor: '#e24b4a', icon: <AlertTriangle className="h-4 w-4" />, valueColor: priorityStats.high   > 0 ? 'text-[#A32D2D] dark:text-[#F09595]' : 'text-foreground', delay: 80  },
        { label: 'Medium', value: priorityStats.medium, sub: `${priorityStats.mediumRate}%`, fillPercent: priorityStats.mediumRate, fillColor: '#ba7517', icon: <AlertTriangle className="h-4 w-4" />, valueColor: priorityStats.medium > 0 ? 'text-[#854F0B] dark:text-[#EF9F27]' : 'text-foreground', delay: 160 },
        { label: 'Low',    value: priorityStats.low,    sub: `${priorityStats.lowRate}%`,    fillPercent: priorityStats.lowRate,    fillColor: '#639922', icon: <CheckCircle2  className="h-4 w-4" />, valueColor: priorityStats.low    > 0 ? 'text-[#3B6D11] dark:text-[#97C459]' : 'text-foreground', delay: 240 },
      ]

  // ── Export ───────────────────────────────────────────────────
  const handleExport = async () => {
    setExportLoading(true)
    try {
      const params   = new URLSearchParams(window.location.search)
      const response = await fetch(`/requirements/export?${params.toString()}`, {
        method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url  = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `requirements-${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) { console.error('Export error:', error) }
    finally { setExportLoading(false) }
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
      cell: ({ row }) => <div className="font-mono font-medium text-xs">{row.getValue('code')}</div>,
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
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4]">
          {(row.getValue('type') as string) || '—'}
        </span>
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
      cell: ({ row }) => (
        <StatusPill value={row.getValue('status')} styleMap={statusStyles} />
      ),
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <DataTableColumnHeader column={column} title="Priority" />
        </div>
      ),
      cell: ({ row }) => (
        <StatusPill value={row.getValue('priority')} styleMap={priorityStyles} />
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
        const freq = row.getValue('frequency') as string | null
        if (!freq) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {freq}
          </span>
        )
      },
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
        return fw
          ? <span className="text-xs text-muted-foreground">{fw.code} — {fw.name}</span>
          : <span className="text-muted-foreground text-xs">—</span>
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
        if (!tags.length) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-[#EEEDFE] text-[#3C3489] dark:bg-[#3C3489] dark:text-[#CECBF6]"
              >
                {tag.name}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{tags.length - 3}
              </span>
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
                onClick={() => { setRequirementToDelete(requirement); setDeleteDialogOpen(true) }}
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
        onSuccess: () => { setDeleteDialogOpen(false); setRequirementToDelete(null) },
      })
    }
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    const field = groupBy === 'status' ? 'status' : 'priority'
    router.put(`/requirements/${Number(draggableId)}`, { [field]: destination.droppableId }, {
      preserveState: true, preserveScroll: true,
      onError: (errors) => console.error('Update failed', errors),
    })
  }

  return (
    <AppLayout>
      <Head title="Requirements" />

      <div className="space-y-6 py-6 px-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Requirements</h1>
            <p className="text-muted-foreground mt-1.5">Track and manage your compliance requirements</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/requirements/create">
                <Plus className="mr-2 h-4 w-4" /> New Requirement
              </Link>
            </Button>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="hidden sm:block">
              <TabsList className="grid w-44 grid-cols-2">
                <TabsTrigger value="table"><TableIcon className="mr-2 h-4 w-4" />Table</TabsTrigger>
                <TabsTrigger value="kanban"><LayoutGrid className="mr-2 h-4 w-4" />Board</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ perspective: '1200px' }}>
          {kpiCards.map(card => <KpiCard key={card.label} {...card} />)}
        </div>

        <Separator className="my-6" />

        {/* ── Table / Kanban ── */}
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
                <DataTableSelectFilter filterKey="priority" title="Priority" placeholder="All priorities" options={priorityOptions} />
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
                  {groupOrder.map(key => {
                    const items = groupedData[key] || []
                    const s = groupBy === 'status'
                      ? (statusStyles[key] ?? fallbackStyle)
                      : (priorityStyles[key] ?? fallbackStyle)

                    return (
                      <Droppable droppableId={key} key={key}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef} {...provided.droppableProps}
                            className={cn(
                              'flex flex-col min-w-[320px] rounded-xl border bg-gradient-to-b from-card/80 to-card/40 shadow-sm transition-all duration-200',
                              snapshot.isDraggingOver && 'ring-2 ring-primary/50 shadow-xl'
                            )}
                          >
                            {/* Column header */}
                            <div className={cn('px-5 py-4 rounded-t-xl border-b-2 font-medium text-lg flex items-center justify-between', s.kanbanBg, s.kanbanBorder)}>
                              <span className={s.kanbanText}>{getGroupTitle(key)}</span>
                              <span className={cn('inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border', s.kanbanBorder, s.kanbanText, 'bg-background/70')}>
                                {items.length}
                              </span>
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
                                        ref={dragProvided.innerRef} {...dragProvided.draggableProps}
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
                                            <StatusPill value={req.status}   styleMap={statusStyles}   />
                                            <StatusPill value={req.priority} styleMap={priorityStyles} />
                                            {req.frequency && (
                                              <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                {req.frequency.replace('_', ' ')}
                                              </span>
                                            )}
                                          </div>

                                          {req.tags?.length ? (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                              {req.tags.slice(0, 4).map(tag => (
                                                <span
                                                  key={tag.id}
                                                  className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-[#EEEDFE] text-[#3C3489] dark:bg-[#3C3489] dark:text-[#CECBF6]"
                                                >
                                                  {tag.name}
                                                </span>
                                              ))}
                                              {req.tags.length > 4 && (
                                                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                  +{req.tags.length - 4}
                                                </span>
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

      {/* ── Delete dialog ── */}
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
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}