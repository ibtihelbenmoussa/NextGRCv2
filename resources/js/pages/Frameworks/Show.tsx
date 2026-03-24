import React from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Pencil,
  Calendar,
  Link2,
  Tag,
  FileText,
  AlertCircle,
  Globe,
  Building2,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Framework {
  id: number
  code: string
  name: string
  version?: string | null
  type: string
  status: string
  publisher?: string | null
  jurisdictions?: string[] | null
  scope?: string | null
  release_date?: string | null
  effective_date?: string | null
  retired_date?: string | null
  description?: string | null
  language?: string | null
  url_reference?: string | null
  tags?: string[] | null
}

export default function ShowFramework() {
  const { framework } = usePage<{ framework: Framework }>().props

  // ─── Helpers ────────────────────────────────────────────────

  const formatDate = (date?: string | null) => {
    if (!date) return '—'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return date
      return format(d, 'dd MMMM yyyy', { locale: fr })
    } catch {
      return date
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300',
      draft: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300',
      archived: 'bg-slate-500/10 text-slate-700 border-slate-500/30 dark:bg-slate-900/40 dark:text-slate-300',
      deprecated: 'bg-slate-500/10 text-slate-700 border-slate-500/30 dark:bg-slate-900/40 dark:text-slate-300',
    }
    return colors[status.toLowerCase()] || 'bg-gray-500/10 text-gray-700 border-gray-500/30 dark:bg-gray-800/40 dark:text-gray-300'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      standard: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300',
      regulation: 'bg-violet-500/10 text-violet-700 border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300',
      contract: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300',
      internal_policy: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300',
    }
    return colors[type.toLowerCase()] || 'bg-gray-500/10 text-gray-700 border-gray-500/30 dark:bg-gray-800/40 dark:text-gray-300'
  }

  const getValidUrl = (url?: string | null) => {
    if (!url) return null
    try {
      new URL(url)
      return url
    } catch {
      return null
    }
  }

  const officialUrl = getValidUrl(framework.url_reference)
  const jurisdictions = framework.jurisdictions ?? []
  const tags = framework.tags ?? []

  // ─── Render ─────────────────────────────────────────────────

  return (
    <AppLayout>
      <Head title={`Framework • ${framework.name}`} />

      <div className="p-6 lg:p-10 space-y-10 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit('/frameworks')}
              className="rounded-full hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                {framework.name}
              </h1>
              <div className="flex items-center gap-3 mt-2.5">
                <Badge variant="outline" className="font-mono text-sm px-3 py-1 bg-muted/50">
                  {framework.code}
                </Badge>
                {framework.version && (
                  <Badge variant="outline" className="text-sm px-3 py-1 bg-muted/50">
                    v{framework.version}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={() => router.visit(`/frameworks/${framework.id}/edit`)}
            className="gap-2 bg-primary hover:bg-primary/90 shadow-md transition-all"
            size="lg"
          >
            <Pencil className="h-4 w-4" />
            Edit Framework
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-3">
          <Badge
            className={`px-5 py-1.5 text-base font-medium rounded-full border ${getStatusColor(framework.status)}`}
          >
            {framework.status.charAt(0).toUpperCase() + framework.status.slice(1)}
          </Badge>

          <Badge
            className={`px-5 py-1.5 text-base font-medium rounded-full border ${getTypeColor(framework.type)}`}
          >
            {framework.type.charAt(0).toUpperCase() + framework.type.slice(1).replace('_', ' ')}
          </Badge>

          {framework.publisher && (
            <Badge variant="secondary" className="px-5 py-1.5 text-base">
              {framework.publisher}
            </Badge>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* General Information */}
            <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Main Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Type" value={framework.type.charAt(0).toUpperCase() + framework.type.slice(1).replace('_', ' ')} />
                <Field label="Publisher" value={framework.publisher || '—'} />
                <Field label="Language" value={framework.language || '—'} />
                <Field
                  label="Jurisdiction(s)"
                  value={
                    jurisdictions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {jurisdictions.map((j, i) => (
                          <Badge key={i} variant="secondary">
                            {j}
                          </Badge>
                        ))}
                      </div>
                    ) : '—'
                  }
                />
                <Field label="Scope" value={framework.scope || '—'} />
              </CardContent>
            </Card>

            {/* Description */}
            {framework.description && (
              <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-semibold">Description</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {framework.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Official Reference */}
            <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Official Reference</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {officialUrl ? (
                  <a
                    href={officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary hover:text-primary/80 hover:underline transition-all group text-base break-all"
                  >
                    <div className="p-1.5 rounded-md bg-primary/5 group-hover:bg-primary/10 transition-colors">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <span>{officialUrl}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground py-4">
                    <AlertCircle className="h-5 w-5" />
                    <span>No official reference URL provided</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Key Dates */}
            <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Key Dates</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Field label="Release Date" value={formatDate(framework.release_date)} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
                <Field label="Effective Date" value={formatDate(framework.effective_date)} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
                <Field label="Retired Date" value={formatDate(framework.retired_date)} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Tags</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm px-4 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No tags assigned</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function Field({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2.5">
        {icon}
        {label}
      </p>
      <p className="font-medium text-base text-foreground">
        {value || '—'}
      </p>
    </div>
  )
}