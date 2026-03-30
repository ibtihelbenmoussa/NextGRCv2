// resources/js/pages/Frameworks/Show.tsx
import React from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Pencil, Calendar, Link2, Tag, FileText,
  AlertCircle, Globe, Building2, Layers,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Process {
  id: number; name: string; code: string
  macro_process?: { id: number; name: string; business_unit?: { id: number; name: string } }
}

interface Framework {
  id: number; code: string; name: string; version?: string | null
  type: string; status: string; publisher?: string | null
  jurisdictions_names?: string[]; tags_names?: string[]
  processes?: Process[]
  release_date?: string | null; effective_date?: string | null; retired_date?: string | null
  description?: string | null; language?: string | null; url_reference?: string | null
}

export default function ShowFramework() {
  const { framework } = usePage<{ framework: Framework }>().props

  const formatDate = (date?: string | null) => {
    if (!date) return '—'
    try { const d = new Date(date); if (isNaN(d.getTime())) return date; return format(d, 'dd MMMM yyyy', { locale: fr }) } catch { return date }
  }

  const getStatusColor = (s: string) => ({
    active:     'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300',
    draft:      'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300',
    archived:   'bg-slate-500/10 text-slate-700 border-slate-500/30 dark:bg-slate-900/40 dark:text-slate-300',
    deprecated: 'bg-slate-500/10 text-slate-700 border-slate-500/30 dark:bg-slate-900/40 dark:text-slate-300',
  }[s.toLowerCase()] || 'bg-gray-500/10 text-gray-700 border-gray-500/30')

  const getTypeColor = (t: string) => ({
    standard:        'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300',
    regulation:      'bg-violet-500/10 text-violet-700 border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300',
    contract:        'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300',
    internal_policy: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300',
  }[t.toLowerCase()] || 'bg-gray-500/10 text-gray-700 border-gray-500/30')

  const officialUrl = (() => { try { if (!framework.url_reference) return null; new URL(framework.url_reference); return framework.url_reference } catch { return null } })()
  const jurisdictions = framework.jurisdictions_names ?? []
  const tags = framework.tags_names ?? []
  const processes = framework.processes ?? []

  // Grouper les processes par BU > MP
  const grouped = processes.reduce<Record<string, { bu: string; mps: Record<string, { mp: string; processes: Process[] }> }>>((acc, p) => {
    const buName = p.macro_process?.business_unit?.name ?? 'Unknown BU'
    const mpName = p.macro_process?.name ?? 'Unknown MP'
    if (!acc[buName]) acc[buName] = { bu: buName, mps: {} }
    if (!acc[buName].mps[mpName]) acc[buName].mps[mpName] = { mp: mpName, processes: [] }
    acc[buName].mps[mpName].processes.push(p)
    return acc
  }, {})

  return (
    <AppLayout>
      <Head title={`Framework • ${framework.name}`} />

      <div className="p-6 lg:p-10 space-y-10 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" onClick={() => router.visit('/frameworks')} className="rounded-full hover:bg-muted/80">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{framework.name}</h1>
              <div className="flex items-center gap-3 mt-2.5">
                <Badge variant="outline" className="font-mono text-sm px-3 py-1 bg-muted/50">{framework.code}</Badge>
                {framework.version && <Badge variant="outline" className="text-sm px-3 py-1 bg-muted/50">v{framework.version}</Badge>}
              </div>
            </div>
          </div>
          <Button onClick={() => router.visit(`/frameworks/${framework.id}/edit`)} className="gap-2 shadow-md" size="lg">
            <Pencil className="h-4 w-4" />Edit Framework
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-3">
          <Badge className={`px-5 py-1.5 text-base font-medium rounded-full border ${getStatusColor(framework.status)}`}>
            {framework.status.charAt(0).toUpperCase() + framework.status.slice(1)}
          </Badge>
          <Badge className={`px-5 py-1.5 text-base font-medium rounded-full border ${getTypeColor(framework.type)}`}>
            {framework.type.charAt(0).toUpperCase() + framework.type.slice(1).replace('_', ' ')}
          </Badge>
          {framework.publisher && <Badge variant="secondary" className="px-5 py-1.5 text-base">{framework.publisher}</Badge>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Information */}
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
                  <CardTitle className="text-xl">Main Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Type" value={framework.type.charAt(0).toUpperCase() + framework.type.slice(1).replace('_', ' ')} />
                <Field label="Publisher" value={framework.publisher || '—'} />
                <Field label="Language" value={framework.language || '—'} />
                <Field label="Jurisdiction(s)" value={
                  jurisdictions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {jurisdictions.map((j, i) => <Badge key={i} variant="secondary">{j}</Badge>)}
                    </div>
                  ) : '—'
                } />
              </CardContent>
            </Card>

            {/* Process Scope */}
            {Object.keys(grouped).length > 0 && (
              <Card className="border border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><Layers className="h-5 w-5 text-primary" /></div>
                    <CardTitle className="text-xl">Process Scope</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.values(grouped).map(({ bu, mps }) => (
                    <div key={bu} className="rounded-xl border border-input overflow-hidden">
                      {/* BU Header */}
                      <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: 'linear-gradient(135deg, #f59e0b10, #f9731610)' }}>
                        <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-foreground">{bu}</span>
                      </div>
                      {/* MacroProcesses */}
                      {Object.values(mps).map(({ mp, processes: procs }) => (
                        <div key={mp} className="border-t border-input/50">
                          <div className="flex items-center gap-3 pl-8 pr-4 py-2 bg-muted/20">
                            <Layers className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-foreground">{mp}</span>
                          </div>
                          {/* Processes */}
                          <div className="border-t border-input/20">
                            {procs.map(p => (
                              <div key={p.id} className="flex items-center gap-3 pl-16 pr-4 py-2 bg-muted/10 border-t border-input/10 first:border-t-0">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                <div>
                                  <span className="text-sm text-foreground">{p.name}</span>
                                  {p.code && <span className="ml-2 text-xs text-muted-foreground font-mono">{p.code}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {framework.description && (
              <Card className="border border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                    <CardTitle className="text-xl">Description</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">{framework.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Official Reference */}
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Link2 className="h-5 w-5 text-primary" /></div>
                  <CardTitle className="text-xl">Official Reference</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {officialUrl ? (
                  <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary hover:text-primary/80 hover:underline transition-all group text-base break-all">
                    <div className="p-1.5 rounded-md bg-primary/5 group-hover:bg-primary/10"><Link2 className="h-4 w-4" /></div>
                    <span>{officialUrl}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground py-4">
                    <AlertCircle className="h-5 w-5" /><span>No official reference URL provided</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Key Dates */}
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Calendar className="h-5 w-5 text-primary" /></div>
                  <CardTitle className="text-xl">Key Dates</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Field label="Release Date" value={formatDate(framework.release_date)} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
                <Field label="Effective Date" value={formatDate(framework.effective_date)} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
                <Field label="Retired Date" value={formatDate(framework.retired_date)} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="border border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Tag className="h-5 w-5 text-primary" /></div>
                  <CardTitle className="text-xl">Tags</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-sm px-4 py-1.5 rounded-full">{tag}</Badge>)}
                  </div>
                ) : <p className="text-sm text-muted-foreground italic">No tags assigned</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function Field({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2.5">{icon}{label}</p>
      <div className="font-medium text-base text-foreground">{value || '—'}</div>
    </div>
  )
}