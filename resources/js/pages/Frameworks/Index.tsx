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
  Card,
  CardContent,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Key,
  BookOpen,
  RefreshCw,
  Layers,
  User,
  Globe,
  Tag,
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
  LayoutGrid,
  Table as TableIcon,
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
import { Globe2 } from 'lucide-react'

// ─── Jurisdiction flags ───────────────────────────────────────────────────────

const jurisdictionFlags: Record<string, string> = {
  'Algérie': 'dz', 'Algeria': 'dz', 'Angola': 'ao', 'Bénin': 'bj', 'Benin': 'bj',
  'Botswana': 'bw', 'Burkina Faso': 'bf', 'Burundi': 'bi', 'Cameroun': 'cm', 'Cameroon': 'cm',
  'Cap-Vert': 'cv', 'Cape Verde': 'cv', 'République centrafricaine': 'cf', 'Central African Republic': 'cf',
  'Tchad': 'td', 'Chad': 'td', 'Comores': 'km', 'Comoros': 'km', 'Congo': 'cg',
  'Republic of the Congo': 'cg', 'République démocratique du Congo': 'cd',
  'Democratic Republic of the Congo': 'cd', 'RDC': 'cd', "Côte d'Ivoire": 'ci', "Cote d'Ivoire": 'ci',
  'Djibouti': 'dj', 'Égypte': 'eg', 'Egypt': 'eg', 'Guinée équatoriale': 'gq',
  'Equatorial Guinea': 'gq', 'Érythrée': 'er', 'Eritrea': 'er', 'Eswatini': 'sz', 'Swaziland': 'sz',
  'Éthiopie': 'et', 'Ethiopia': 'et', 'Gabon': 'ga', 'Gambie': 'gm', 'Gambia': 'gm',
  'Ghana': 'gh', 'Guinée': 'gn', 'Guinea': 'gn', 'Guinée-Bissau': 'gw', 'Guinea-Bissau': 'gw',
  'Kenya': 'ke', 'Lesotho': 'ls', 'Liberia': 'lr', 'Libye': 'ly', 'Libya': 'ly',
  'Madagascar': 'mg', 'Malawi': 'mw', 'Mali': 'ml', 'Mauritanie': 'mr', 'Mauritania': 'mr',
  'Maurice': 'mu', 'Mauritius': 'mu', 'Maroc': 'ma', 'Morocco': 'ma', 'Mozambique': 'mz',
  'Namibie': 'na', 'Namibia': 'na', 'Niger': 'ne', 'Nigeria': 'ng', 'Rwanda': 'rw',
  'Sao Tomé-et-Principe': 'st', 'Sao Tome and Principe': 'st', 'Sénégal': 'sn', 'Senegal': 'sn',
  'Seychelles': 'sc', 'Sierra Leone': 'sl', 'Somalie': 'so', 'Somalia': 'so',
  'Afrique du Sud': 'za', 'South Africa': 'za', 'Soudan du Sud': 'ss', 'South Sudan': 'ss',
  'Soudan': 'sd', 'Sudan': 'sd', 'Tanzanie': 'tz', 'Tanzania': 'tz', 'Togo': 'tg',
  'Tunisie': 'tn', 'Tunisia': 'tn', 'Ouganda': 'ug', 'Uganda': 'ug', 'Zambie': 'zm',
  'Zambia': 'zm', 'Zimbabwe': 'zw', 'Canada': 'ca', 'Costa Rica': 'cr', 'Cuba': 'cu',
  'États-Unis': 'us', 'United States': 'us', 'USA': 'us', "États-Unis d'Amérique": 'us',
  'Argentine': 'ar', 'Argentina': 'ar', 'Bolivie': 'bo', 'Bolivia': 'bo',
  'Brésil': 'br', 'Brazil': 'br', 'Chili': 'cl', 'Chile': 'cl', 'Colombie': 'co',
  'Colombia': 'co', 'Équateur': 'ec', 'Ecuador': 'ec', 'Guyana': 'gy', 'Paraguay': 'py',
  'Pérou': 'pe', 'Peru': 'pe', 'Suriname': 'sr', 'Uruguay': 'uy', 'Venezuela': 've',
  'Chine': 'cn', 'China': 'cn', 'Inde': 'in', 'India': 'in', 'Japon': 'jp', 'Japan': 'jp',
  'Corée du Sud': 'kr', 'South Korea': 'kr', 'Émirats arabes unis': 'ae',
  'United Arab Emirates': 'ae', 'UAE': 'ae', 'Singapour': 'sg', 'Singapore': 'sg',
  'Turquie': 'tr', 'Turkey': 'tr', 'Allemagne': 'de', 'Germany': 'de',
  'France': 'fr', 'Royaume-Uni': 'gb', 'United Kingdom': 'gb', 'UK': 'gb',
  'Italie': 'it', 'Italy': 'it', 'Espagne': 'es', 'Spain': 'es',
  'Pays-Bas': 'nl', 'Netherlands': 'nl', 'Belgique': 'be', 'Belgium': 'be',
  'Suisse': 'ch', 'Switzerland': 'ch', 'Suède': 'se', 'Sweden': 'se',
  'Norvège': 'no', 'Norway': 'no', 'Danemark': 'dk', 'Denmark': 'dk',
  'Finlande': 'fi', 'Finland': 'fi', 'Pologne': 'pl', 'Poland': 'pl',
  'Portugal': 'pt', 'Russie': 'ru', 'Russia': 'ru', 'Ukraine': 'ua',
  'Australie': 'au', 'Australia': 'au', 'Nouvelle-Zélande': 'nz', 'New Zealand': 'nz',
  'Union européenne': 'eu', 'European Union': 'eu',
}

