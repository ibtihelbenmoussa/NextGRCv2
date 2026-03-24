// resources/js/pages/requirements/edit.tsx
import { useState } from 'react'
import { Head, Link, useForm, usePage, router } from '@inertiajs/react'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'          // ← ajouté
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

interface Framework { id: number; code: string; name: string }
interface Process { id: number; name: string }
interface Tag { id: number; name: string }

interface Requirement {
  id: number
  code: string
  title: string
  description: string | null
  type: string
  status: string
  priority: string
  frequency: string
  framework_id: number | null
  process_id: number | null
  deadline: string | null
  completion_date: string | null
  compliance_level: string
  attachments: string | null
  auto_validate: boolean          // ← ajouté
}

interface PageProps {
  requirement: Requirement
  frameworks: Framework[]
  processes: Process[]
  tags: Tag[]
  selectedTagIds: string[]
  flash?: { success?: string; error?: string }
  [key: string]: any
}

// Normalise ce qu'Inertia envoie — tableau OU objet indexé → T[]
const toArray = <T,>(val: T[] | Record<string, T> | null | undefined): T[] => {
  if (!val) return []
  if (Array.isArray(val)) return val
  return Object.values(val)
}

export default function EditRequirement() {
  const { props } = usePage<PageProps>()

  const { requirement, frameworks = [], processes = [] } = props

  // Normalisation défensive des deux listes critiques
  const tags: Tag[] = toArray(props.tags)
  const selectedTagIds: string[] = toArray(props.selectedTagIds)

  const formatDateString = (date: string | null) => (date ? date.split('T')[0] : '')

  const { data, setData, put, processing, errors, setError, clearErrors } = useForm({
    code: requirement.code || '',
    title: requirement.title || '',
    description: requirement.description || '',
    type: requirement.type || '',
    status: requirement.status || '',
    priority: requirement.priority || '',
    frequency: requirement.frequency || '',
    framework_id: requirement.framework_id?.toString() || '',
    process_id: requirement.process_id?.toString() || '',
    tags: selectedTagIds,
    deadline: formatDateString(requirement.deadline),
    completion_date: formatDateString(requirement.completion_date),
    compliance_level: requirement.compliance_level || '',
    attachments: requirement.attachments || '',
    auto_validate: requirement.auto_validate ?? false,   // ← ajouté
  })

  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const [completionOpen, setCompletionOpen] = useState(false)
  const [flashOpen, setFlashOpen] = useState(false)
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    const validationErrors: Record<string, string> = {}
    if (!data.code.trim()) validationErrors.code = 'Code is required'
    if (!data.title.trim()) validationErrors.title = 'Title is required'
    if (!data.type) validationErrors.type = 'Type is required'
    if (!data.status) validationErrors.status = 'Status is required'
    if (!data.priority) validationErrors.priority = 'Priority is required'
    if (!data.frequency) validationErrors.frequency = 'Frequency is required'
    if (!data.framework_id) validationErrors.framework_id = 'Framework is required'
    if (!data.compliance_level) validationErrors.compliance_level = 'Compliance level is required'

    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([key, msg]) => setError(key as any, msg))
      return
    }

    put(route('requirements.update', requirement.id), {
      preserveScroll: true,
      onSuccess: () => {
        router.visit(route('requirements.index'), {
          method: 'get',
          preserveState: false,
          preserveScroll: false,
        })
      },
      onError: (err) => {
        setFlash({ type: 'error', message: 'Error updating requirement. Please check the form fields.' })
        setFlashOpen(true)
        console.error('Update errors:', err)
      },
    })
  }

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Requirements', href: route('requirements.index') },
        { title: 'Edit', href: '' },
      ]}
    >
      <Head title="Edit Requirement" />

      <Dialog open={flashOpen} onOpenChange={setFlashOpen}>
        <DialogContent className={cn(flash?.type === 'success' ? 'border-green-600' : 'border-red-600')}>
          <DialogHeader>
            <DialogTitle className={cn(flash?.type === 'success' ? 'text-green-600' : 'text-red-600')}>
              {flash?.type === 'success' ? 'Success' : 'Error'}
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">{flash?.message}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlashOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Requirement</h1>
            <p className="text-muted-foreground mt-1.5">
              Modify <span className="font-medium text-foreground">{requirement.title}</span>
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
                    onChange={e => { setData('code', e.target.value.toUpperCase().trim()); clearErrors('code') }}
                    className={cn('h-11', errors.code && 'border-destructive focus-visible:ring-destructive')}
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
                    onChange={e => { setData('title', e.target.value); clearErrors('title') }}
                    className={cn('h-11', errors.title && 'border-destructive focus-visible:ring-destructive')}
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>
              </div>

              {/* Type / Status / Priority / Auto-validate — même layout que create */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Type <span className="text-red-500 text-base">*</span></Label>
                  <Select value={data.type} onValueChange={v => { setData('type', v); clearErrors('type') }}>
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
                  <Select value={data.status} onValueChange={v => { setData('status', v); clearErrors('status') }}>
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
                  <Select value={data.priority} onValueChange={v => { setData('priority', v); clearErrors('priority') }}>
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

                {/* Auto-validate Switch — identique à create */}
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
                  <Select value={data.frequency} onValueChange={v => { setData('frequency', v); clearErrors('frequency') }}>
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
                  <Select value={data.framework_id} onValueChange={v => { setData('framework_id', v); clearErrors('framework_id') }}>
                    <SelectTrigger className={cn('h-11', errors.framework_id && 'border-destructive')}>
                      <SelectValue placeholder="Select framework..." />
                    </SelectTrigger>
                    <SelectContent>
                      {toArray(frameworks).length > 0 ? (
                        toArray(frameworks).map(fw => (
                          <SelectItem key={fw.id} value={fw.id.toString()}>
                            {fw.code} — {fw.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="disabled" disabled>No frameworks available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.framework_id && <p className="text-sm text-destructive mt-1.5">{errors.framework_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Process (optional)</Label>
                  <Select
                    value={data.process_id || 'none'}
                    onValueChange={v => setData('process_id', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / Not applicable</SelectItem>
                      {toArray(processes).map(proc => (
                        <SelectItem key={proc.id} value={proc.id.toString()}>{proc.name}</SelectItem>
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
                  onChange={e => setData('description', e.target.value)}
                  className="min-h-[160px] resize-y"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Compliance Level <span className="text-red-500">*</span></Label>
                  <Select value={data.compliance_level} onValueChange={v => { setData('compliance_level', v); clearErrors('compliance_level') }}>
                    <SelectTrigger className={cn('h-11', errors.compliance_level && 'border-destructive')}>
                      <SelectValue placeholder="Select level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mandatory">Mandatory</SelectItem>
                      <SelectItem value="Recommended">Recommended</SelectItem>
                      <SelectItem value="Optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.compliance_level && <p className="text-sm text-destructive mt-1.5">{errors.compliance_level}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal h-11',
                          !data.deadline && 'text-muted-foreground',
                          errors.deadline && 'border-destructive'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data.deadline ? format(new Date(data.deadline), 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={data.deadline ? new Date(data.deadline) : undefined}
                        onSelect={date => {
                          setData('deadline', date ? format(date, 'yyyy-MM-dd') : '')
                          clearErrors('deadline')
                          setDeadlineOpen(false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.deadline && <p className="text-sm text-destructive mt-1.5">{errors.deadline}</p>}
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
                        {data.completion_date ? format(new Date(data.completion_date), 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={data.completion_date ? new Date(data.completion_date) : undefined}
                        onSelect={date => {
                          setData('completion_date', date ? format(date, 'yyyy-MM-dd') : '')
                          setCompletionOpen(false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <TagIcon className="h-4 w-4" />
                  Tags
                </Label>
                <MultiSelect
                  options={tags.map((t) => ({
                    value: String(t.id),
                    label: t.name,
                  }))}
                  defaultValue={selectedTagIds}
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
                  onChange={e => setData('attachments', e.target.value)}
                  className="min-h-[110px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Supported: Google Drive, SharePoint, OneDrive links, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" size="lg" disabled={processing} asChild>
              <Link href={route('requirements.index')}>Cancel</Link>
            </Button>
            <Button type="submit" size="lg" disabled={processing} className="min-w-[200px]">
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}