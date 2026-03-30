// resources/js/pages/RequirementTests/show.tsx
import { Head, usePage, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  CalendarIcon,
  FileText,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Tag,
  Link2,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Framework {
  code: string
  name: string
}

interface Process {
  name: string
}

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
  frequency: string
  framework?: Framework | null
  framework_name?: string | null
  process?: Process | null
  process_name?: string | null
  tags?: TagItem[] | null
  effective_date ?: string | null
  completion_date?: string | null
  compliance_level: string
  attachments?: string | null
  created_at: string
  updated_at: string
}

export default function ShowTest() {
  const { requirement } = usePage<{ requirement: Requirement }>().props

  const formatDate = (date?: string | null) => {
    if (!date) return '—'
    try {
      const d = new Date(date)
      return isNaN(d.getTime()) ? date : format(d, 'dd MMMM yyyy', { locale: fr })
    } catch {
      return date
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active:   'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
      draft:    'bg-amber-500/10 text-amber-700 border-amber-500/30',
      archived: 'bg-slate-500/10 text-slate-700 border-slate-500/30',
    }
    return map[status?.toLowerCase()] ?? 'bg-gray-500/10 text-gray-700 border-gray-500/30'
  }

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      high:   'bg-red-500/10 text-red-700 border-red-500/30',
      medium: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
      low:    'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    }
    return map[priority?.toLowerCase()] ?? 'bg-gray-500/10 text-gray-700 border-gray-500/30'
  }

  const getComplianceBadge = (level: string) => {
    const map: Record<string, string> = {
      mandatory:   'bg-red-500/10 text-red-700 border-red-500/30',
      recommended: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
      optional:    'bg-blue-500/10 text-blue-700 border-blue-500/30',
    }
    return map[level?.toLowerCase()] ?? 'bg-gray-500/10 text-gray-700 border-gray-500/30'
  }

  const capitalize = (str: string) =>
    str ? str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'

  const attachmentUrls = (requirement.attachments || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('http'))

  const tags = requirement.tags ?? []

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Requirement tests', href: '/req-testing' },
        { title: requirement.code, href: '' },
      ]}
    >
      <Head title={`Requirement • ${requirement.title}`} />

      <div className="space-y-12 p-6 lg:p-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{requirement.title}</h1>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="font-mono text-sm px-3 py-1 bg-muted/50">
                  {requirement.code}
                </Badge>
                <Badge className={`px-4 py-1.5 text-sm font-medium rounded-full border ${getStatusBadge(requirement.status)}`}>
                  {capitalize(requirement.status)}
                </Badge>
              </div>
              {requirement.framework && (
                <div className="inline-flex items-center gap-3 bg-background/70 px-4 py-2 rounded-full border border-border/60">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {requirement.framework.code}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-medium">
                    {requirement.framework_name ?? requirement.framework.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => router.visit('/req-testing')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </div>

        {/* Quick badges */}
        <div className="flex flex-wrap gap-3">
          <Badge className={`px-5 py-1.5 text-base font-medium rounded-full border ${getPriorityBadge(requirement.priority)}`}>
            Priority: {capitalize(requirement.priority)}
          </Badge>
          <Badge className={`px-5 py-1.5 text-base font-medium rounded-full border ${getComplianceBadge(requirement.compliance_level)}`}>
            {capitalize(requirement.compliance_level)}
          </Badge>
          <Badge variant="outline" className="px-5 py-1.5 text-base">
            {capitalize(requirement.frequency)}
          </Badge>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description */}
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Description</h2>
                </div>
                {requirement.description ? (
                  <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90 bg-muted/30 rounded-lg p-4">
                    {requirement.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">No description provided.</p>
                )}
              </CardContent>
            </Card>

            {/* General Info */}
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">General Information</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="font-medium">{capitalize(requirement.type) || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Framework</p>
                    <p className="font-medium">
                      {requirement.framework
                        ? `${requirement.framework.code} — ${requirement.framework_name ?? requirement.framework.name}`
                        : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Process</p>
                    <p className="font-medium">{requirement.process_name ?? requirement.process?.name ?? '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                    <p className="font-medium">{capitalize(requirement.frequency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Attachments</h2>
                </div>
                {attachmentUrls.length > 0 ? (
                  <div className="space-y-3">
                    {attachmentUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-primary hover:underline break-all text-base"
                      >
                        <Link2 className="h-4 w-4 shrink-0" />
                        {url}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                    <AlertCircle className="h-4 w-4" />
                    No attachments added
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">

            {/* Dates */}
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Key Dates</h2>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" /> Deadline
                  </div>
                  <p className="font-medium">{formatDate(requirement.effective_date )}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" /> Completion date
                  </div>
                  <p className="font-medium">{formatDate(requirement.completion_date)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" /> Created at
                  </div>
                  <p className="font-medium">{formatDate(requirement.created_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Tags</h2>
                </div>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag.id} variant="secondary" className="text-sm px-4 py-1.5 rounded-full">
                        {tag.name}
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