const getFlagUrl = (jurisdictionName: string): string | null => {
  const code = jurisdictionFlags[jurisdictionName.trim()]
  if (!code) return null
  return `https://flagcdn.com/w20/${code}.png`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RelationItem {
  id: number
  name: string
  pivot?: Record<string, any>
}

export interface Framework {
  id: number
  code: string
  name: string
  version?: string | null
  type: string
  publisher?: string | null
  jurisdictions: (string | RelationItem)[] | null
  tags: (string | RelationItem)[] | null
  status: string
  description?: string | null
  updated_at?: string | null
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

interface FrameworksIndexProps {
  frameworks: LaravelPaginator<Framework>
}

type GroupBy  = 'status' | 'type'
type ViewMode = 'table' | 'cards'

// ─── Colors ───────────────────────────────────────────────────────────────────

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  active:   { bg: 'bg-emerald-950/40', border: 'border-emerald-700', text: 'text-emerald-400' },
  draft:    { bg: 'bg-amber-950/40',   border: 'border-amber-700',   text: 'text-amber-400'   },
  archived: { bg: 'bg-slate-950/50',   border: 'border-slate-700',   text: 'text-slate-400'   },
}

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  standard:        { bg: 'bg-emerald-950/40', border: 'border-emerald-700', text: 'text-emerald-400' },
  regulation:      { bg: 'bg-violet-950/40',  border: 'border-violet-700',  text: 'text-violet-400'  },
  contract:        { bg: 'bg-amber-950/40',   border: 'border-amber-700',   text: 'text-amber-400'   },
  internal_policy: { bg: 'bg-indigo-950/40',  border: 'border-indigo-700',  text: 'text-indigo-400'  },
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
        <span className={cn('transition-all duration-300', isHovered ? 'text-foreground/80 scale-110' : 'text-muted-foreground/60')}>
          {icon}
        </span>
      </div>

      {/* Animated number */}
      <div className={cn(
        'text-2xl font-semibold leading-none tabular-nums relative z-10 transition-transform duration-200',
        valueColor,
        isHovered && 'scale-105 origin-left',
      )}>
        {typeof value === 'number' ? animatedValue : value}
      </div>

      {/* Sub text */}
      {sub && (
        <div
          className={cn('text-xs font-mono relative z-10 transition-opacity duration-500', mounted ? 'opacity-100' : 'opacity-0')}
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

export default function FrameworksIndex({ frameworks }: FrameworksIndexProps) {
  const [deleteDialogOpen, setDeleteDialogOpen]   = useState(false)
  const [frameworkToDelete, setFrameworkToDelete] = useState<Framework | null>(null)
  const [viewMode, setViewMode]                   = useState<ViewMode>('table')
  const [groupBy, setGroupBy]                     = useState<GroupBy>('status')
  const [exportLoading, setExportLoading]         = useState(false)

  // ── Stats ────────────────────────────────────────────────────
  const statusStats = useMemo(() => {
    const data     = frameworks.data
    const total    = frameworks.total
    const pageSize = data.length || 1
    const active   = data.filter(f => f.status?.toLowerCase() === 'active').length
    const draft    = data.filter(f => f.status?.toLowerCase() === 'draft').length
    const archived = data.filter(f => f.status?.toLowerCase() === 'archived').length
    return {
      total, active, draft, archived,
      activeRate:   Math.round((active   / pageSize) * 100),
      draftRate:    Math.round((draft    / pageSize) * 100),
      archivedRate: Math.round((archived / pageSize) * 100),
    }
  }, [frameworks.data, frameworks.total])

  const typeStats = useMemo(() => {
    const data     = frameworks.data
    const total    = frameworks.total
    const pageSize = data.length || 1
    const standard       = data.filter(f => f.type?.toLowerCase() === 'standard').length
    const regulation     = data.filter(f => f.type?.toLowerCase() === 'regulation').length
    const contract       = data.filter(f => f.type?.toLowerCase() === 'contract').length
    const internalPolicy = data.filter(f => f.type?.toLowerCase() === 'internal_policy').length
    return {
      total, standard, regulation, contract, internalPolicy,
      standardRate:   Math.round((standard       / pageSize) * 100),
      regulationRate: Math.round((regulation     / pageSize) * 100),
      contractRate:   Math.round((contract       / pageSize) * 100),
      internalRate:   Math.round((internalPolicy / pageSize) * 100),
    }
  }, [frameworks.data, frameworks.total])

  // ── KPI cards config — switches with groupBy ─────────────────
  const kpiCards = groupBy === 'status'
    ? [
        { label: 'Total',    value: statusStats.total,    sub: `${frameworks.data.length} on this page`, fillPercent: 100,                     fillColor: '#378add', icon: <CircleDot   className="h-4 w-4" />, valueColor: 'text-foreground',                                              delay: 0   },
        { label: 'Active',   value: statusStats.active,   sub: `${statusStats.activeRate}% of page`,    fillPercent: statusStats.activeRate,   fillColor: '#639922', icon: <CheckCircle2 className="h-4 w-4" />, valueColor: statusStats.active   > 0 ? 'text-emerald-500' : 'text-foreground', delay: 80  },
        { label: 'Draft',    value: statusStats.draft,    sub: `${statusStats.draftRate}% of page`,     fillPercent: statusStats.draftRate,    fillColor: '#ba7517', icon: <FileText     className="h-4 w-4" />, valueColor: statusStats.draft    > 0 ? 'text-amber-500'  : 'text-foreground', delay: 160 },
        { label: 'Archived', value: statusStats.archived, sub: `${statusStats.archivedRate}% of page`,  fillPercent: statusStats.archivedRate, fillColor: '#6b7280', icon: <Archive      className="h-4 w-4" />, valueColor: statusStats.archived > 0 ? 'text-slate-400'  : 'text-foreground', delay: 240 },
      ]
    : [
        { label: 'Total',           value: typeStats.total,          sub: `${frameworks.data.length} on this page`, fillPercent: 100,                      fillColor: '#378add', icon: <CircleDot   className="h-4 w-4" />, valueColor: 'text-foreground',                                                  delay: 0   },
        { label: 'Standard',        value: typeStats.standard,       sub: `${typeStats.standardRate}% of page`,    fillPercent: typeStats.standardRate,   fillColor: '#639922', icon: <Layers      className="h-4 w-4" />, valueColor: typeStats.standard       > 0 ? 'text-emerald-500' : 'text-foreground', delay: 60  },
        { label: 'Regulation',      value: typeStats.regulation,     sub: `${typeStats.regulationRate}% of page`,  fillPercent: typeStats.regulationRate,  fillColor: '#8b5cf6', icon: <Globe       className="h-4 w-4" />, valueColor: typeStats.regulation     > 0 ? 'text-violet-400'  : 'text-foreground', delay: 120 },
        { label: 'Contract',        value: typeStats.contract,       sub: `${typeStats.contractRate}% of page`,    fillPercent: typeStats.contractRate,    fillColor: '#ba7517', icon: <FileText    className="h-4 w-4" />, valueColor: typeStats.contract       > 0 ? 'text-amber-500'  : 'text-foreground', delay: 180 },
        { label: 'Internal Policy', value: typeStats.internalPolicy, sub: `${typeStats.internalRate}% of page`,    fillPercent: typeStats.internalRate,    fillColor: '#6366f1', icon: <Building2   className="h-4 w-4" />, valueColor: typeStats.internalPolicy > 0 ? 'text-indigo-400' : 'text-foreground', delay: 240 },
      ]

  // ── Export ───────────────────────────────────────────────────
  const handleExport = async () => {
    setExportLoading(true)
    try {
      const params   = new URLSearchParams(window.location.search)
      const response = await fetch(`/frameworks/export?${params.toString()}`, {
        method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url  = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = `frameworks-${new Date().toISOString().split('T')[0]}.xlsx`; link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) { console.error('Export error:', error) }
    finally { setExportLoading(false) }
  }

  // ── Kanban grouping ──────────────────────────────────────────
  const groupedData = useMemo(() => {
    return frameworks.data.reduce((acc, fw) => {
      const key = groupBy === 'status' ? (fw.status || 'other').toLowerCase() : (fw.type || 'other').toLowerCase()
      acc[key] = acc[key] || []; acc[key].push(fw); return acc
    }, {} as Record<string, Framework[]>)
  }, [frameworks.data, groupBy])

  const columnConfig = groupBy === 'status' ? {
    keys: ['active', 'draft', 'archived'],
    getTitle: (key: string) => key.charAt(0).toUpperCase() + key.slice(1),
    colors: statusColors, field: 'status' as const,
  } : {
    keys: ['standard', 'regulation', 'contract', 'internal_policy'],
    getTitle: (key: string) => key === 'internal_policy' ? 'Internal Policy' : key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    colors: typeColors, field: 'type' as const,
  }

  // ── FIX: send all required fields when dragging ──────────────
  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const framework = frameworks.data.find(f => f.id === Number(draggableId))
    if (!framework) return

    router.put(`/frameworks/${Number(draggableId)}`, {
      code:        framework.code,
      name:        framework.name,
      type:        framework.type,
      status:      framework.status,
      version:     framework.version     ?? undefined,
      publisher:   framework.publisher   ?? undefined,
      description: framework.description ?? undefined,
      // override whichever field the kanban is grouped by
      [columnConfig.field]: destination.droppableId,
    }, {
      preserveState:  true,
      preserveScroll: true,
      onError: (e) => console.error('Update failed', e),
    })
  }

  const goToPage = (url: string | null) => {
    if (!url) return
    router.get(url, {}, { preserveState: true, preserveScroll: true })
  }

  // ── Columns ──────────────────────────────────────────────────
  const columns: ColumnDef<Framework>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => <div className="flex items-center gap-1.5"><Key className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Code" /></div>,
      cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('code')}</div>,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => <div className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Name" /></div>,
      cell: ({ row }) => <Link href={`/frameworks/${row.original.id}`} className="font-medium hover:underline">{row.getValue('name')}</Link>,
    },
    {
      accessorKey: 'version',
      header: ({ column }) => <div className="flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Version" /></div>,
      cell: ({ row }) => row.getValue('version') ?? '—',
    },
    {
      accessorKey: 'type',
      header: ({ column }) => <div className="flex items-center gap-1.5"><Layers className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Type" /></div>,
      cell: ({ row }) => {
        const typeVal = (row.getValue('type') as string)?.toLowerCase() || 'other'
        const { bg, border, text } = typeColors[typeVal] || typeColors.standard
        return <Badge variant="outline" className={`capitalize ${bg} ${border} ${text}`}>{(row.getValue('type') as string)?.replace('_', ' ') || '—'}</Badge>
      },
    },
    {
      accessorKey: 'publisher',
      header: ({ column }) => <div className="flex items-center gap-1.5"><User className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Publisher" /></div>,
      cell: ({ row }) => row.getValue('publisher') ?? '—',
    },
    {
      id: 'jurisdictions',
      header: ({ column }) => <div className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Jurisdictions" /></div>,
      cell: ({ row }) => {
        const items = row.original.jurisdictions || []
        if (!items.length) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {items.slice(0, 5).map((item, i) => {
              const name = typeof item === 'string' ? item : item.name || '—'
              const flagUrl = getFlagUrl(name)
              return (
                <Badge key={i} variant="outline" className="text-xs flex items-center gap-1 px-2 py-0.5">
                  {flagUrl ? <img src={flagUrl} alt={`${name} flag`} className="w-4 h-3 rounded-sm object-cover" loading="lazy" /> : <Globe2 className="h-3.5 w-3.5 text-emerald-400" />}
                  {name}
                </Badge>
              )
            })}
            {items.length > 5 && <Badge variant="outline" className="text-xs px-2 py-0.5">+{items.length - 5}</Badge>}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <div className="flex items-center gap-1.5"><SignalHigh className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Status" /></div>,
      cell: ({ row }) => {
        const statusVal = (row.getValue('status') as string)?.toLowerCase() || 'other'
        const { bg, border, text } = statusColors[statusVal] || statusColors.archived
        return <Badge variant="outline" className={`capitalize ${bg} ${border} ${text}`}>{statusVal.charAt(0).toUpperCase() + statusVal.slice(1)}</Badge>
      },
    },
    {
      id: 'tags',
      header: ({ column }) => <div className="flex items-center gap-1.5"><Tag className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Tags" /></div>,
      cell: ({ row }) => {
        const tags = row.original.tags || []
        if (!tags.length) return <span className="text-muted-foreground text-xs">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, i) => {
              const name = typeof tag === 'string' ? tag : (tag as RelationItem).name || '—'
              return <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
            })}
            {tags.length > 3 && <Badge variant="secondary" className="text-xs">+{tags.length - 3}</Badge>}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const framework = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.visit(`/frameworks/${framework.id}`)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.visit(`/frameworks/${framework.id}/edit`)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => { setFrameworkToDelete(framework); setDeleteDialogOpen(true) }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const handleDeleteConfirm = () => {
    if (frameworkToDelete) {
      router.delete(`/frameworks/${frameworkToDelete.id}`, {
        onSuccess: () => { setDeleteDialogOpen(false); setFrameworkToDelete(null) },
      })
    }
  }

  return (
    <AppLayout>
      <Head title="Frameworks" />

      <div className="container mx-auto space-y-6 py-6 px-4 md:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Frameworks</h1>
            <p className="text-muted-foreground mt-1.5">Manage compliance and regulatory frameworks</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/frameworks/create"><Plus className="mr-2 h-4 w-4" />New Framework</Link>
            </Button>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="hidden sm:block">
              <TabsList className="grid w-44 grid-cols-2">
                <TabsTrigger value="table"><TableIcon className="mr-2 h-4 w-4" />Table</TabsTrigger>
                <TabsTrigger value="cards"><LayoutGrid className="mr-2 h-4 w-4" />Cards</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────── */}
        <div
          className={cn('grid gap-3', groupBy === 'status' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5')}
          style={{ perspective: '1200px' }}
        >
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>

        <Separator className="my-6" />

        {/* ── Vue Tableau / Kanban ────────────────────────────── */}
        {viewMode === 'table' ? (
          <>
            <ServerDataTable
              columns={columns}
              data={frameworks}
              searchPlaceholder="Search code, name, publisher..."
              onExport={handleExport}
              exportLoading={exportLoading}
              filters={
                <>
                  <DataTableFacetedFilter filterKey="status" title="Status" options={[
                    { label: 'Active',   value: 'active',   icon: CheckCircle2 },
                    { label: 'Draft',    value: 'draft',    icon: FileText     },
                    { label: 'Archived', value: 'archived', icon: Archive      },
                  ]} />
                  <DataTableSelectFilter filterKey="type" title="Type" placeholder="All types" options={[
                    { label: 'All',             value: 'all'             },
                    { label: 'Standard',        value: 'standard'        },
                    { label: 'Regulation',      value: 'regulation'      },
                    { label: 'Contract',        value: 'contract'        },
                    { label: 'Internal Policy', value: 'internal_policy' },
                  ]} />
                </>
              }
              initialState={{ columnPinning: { right: ['actions'] } }}
            />

            {frameworks.last_page > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{frameworks.from}</span> – <span className="font-medium">{frameworks.to}</span> of <span className="font-medium">{frameworks.total}</span> results
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={!frameworks.prev_page_url} onClick={() => goToPage(frameworks.prev_page_url)}>Previous</Button>
                  {frameworks.links.filter(l => !['&laquo; Previous', 'Next &raquo;'].includes(l.label)).map((link, idx) => (
                    <Button key={idx} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url || link.active} onClick={() => goToPage(link.url)} dangerouslySetInnerHTML={{ __html: link.label }} />
                  ))}
                  <Button variant="outline" size="sm" disabled={!frameworks.next_page_url} onClick={() => goToPage(frameworks.next_page_url)}>Next</Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg font-semibold tracking-tight">{groupBy === 'status' ? 'Status Board' : 'Type Board'}</h2>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                <SelectTrigger className="w-48"><ListFilter className="mr-2 h-4 w-4" /><SelectValue placeholder="Group by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Group by Status</SelectItem>
                  <SelectItem value="type">Group by Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="overflow-x-auto pb-6 scrollbar-thin">
                <div className="grid grid-flow-col auto-cols-[minmax(320px,1fr)] gap-5 lg:gap-6">
                  {columnConfig.keys.map((key) => {
                    const items = groupedData[key] || []
                    const color = columnConfig.colors[key] || { bg: 'bg-muted/40', border: 'border-muted', text: 'text-muted-foreground' }
                    return (
                      <Droppable droppableId={key} key={key}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef} {...provided.droppableProps}
                            className={cn('flex flex-col min-w-[320px] rounded-xl border bg-gradient-to-b from-card/80 to-card/40 shadow-sm transition-all duration-200', snapshot.isDraggingOver && 'ring-2 ring-primary/50 shadow-xl')}
                          >
                            <div className={cn('px-5 py-4 rounded-t-xl border-b font-medium text-lg flex items-center justify-between', color.bg, color.border, 'border-b-2')}>
                              <span>{columnConfig.getTitle(key)}</span>
                              <Badge variant="outline" className="bg-background/70">{items.length}</Badge>
                            </div>
                            <div className="p-4 flex-1 space-y-4 min-h-[500px]">
                              {items.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground/70 italic py-12">Empty column</div>
                              ) : (
                                items.map((fw, idx) => (
                                  <Draggable key={fw.id} draggableId={String(fw.id)} index={idx}>
                                    {(dragProvided, dragSnapshot) => (
                                      <Card
                                        ref={dragProvided.innerRef} {...dragProvided.draggableProps}
                                        className={cn('transition-all duration-200 cursor-grab active:cursor-grabbing', dragSnapshot.isDragging ? 'shadow-2xl ring-2 ring-primary/60 scale-[1.02]' : 'hover:shadow-md hover:ring-1 hover:ring-primary/30')}
                                      >
                                        <CardContent className="p-4 space-y-3">
                                          <div className="flex items-start justify-between gap-3">
                                            <div {...dragProvided.dragHandleProps}><GripVertical className="h-5 w-5 text-muted-foreground/70 hover:text-foreground transition-colors" /></div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium leading-tight mb-1.5">{fw.code} — {fw.name}</div>
                                              <p className="text-sm text-muted-foreground line-clamp-2">{fw.description || 'No description provided'}</p>
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap gap-2 pt-2">
                                            <Badge variant="outline" className="text-xs">v{fw.version || '—'}</Badge>
                                            <Badge variant="outline" className="text-xs">{fw.type?.replace('_', ' ') || '—'}</Badge>
                                            <Badge variant="outline" className={cn('text-xs', statusColors[fw.status?.toLowerCase() as keyof typeof statusColors]?.text || 'text-muted-foreground')}>{fw.status || '—'}</Badge>
                                          </div>
                                          {fw.jurisdictions && fw.jurisdictions.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-2">
                                              {fw.jurisdictions.slice(0, 4).map((j, i) => {
                                                const name = typeof j === 'string' ? j : j.name || '—'
                                                const flagUrl = getFlagUrl(name)
                                                return (
                                                  <Badge key={i} variant="outline" className="text-xs flex items-center gap-1.5 px-2.5 py-1">
                                                    {flagUrl ? <img src={flagUrl} alt={`${name} flag`} className="w-5 h-4 rounded-sm object-cover" loading="lazy" /> : <Globe2 className="h-3.5 w-3.5 text-emerald-400" />}
                                                    <span className="truncate max-w-[140px]">{name}</span>
                                                  </Badge>
                                                )
                                              })}
                                              {fw.jurisdictions.length > 4 && <Badge variant="outline" className="text-xs px-2.5 py-1">+{fw.jurisdictions.length - 4}</Badge>}
                                            </div>
                                          )}
                                          {fw.tags && fw.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                              {fw.tags.slice(0, 4).map((tag, i) => {
                                                const name = typeof tag === 'string' ? tag : (tag as RelationItem).name || '—'
                                                return <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                                              })}
                                              {fw.tags.length > 4 && <Badge variant="secondary" className="text-xs">+{fw.tags.length - 4}</Badge>}
                                            </div>
                                          )}
                                          <div className="pt-3 flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                                              <Link href={`/frameworks/${fw.id}`}><Eye className="mr-1.5 h-3.5 w-3.5" /> View</Link>
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                                              <Link href={`/frameworks/${fw.id}/edit`}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Link>
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

      {/* ── Delete dialog ──────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Framework</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{frameworkToDelete?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}