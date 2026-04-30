import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import {
  Plus, Search, Calendar, FileText, ChevronRight, X,
  ClipboardList, HelpCircle, CheckCircle2, Clock,
  AlertCircle, BarChart3, ChevronDown,
  MoreHorizontal, Eye, Pencil, Trash2,
} from 'lucide-react'

// ─── shadcn components pour le menu et la suppression ─────────────────────────
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Framework {
  id: number
  code: string
  name: string
}

interface Requirement {
  id: number
  code: string
  title: string
  questions_count: number
}

interface GapAssessment {
  id: number
  code: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  framework: Framework
  requirements: Requirement[]
  requirements_count: number
  questions_count: number
  answers_count: number
}

interface Props {
  assessments: GapAssessment[]
}

// ─────────────────────────────────────────────
// Helpers — Statut basé sur les réponses et les dates
// ─────────────────────────────────────────────

function getStatus(item: GapAssessment): 'completed' | 'inprogress' | 'upcoming' | 'overdue' {
  if (item.answers_count === item.questions_count && item.questions_count > 0) {
    return 'completed'
  }

  const now = new Date()
  const end = item.end_date ? new Date(item.end_date) : null
  const start = item.start_date ? new Date(item.start_date) : null

  if (end && end < now && item.answers_count < item.questions_count) {
    return 'overdue'
  }

  if (start && start > now) {
    return 'upcoming'
  }

  return 'inprogress'
}

