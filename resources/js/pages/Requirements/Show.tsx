// resources/js/pages/Requirements/Show.tsx
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
  CheckCircle2,
  Clock,
  Building2,
  ListTodo,
  Globe,
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
  process?: Process | null
  tags?: TagItem[] | null
  deadline?: string | null
  completion_date?: string | null
  compliance_level: string
  attachments?: string | null
  created_at: string
  updated_at: string
}

export default function ShowRequirement() {
  const { requirement } = usePage<{ requirement: Requirement }>().props

  const formatDate = (date?: string | null): string => {
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
    }
    return colors[status.toLowerCase()] || 'bg-gray-500/10 text-gray-700 border-gray-500/30 dark:bg-gray-800/40 dark:text-gray-300'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500/10 text-red-700 border-red-500/30 dark:bg-red-950/40 dark:text-red-300',
      medium: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300',
      low: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300',
    }
    return colors[priority.toLowerCase()] || 'bg-gray-500/10 text-gray-700 border-gray-500/30 dark:bg-gray-800/40 dark:text-gray-300'
  }

  const getComplianceColor = (level: string) => {
    const colors: Record<string, string> = {
      mandatory: 'bg-red-500/10 text-red-700 border-red-500/30 dark:bg-red-950/40 dark:text-red-300',
      recommended: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300',
      optional: 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300',
    }
    return colors[level.toLowerCase()] || 'bg-gray-500/10 text-gray-700 border-gray-500/30 dark:bg-gray-800/40 dark:text-gray-300'
  }

  const attachmentUrls = (requirement.attachments || '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line.startsWith('http'))

  const tags = requirement.tags ?? []

  return (
    <AppLayout>
      <Head title={`Requirement • ${requirement.title}`} />

      <div className="p-6 lg:p-10 space-y-10 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit('/requirements')}
              className="rounded-full hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                {requirement.title}
              </h1>
              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                <Badge variant="outline" className="font-mono text-sm px-3 py-1 bg-muted/50">
                  {requirement.code}
                </Badge>
                <Badge
                  className={`px-4 py-1.5 text-base font-medium rounded-full border ${getStatusColor(requirement.status)}`}
                >
                  {requirement.status.charAt(0).toUpperCase() + requirement.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            onClick={() => router.visit(`/requirements/${requirement.id}/edit`)}
            className="gap-2 bg-primary hover:bg-primary/90 shadow-md transition-all"
            size="lg"
          >
            <Pencil className="h-4 w-4" />
            Edit Requirement
          </Button>
        </div>

        {/* Badges rapides */}
        <div className="flex flex-wrap gap-3">
          <Badge
            className={`px-5 py-1.5 text-base font-medium rounded-full border ${getPriorityColor(requirement.priority)}`}
          >
            Priority: {requirement.priority.charAt(0).toUpperCase() + requirement.priority.slice(1)}
          </Badge>

          <Badge
            className={`px-5 py-1.5 text-base font-medium rounded-full border ${getComplianceColor(requirement.compliance_level)}`}
          >
            {requirement.compliance_level.charAt(0).toUpperCase() + requirement.compliance_level.slice(1)}
          </Badge>

          <Badge variant="outline" className="px-5 py-1.5 text-base">
            {requirement.frequency
              .replace('_', ' ')
              .split(' ')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}
          </Badge>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
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
                {requirement.description ? (
                  <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {requirement.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">Aucune description fournie.</p>
                )}
              </CardContent>
            </Card>

            {/* General Information */}
            <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ListTodo className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Informations générales</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{requirement.type || '—'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Framework</p>
                  <p className="font-medium">
                    {requirement.framework
                      ? `${requirement.framework.code} — ${requirement.framework.name}`
                      : '—'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Processus</p>
                  <p className="font-medium">{requirement.process?.name || '—'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Fréquence</p>
                  <p className="font-medium capitalize">
                    {requirement.frequency.replace('_', ' ') || '—'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Pièces jointes (liens)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {attachmentUrls.length > 0 ? (
                  <div className="space-y-4">
                    {attachmentUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-primary hover:text-primary/80 hover:underline transition-all group text-base break-all"
                      >
                        <div className="p-2 rounded-md bg-primary/5 group-hover:bg-primary/10 transition-colors">
                          <Link2 className="h-4 w-4" />
                        </div>
                        <span>{url}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground py-4">
                    <AlertCircle className="h-5 w-5" />
                    <span>Aucune pièce jointe ajoutée</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Dates importantes */}
            <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Dates clés</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Échéance
                  </div>
                  <p className="font-medium">{formatDate(requirement.deadline)}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Date de complétion
                  </div>
                  <p className="font-medium">{formatDate(requirement.completion_date)}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Créé le
                  </div>
                  <p className="font-medium">{formatDate(requirement.created_at)}</p>
                </div>
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
                    {tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-sm px-4 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucun tag assigné</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}