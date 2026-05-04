import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ClipboardList,
  Edit,
  Trash2,
  TrendingUp,
  Calendar,
  Building2,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface QuestionAnswer {
  id: number
  text: string
  answer: number | null
  note: string | null
  score: number | null
  maturity_level: number | null
}

interface RequirementDetail {
  id: number
  code: string
  title: string
  description: string
  score: number
  maturity_level: number
  questions: QuestionAnswer[]
  answers_map: Record<number, number>
}

interface Assessment {
  id: number
  code: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  framework: {
    code: string
    name: string
  } | null
  overall_score: number
  overall_maturity_level: number
}

interface Props {
  assessment: Assessment
  requirements: RequirementDetail[]
  ml_result?: any // optionnel, venant de session
}

// ─────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────

const maturityLabels: Record<number, { label: string; color: string }> = {
  1: { label: 'Initial', color: 'bg-red-100 text-red-800 border-red-200' },
  2: { label: 'Basic', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  3: { label: 'Defined', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  4: { label: 'Managed', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  5: { label: 'Optimized', color: 'bg-green-100 text-green-800 border-green-200' },
}

const answerLabels: Record<number, string> = {
  0: 'No',
  1: 'Basic',
  2: 'Partial',
  3: 'Managed',
  4: 'Yes',
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-700'
  if (score >= 60) return 'text-yellow-700'
  if (score >= 40) return 'text-orange-700'
  return 'text-red-700'
}

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────

export default function ShowGapAssessment({ assessment, requirements, ml_result }: Props) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this assessment? All answers will be lost.')) return
    setDeleting(true)
    router.delete(`/gap-assessments/${assessment.id}`, {
      onFinish: () => setDeleting(false),
    })
  }

  const handleAnswer = () => {
    router.get(`/gap-assessments/${assessment.id}/answer`)
  }

  const handleEdit = () => {
    router.get(`/gap-assessments/${assessment.id}/edit`)
  }

  const formatDate = (date: string | null) => {
    return date ? format(new Date(date), 'PPP') : '—'
  }

  const totalQuestions = requirements.reduce(
    (acc, req) => acc + req.questions.length,
    0
  )
  const answeredQuestions = requirements.reduce(
    (acc, req) => acc + req.questions.filter(q => q.answer !== null && q.answer !== undefined).length,
    0
  )

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Gap Assessments', href: '/gap-assessment' },
        { title: assessment.code, href: '' },
      ]}
    >
      <Head title={`${assessment.code} - ${assessment.name}`} />

      <div className="space-y-6 p-4">
        {/* En-tête avec actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{assessment.name}</h1>
              <Badge variant="outline" className="font-mono text-sm">
                {assessment.code}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-2 text-muted-foreground">
              {assessment.framework && (
                <span className="flex items-center gap-1">
                  <Building2 size={14} />
                  {assessment.framework.code} — {assessment.framework.name}
                </span>
              )}
              {(assessment.start_date || assessment.end_date) && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(assessment.start_date)}
                  {assessment.end_date && ` → ${formatDate(assessment.end_date)}`}
                </span>
              )}
            </div>
            {assessment.description && (
              <p className="mt-3 text-muted-foreground max-w-2xl">{assessment.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit size={16} className="mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
            <Button onClick={handleAnswer}>
              <ClipboardList size={16} className="mr-2" />
              Answer Questions
            </Button>
          </div>
        </div>

        {/* Cartes récapitulatives */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {assessment.overall_score?.toFixed(1) ?? '—'}%
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground mt-1" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maturity Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{assessment.overall_maturity_level ?? 1}</span>
                <span className="text-sm text-muted-foreground">/5</span>
              </div>
              <Badge
                className={cn(
                  'mt-2',
                  maturityLabels[assessment.overall_maturity_level ?? 1]?.color
                )}
              >
                {maturityLabels[assessment.overall_maturity_level ?? 1]?.label}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{requirements.length}</div>
              <p className="text-xs text-muted-foreground mt-1">selected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{answeredQuestions} / {totalQuestions}</div>
              <p className="text-xs text-muted-foreground mt-1">answered</p>
            </CardContent>
          </Card>
        </div>

        {/* Détail par exigence (accordéon) */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements & Answers</CardTitle>
            <CardDescription>
              Detailed view of each requirement, its maturity, and the answers to associated questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-4">
              {requirements.map((req) => (
                <AccordionItem
                  key={req.id}
                  value={req.id.toString()}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex flex-1 items-center justify-between pr-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {req.code}
                        </Badge>
                        <span className="font-medium">{req.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <span className={cn('font-semibold', getScoreColor(req.score))}>
                                  {req.score.toFixed(1)}%
                                </span>
                                <Badge className={maturityLabels[req.maturity_level]?.color}>
                                  L{req.maturity_level}
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Score / Maturity level</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Badge variant="secondary">
                          {req.questions.filter(q => q.answer !== null).length} / {req.questions.length} answered
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-2">
                    <div className="space-y-4">
                      {req.questions.map((question) => (
                        <div key={question.id} className="border-l-4 border-muted pl-4 py-2">
                          <p className="text-sm font-medium mb-2">{question.text}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <FileQuestion size={14} className="text-muted-foreground" />
                              <span className="text-muted-foreground">Answer:</span>
                              <span className="font-medium">
                                {question.answer !== null && question.answer !== undefined
                                  ? answerLabels[question.answer]
                                  : '—'}
                              </span>
                            </div>
                            {question.score !== null && (
                              <div className="flex items-center gap-1">
                                <TrendingUp size={14} className="text-muted-foreground" />
                                <span className="text-muted-foreground">Score:</span>
                                <span className={cn('font-medium', getScoreColor(question.score))}>
                                  {question.score.toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {question.maturity_level !== null && (
                              <div className="flex items-center gap-1">
                                <Badge className={maturityLabels[question.maturity_level]?.color}>
                                  L{question.maturity_level}
                                </Badge>
                              </div>
                            )}
                          </div>
                          {question.note && (
                            <div className="mt-2 text-sm bg-muted/30 p-2 rounded-md flex items-start gap-2">
                              <MessageSquare size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
                              <span className="text-muted-foreground">{question.note}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Résultat ML si présent */}
        {ml_result && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={18} />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm font-sans">
                {JSON.stringify(ml_result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}