// app/requirements/create.tsx
import { useState } from 'react'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { route } from 'ziggy-js'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  ListTodo,
  FileText,
  Tag as TagIcon,
  FileUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { MultiSelect } from '@/components/ui/multi-select'

interface Framework {
  id: number
  code: string
  name: string
}

interface Process {
  id: number
  name: string
}

interface Tag {
  id: number
  name: string
}

interface PageProps {
  frameworks?: Framework[]
  processes?: Process[]
  tags?: Tag[]
  flash?: { success?: string; error?: string }
  [key: string]: any
}

export default function CreateRequirement() {
  const { props } = usePage<PageProps>()

  const frameworks = props.frameworks ?? []
  const processes = props.processes ?? []
  const tags = props.tags ?? []

  const { data, setData, post, processing, errors, setError, clearErrors, reset } = useForm({
    code: '',
    title: '',
    description: '',
    type: '',
    status: '',
    priority: '',
    frequency: '',
    framework_id: '',
    process_id: '',
    tags: [] as string[],
    effective_date: '',        // ← renommé depuis deadline
    completion_date: '',
    compliance_level: '',
    attachments: '',
    auto_validate: false,
  })

  const [effectiveDateOpen, setEffectiveDateOpen] = useState(false)  // ← renommé
  const [completionOpen, setCompletionOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!data.code.trim()) return setError('code', 'Code is required')
    if (!data.title.trim()) return setError('title', 'Title is required')
    if (!data.type) return setError('type', 'Type is required')
    if (!data.status) return setError('status', 'Status is required')
    if (!data.priority) return setError('priority', 'Priority is required')
    if (!data.frequency) return setError('frequency', 'Frequency is required')
    if (!data.framework_id) return setError('framework_id', 'Framework is required')
    if (!data.compliance_level) return setError('compliance_level', 'Compliance level is required')

    post(route('requirements.store'), {
      onSuccess: () => {
        reset()
        setEffectiveDateOpen(false)
        setCompletionOpen(false)
      },
    })
  }

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Requirements', href: route('requirements.index') },
        { title: 'Create', href: '' },
      ]}
    >
      <Head title="Create Requirement" />

      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Requirement</h1>
            <p className="text-muted-foreground mt-1.5">
              Add a new compliance requirement
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href={route('requirements.index')}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1 – Basic Information */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Required fields are marked with *</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-2">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code" className="flex items-center gap-1.5">
                    Code <span className="text-red-500 text-base">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="e.g. REQ-001, GDPR-Art.5.1"
                    value={data.code}
                    onChange={(e) => {
                      setData('code', e.target.value.toUpperCase().trim())
                      clearErrors('code')
                    }}
                    className={cn(
                      'h-11',
                      errors.code && 'border-destructive focus-visible:ring-destructive'
                    )}
                  />
                  {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-1.5">
                    Title <span className="text-red-500 text-base">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Data Protection Impact Assessment"
                    value={data.title}
                    onChange={(e) => {
                      setData('title', e.target.value)
                      clearErrors('title')
                    }}
                    className={cn(
                      'h-11',
                      errors.title && 'border-destructive focus-visible:ring-destructive'
                    )}
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Type <span className="text-red-500 text-base">*</span></Label>
                  <Select
                    value={data.type}
                    onValueChange={(v) => {
                      setData('type', v)
                      clearErrors('type')
                    }}
                  >
                    <SelectTrigger className={cn('h-11', errors.type && 'border-destructive')}>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regulatory">Regulatory</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="contractual">Contractual</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-destructive mt-1.5">{errors.type}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Status <span className="text-red-500 text-base">*</span></Label>
                  <Select
                    value={data.status}
                    onValueChange={(v) => {
                      setData('status', v)
                      clearErrors('status')
                    }}
                  >
                    <SelectTrigger className={cn('h-11', errors.status && 'border-destructive')}>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-destructive mt-1.5">{errors.status}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Priority <span className="text-red-500 text-base">*</span></Label>
                  <Select
                    value={data.priority}
                    onValueChange={(v) => {
                      setData('priority', v)
                      clearErrors('priority')
                    }}
                  >
                    <SelectTrigger className={cn('h-11', errors.priority && 'border-destructive')}>
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && <p className="text-sm text-destructive mt-1.5">{errors.priority}</p>}
                </div>

                <div className="space-y-2 flex flex-col justify-end pb-1.5">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="auto-validate"
                      checked={data.auto_validate}
                      onCheckedChange={(checked) => setData('auto_validate', checked)}
                    />
                    <Label
                      htmlFor="auto-validate"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Auto-validate tests
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically accept tests created from predefined tests
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Frequency <span className="text-red-500">*</span></Label>
                  <Select
                    value={data.frequency}
                    onValueChange={(v) => {
                      setData('frequency', v)
                      clearErrors('frequency')
                    }}
                  >
                    <SelectTrigger className={cn('h-11', errors.frequency && 'border-destructive')}>
                      <SelectValue placeholder="Select frequency..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="continuous">Continuous</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.frequency && <p className="text-sm text-destructive mt-1.5">{errors.frequency}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Framework <span className="text-red-500">*</span></Label>
                  <Select
                    value={data.framework_id}
                    onValueChange={(v) => {
                      setData('framework_id', v)
                      clearErrors('framework_id')
                    }}
                  >
                    <SelectTrigger className={cn('h-11', errors.framework_id && 'border-destructive')}>
                      <SelectValue placeholder="Select framework..." />
                    </SelectTrigger>
                    <SelectContent>
                      {frameworks.length > 0 ? (
                        frameworks.map((fw) => (
                          <SelectItem key={fw.id} value={fw.id.toString()}>
                            {fw.code} — {fw.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="disabled" disabled>
                          No frameworks available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.framework_id && (
                    <p className="text-sm text-destructive mt-1.5">{errors.framework_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Process (optional)</Label>
                  <Select
                    value={data.process_id || 'none'}
                    onValueChange={(v) => setData('process_id', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / Not applicable</SelectItem>
                      {processes.map((proc) => (
                        <SelectItem key={proc.id} value={proc.id.toString()}>
                          {proc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 – Details & Context */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Details & Context</CardTitle>
                  <CardDescription>Detailed description and additional metadata</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-2">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Detailed explanation of the requirement, scope, applicability, responsibilities..."
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="min-h-[160px] resize-y"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Compliance Level <span className="text-red-500">*</span></Label>
                  <Select
                    value={data.compliance_level}
                    onValueChange={(v) => {
                      setData('compliance_level', v)
                      clearErrors('compliance_level')
                    }}
                  >
                    <SelectTrigger className={cn('h-11', errors.compliance_level && 'border-destructive')}>
                      <SelectValue placeholder="Select level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mandatory">Mandatory</SelectItem>
                      <SelectItem value="Recommended">Recommended</SelectItem>
                      <SelectItem value="Optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.compliance_level && (
                    <p className="text-sm text-destructive mt-1.5">{errors.compliance_level}</p>
                  )}
                </div>

                {/* ← Effective Date (anciennement Deadline) */}
                <div className="space-y-2">
                  <Label>Effective Date</Label>
                  <Popover open={effectiveDateOpen} onOpenChange={setEffectiveDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal h-11',
                          !data.effective_date && 'text-muted-foreground',
                          errors.effective_date && 'border-destructive focus-visible:ring-destructive'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data.effective_date
                          ? format(new Date(data.effective_date), 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={data.effective_date ? new Date(data.effective_date) : undefined}
                        onSelect={(date) => {
                          setData('effective_date', date ? format(date, 'yyyy-MM-dd') : '')
                          clearErrors('effective_date')
                          setEffectiveDateOpen(false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.effective_date && (
                    <p className="text-sm text-destructive mt-1.5">{errors.effective_date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Completion Date (optional)</Label>
                  <Popover open={completionOpen} onOpenChange={setCompletionOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal h-11',
                          !data.completion_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data.completion_date
                          ? format(new Date(data.completion_date), 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={data.completion_date ? new Date(data.completion_date) : undefined}
                        onSelect={(date) => {
                          setData('completion_date', date ? format(date, 'yyyy-MM-dd') : '')
                          setCompletionOpen(false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <TagIcon className="h-4 w-4" />
                  Tags
                </Label>
                <MultiSelect
                  options={(tags ?? []).map((tag) => ({
                    value: tag.id.toString(),
                    label: tag.name,
                  }))}
                  value={data.tags}
                  onValueChange={(selected) => setData('tags', selected)}
                  placeholder="Select relevant tags..."
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <FileUp className="h-4 w-4" />
                  Attachments (URLs)
                </Label>
                <Textarea
                  placeholder="One link per line&#10;Examples:&#10;https://drive.google.com/file/...&#10;https://company.sharepoint.com/..."
                  value={data.attachments}
                  onChange={(e) => setData('attachments', e.target.value)}
                  className="min-h-[110px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Supported: Google Drive, SharePoint, OneDrive links, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={processing}
              asChild
            >
              <Link href={route('requirements.index')}>Cancel</Link>
            </Button>

            <Button
              type="submit"
              size="lg"
              disabled={processing}
              className="min-w-[200px]"
            >
              {processing ? 'Creating...' : 'Create Requirement'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}