function StatusBadge({ item }: { item: GapAssessment }) {
  const s = getStatus(item)
  const map = {
    completed:  { label: 'Completed',   className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    inprogress: { label: 'In Progress', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    upcoming:   { label: 'Upcoming',    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    overdue:    { label: 'Overdue',     className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  }
  const { label, className } = map[s]
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border font-mono', className)}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────
// Stat Card (identique)
// ─────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub: string
  color: string
}) {
  return (
    <div className="flex-1 min-w-[160px] bg-card border rounded-lg p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className={cn('text-muted-foreground', color)}>{icon}</span>
      </div>
      <p className={cn('text-3xl font-bold font-mono', color)}>{value}</p>
      <p className={cn('text-xs font-mono mt-1', color, 'opacity-70')}>{sub}</p>
      <div className={cn('absolute bottom-0 left-0 right-0 h-0.5', color.replace('text-', 'bg-'))} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Drawer (inchangé)
// ─────────────────────────────────────────────

function AssessmentDrawer({ item, onClose }: { item: GapAssessment; onClose: () => void }) {
  const status = getStatus(item)
  const progressPercent = item.questions_count > 0
    ? Math.round((item.answers_count / item.questions_count) * 100)
    : 0

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-background border-l border-border z-50 flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground">{item.code}</p>
              <h2 className="text-lg font-semibold mt-1">{item.name}</h2>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge item={item} />
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {item.framework.code}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold font-mono text-blue-400">{item.requirements_count}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wide">Requirements</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold font-mono text-purple-400">{item.questions_count}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wide">Questions</p>
            </div>
            <div className="p-4 text-center">
              <p className={cn(
                'text-2xl font-bold font-mono',
                status === 'completed' ? 'text-green-400' :
                status === 'overdue'   ? 'text-red-400'  :
                status === 'upcoming'  ? 'text-blue-400' : 'text-amber-400'
              )}>
                {status === 'completed' ? '✓' :
                 status === 'upcoming'  ? '—' :
                 `${progressPercent}%`}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wide">
                {status === 'completed' ? 'Completed' :
                 status === 'overdue'   ? 'Overdue'   : 'Progress'}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Framework</p>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {item.framework.code}
                </span>
                <span className="text-sm text-blue-300">{item.framework.name}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Period</p>
              <div className="flex items-center gap-2 text-sm font-mono text-foreground">
                <Calendar size={13} className="text-muted-foreground" />
                <span>{item.start_date ?? '—'}</span>
                <span className="text-muted-foreground">→</span>
                <span>{item.end_date ?? '—'}</span>
              </div>
            </div>
            {item.description && (
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Requirements ({item.requirements_count})
              </p>
              <div className="space-y-2">
                {item.requirements?.length ? (
                  item.requirements.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                        {r.code}
                      </span>
                      <span className="text-sm flex-1 min-w-0 truncate">{r.title}</span>
                      <span className="text-xs font-mono text-muted-foreground shrink-0 flex items-center gap-1">
                        <HelpCircle size={11} />{r.questions_count}Q
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No requirements attached</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => router.visit(`/gap-assessments/${item.id}`)}>
            <FileText size={15} /> Details
          </Button>
          <Button className="flex-1 gap-2" onClick={() => router.visit(`/gap-assessments/${item.id}/answer`)}>
            <ClipboardList size={15} /> Answer Questions
          </Button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Framework Row avec menu d'actions (3 points)
// ─────────────────────────────────────────────

function FrameworkRow({
  framework,
  assessments,
  onSelect,
  onDeleteClick,
}: {
  framework: Framework
  assessments: GapAssessment[]
  onSelect: (a: GapAssessment) => void
  onDeleteClick: (a: GapAssessment) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
      >
        <ChevronDown size={14} className={cn('text-muted-foreground transition-transform shrink-0', !open && '-rotate-90')} />
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {framework.code}
        </span>
        <span className="text-sm font-medium">{framework.name}</span>
        <span className="ml-auto text-xs font-mono text-muted-foreground">
          {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
        </span>
      </button>

      {open && (
        <div className="divide-y divide-border">
          {/* Table header — une colonne supplémentaire pour les actions */}
          <div className="grid grid-cols-[2fr_1fr_1fr_80px_80px_110px_110px_40px] gap-3 px-4 py-2 bg-muted/20">
            {['Name', 'Period', 'Code', 'Req.', 'Q.', 'Status', '', ''].map((h, i) => (
              <span key={i} className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {h}
              </span>
            ))}
          </div>

          {assessments.map(a => (
            <div
              key={a.id}
              className="grid grid-cols-[2fr_1fr_1fr_80px_80px_110px_110px_40px] gap-3 px-4 py-3 items-center hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => onSelect(a)}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{a.name}</p>
                {a.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>}
              </div>
              <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                <Calendar size={11} />
                <span className="truncate">{a.start_date ?? '—'}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground truncate">{a.code}</span>
              <span className="text-sm font-mono font-semibold text-center">{a.requirements_count}</span>
              <span className="text-sm font-mono font-semibold text-center">{a.questions_count}</span>
              <StatusBadge item={a} />

              {/* Bouton Answer (inchangé) */}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 px-2 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  router.visit(`/gap-assessments/${a.id}/answer`)
                }}
              >
                <ClipboardList size={11} /> Answer
              </Button>

              {/* Menu ⋮ (3 points) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => router.visit(`/gap-assessments/${a.id}`)}>
                    <Eye className="mr-2 h-4 w-4" /> View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.visit(`/gap-assessments/${a.id}/edit`)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteClick(a)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Empty State (inchangé)
// ─────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileText size={24} className="text-muted-foreground" />
      </div>
      <p className="text-base font-semibold">No gap assessments yet</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Create your first assessment to start evaluating compliance
      </p>
      <Button onClick={() => router.visit('/gap-assessment/create')}>
        <Plus size={16} className="mr-1.5" /> New Assessment
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page (avec logs de suppression)
// ─────────────────────────────────────────────

export default function GapAssessmentIndex({ assessments }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<GapAssessment | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState<GapAssessment | null>(null)

  const filtered = assessments.filter(a =>
    !search ||
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.framework.code.toLowerCase().includes(search.toLowerCase()) ||
    a.framework.name.toLowerCase().includes(search.toLowerCase())
  )

  const total      = assessments.length
  const completed  = assessments.filter(a => getStatus(a) === 'completed').length
  const inprogress = assessments.filter(a => getStatus(a) === 'inprogress').length
  const upcoming   = assessments.filter(a => getStatus(a) === 'upcoming').length
  const overdue    = assessments.filter(a => getStatus(a) === 'overdue').length
  const totalReqs  = assessments.reduce((s, a) => s + a.requirements_count, 0)

  const byFramework = filtered.reduce<Record<number, { framework: Framework; assessments: GapAssessment[] }>>(
    (acc, a) => {
      if (!acc[a.framework.id]) acc[a.framework.id] = { framework: a.framework, assessments: [] }
      acc[a.framework.id].assessments.push(a)
      return acc
    }, {}
  )

  const handleDeleteClick = (assessment: GapAssessment) => {
    setAssessmentToDelete(assessment)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (assessmentToDelete) {
      router.delete(`/gap-assessments/${assessmentToDelete.id}`, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setAssessmentToDelete(null)
        },
      })
    }
  }

  return (
    <AppLayout breadcrumbs={[{ title: 'Gap Assessments', href: '/gap-assessment' }]}>
      <Head title="Gap Assessments" />

      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gap Assessments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track and manage compliance gap evaluations
            </p>
          </div>
          <Button onClick={() => router.visit('/gap-assessment/create')}>
            <Plus size={16} className="mr-1.5" /> Add Gap Assessment
          </Button>
        </div>

        {assessments.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <StatCard icon={<BarChart3 size={16} />} label="Total" value={total} sub={`${totalReqs} requirements`} color="text-blue-400" />
            <StatCard icon={<CheckCircle2 size={16} />} label="Completed" value={completed} sub={`${total > 0 ? Math.round(completed / total * 100) : 0}% complete`} color="text-green-400" />
            <StatCard icon={<Clock size={16} />} label="In Progress" value={inprogress} sub="active now" color="text-amber-400" />
            {overdue > 0 && (
              <StatCard icon={<AlertCircle size={16} />} label="Overdue" value={overdue} sub="past deadline" color="text-red-400" />
            )}
          </div>
        )}

        {assessments.length === 0 ? <EmptyState /> : (
          <>
            <div className="relative max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search assessments…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="text-center py-16 text-sm text-muted-foreground">
                No assessments match "<span className="font-medium">{search}</span>"
              </p>
            ) : (
              <div className="space-y-3">
                {Object.values(byFramework).map(({ framework, assessments: fas }) => (
                  <FrameworkRow
                    key={framework.id}
                    framework={framework}
                    assessments={fas}
                    onSelect={setSelected}
                    onDeleteClick={handleDeleteClick}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selected && <AssessmentDrawer item={selected} onClose={() => setSelected(null)} />}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gap Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{assessmentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}