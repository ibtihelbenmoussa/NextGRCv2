import { Head, useForm, router, usePage } from '@inertiajs/react'
import { route } from 'ziggy-js'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChevronLeft, CheckCircle2, ClipboardList, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import type { PageProps as InertiaPageProps } from '@inertiajs/core'

interface Requirement {
  id: number
  code: string
  title: string
  auto_validate: boolean
}

interface Props {
  requirements: Requirement[]
}

interface CustomPageProps extends InertiaPageProps {
  flash?: {
    success?: string
    error?: string
  }
}

export default function CreatePredefinedTest({ requirements }: Props) {
  const { props } = usePage<CustomPageProps>()

  const { data, setData, post, processing, errors, setError, clearErrors, recentlySuccessful } =
    useForm({
      requirement_id: '',
      test_code: '',
      test_name: '',
      objective: '',
      procedure: '',
    })

  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null)

  useEffect(() => {
    if (data.requirement_id) {
      const req = requirements.find((r) => r.id === Number(data.requirement_id))
      setSelectedRequirement(req ?? null)
    } else {
      setSelectedRequirement(null)
    }
  }, [data.requirement_id, requirements])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    clearErrors()

    let hasError = false

    if (!data.requirement_id) {
      setError('requirement_id', 'Please select a requirement')
      hasError = true
    }
    if (!data.test_code.trim()) {
      setError('test_code', 'Test code is required')
      hasError = true
    }
    if (!data.test_name.trim()) {
      setError('test_name', 'Test name is required')
      hasError = true
    }
    if (!data.objective.trim()) {
      setError('objective', 'Objective is required')
      hasError = true
    }
    if (!data.procedure.trim()) {
      setError('procedure', 'Procedure is required')
      hasError = true
    }

    if (hasError) return

    // ✅ Nom de route corrigé
    post(route('predefinedTestReq.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setTimeout(() => {
          router.visit(route('predefinedTestReq.index'))
        }, 1400)
      },
    })
  }

  return (
    <AppLayout
      breadcrumbs={[
    
        { title: 'Predefined Tests', href: route('predefinedTestReq.index') },
        { title: 'Create', href: '' },
      ]}
    >
      <Head title="New Predefined Test" />

      <div className="min-h-full p-6 lg:p-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-border/60 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">New Predefined Test</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Link a test to a specific requirement
              </p>
            </div>
          </div>
          {/* ✅ Nom de route corrigé */}
          <Button variant="outline" size="sm" asChild>
            <a href={route('predefinedTestReq.index')}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </a>
          </Button>
        </div>

        {/* Flash / success message */}
        {props.flash?.success && (
          <Alert className="mb-8 bg-emerald-950/50 border-emerald-800 text-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <AlertTitle className="text-emerald-300">Success</AlertTitle>
            <AlertDescription>{props.flash.success}</AlertDescription>
          </Alert>
        )}

        {recentlySuccessful && (
          <Alert className="mb-8 bg-emerald-950/50 border-emerald-800 text-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <AlertTitle>Created successfully!</AlertTitle>
            <AlertDescription>Redirecting to list...</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-10 max-w-5xl mx-auto">
          {/* Requirement + auto-validate hint */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                Requirement <span className="text-red-500">*</span>
              </Label>
              <Select
                value={data.requirement_id}
                onValueChange={(v) => {
                  setData('requirement_id', v)
                  clearErrors('requirement_id')
                }}
              >
                <SelectTrigger className={cn('h-11 w-full', errors.requirement_id && 'border-red-500')}>
                  <SelectValue placeholder="Select a requirement..." />
                </SelectTrigger>
                <SelectContent>
                  {requirements.map((req) => (
                    <SelectItem key={req.id} value={String(req.id)}>
                      <span className="font-mono text-xs mr-2 opacity-70">{req.code}</span>
                      {req.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.requirement_id && (
                <p className="text-sm text-red-600">{errors.requirement_id}</p>
              )}
            </div>

            {selectedRequirement && (
              <div
                className={cn(
                  'p-4 rounded-lg border text-sm',
                  selectedRequirement.auto_validate
                    ? 'bg-blue-950/40 border-blue-800 text-blue-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300'
                )}
              >
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    {selectedRequirement.auto_validate ? (
                      <>
                        <p className="font-medium text-blue-300">
                          Auto-validation is enabled for this requirement
                        </p>
                        <p className="mt-1 opacity-90">
                          Any test created from this predefined test will be automatically accepted.
                        </p>
                      </>
                    ) : (
                      <p className="opacity-90">
                        Tests created from this requirement will start with "pending" status.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Code + Name */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="test_code" className="flex items-center gap-1.5">
                Test Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="test_code"
                placeholder="TST-001"
                value={data.test_code}
                onChange={(e) => {
                  setData('test_code', e.target.value.toUpperCase().trim())
                  clearErrors('test_code')
                }}
                className={cn('h-11 font-mono', errors.test_code && 'border-red-500')}
                maxLength={50}
              />
              {errors.test_code && <p className="text-sm text-red-600">{errors.test_code}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="test_name" className="flex items-center gap-1.5">
                Test Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="test_name"
                placeholder="Password length >= 8 characters"
                value={data.test_name}
                onChange={(e) => {
                  setData('test_name', e.target.value.trim())
                  clearErrors('test_name')
                }}
                className={cn('h-11', errors.test_name && 'border-red-500')}
              />
              {errors.test_name && <p className="text-sm text-red-600">{errors.test_name}</p>}
            </div>
          </div>

          {/* Objective + Procedure */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-2">
              <Label htmlFor="objective" className="flex items-center gap-1.5">
                Objective <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="objective"
                placeholder="Define what this test aims to verify..."
                value={data.objective}
                onChange={(e) => {
                  setData('objective', e.target.value)
                  clearErrors('objective')
                }}
                className={cn('min-h-[180px] resize-y', errors.objective && 'border-red-500')}
              />
              {errors.objective && <p className="text-sm text-red-600">{errors.objective}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedure" className="flex items-center gap-1.5">
                Procedure / Steps <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="procedure"
                placeholder="Step-by-step instructions to perform the test..."
                value={data.procedure}
                onChange={(e) => {
                  setData('procedure', e.target.value)
                  clearErrors('procedure')
                }}
                className={cn('min-h-[180px] resize-y', errors.procedure && 'border-red-500')}
              />
              {errors.procedure && <p className="text-sm text-red-600">{errors.procedure}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              // ✅ Nom de route corrigé
              onClick={() => router.visit(route('predefinedTestReq.index'))}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing} className="min-w-[180px]">
              {processing ? 'Creating...' : 'Create Predefined Test'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}