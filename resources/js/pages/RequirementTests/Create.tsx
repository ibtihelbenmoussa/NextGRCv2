import { Head, useForm, router } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { useState, useEffect } from 'react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, parseISO } from 'date-fns'
import { CalendarIcon, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Framework  { id: number; code: string; name: string }
interface Requirement { id: number; code: string; title: string; framework?: Framework | null }

interface Props {
  requirement: Requirement
  defaultDate?: string
}

// ─── AutoChip — chip ✦ auto inline dans le label ──────────────────────────────

function AutoChip({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1.5 select-none"
      style={{
        background: 'linear-gradient(135deg, #EAF3DE, #C0DD97)',
        color: '#27500A',
        border: '0.5px solid #97C459',
        letterSpacing: '0.02em',
      }}
    >
      ✦ auto
    </span>
  )
}

// ─── autoClass — bordure verte si auto-rempli ─────────────────────────────────

function autoInputClass(isAuto: boolean) {
  if (!isAuto) return ''
  return 'border-[#97C459] focus-visible:ring-[#97C459]/30 bg-[#EAF3DE]/10'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Create({ requirement, defaultDate }: Props) {

const savedDate = typeof window !== 'undefined'
  ? localStorage.getItem('selectedComplianceDate')
  : null

const resolvedDate = savedDate ?? defaultDate ?? format(new Date(), 'yyyy-MM-dd')
  const isBackfill   = defaultDate !== undefined && defaultDate !== format(new Date(), 'yyyy-MM-dd')

  const { data, setData, post, processing, errors, setError, clearErrors, recentlySuccessful } = useForm({
    test_code:      '',
    name:           '',
    objective:      '',
    procedure:      '',
    status:         'pending',
    result:         '',
    efficacy:       'effective',
    evidence:       '',
    requirement_id: requirement.id,
    test_date:      resolvedDate,
    tested_at: resolvedDate,
    comment:        '',
    failure_reason: '',
  })

  // Tracks which fields were auto-filled
  const [autoFields, setAutoFields] = useState<Set<string>>(new Set())
useEffect(() => {
  const savedDate = localStorage.getItem('selectedComplianceDate');

  if (savedDate) {
    setData(prev => ({
      ...prev,
      test_date: savedDate,
      tested_at: format(new Date(), 'yyyy-MM-dd'),
    }));
  }
}, []);
  useEffect(() => {
    fetch(`/requirements/${requirement.id}/predefined-tests/requirement`)
      .then(r => r.json())
      .then(predefined => {
        if (predefined && predefined.id) {
          const filled = new Set<string>()
          const updates: Partial<typeof data> = {}

          if (predefined.test_code) { updates.test_code = predefined.test_code; filled.add('test_code') }
          if (predefined.test_name) { updates.name      = predefined.test_name;  filled.add('name')      }
          if (predefined.objective) { updates.objective  = predefined.objective;  filled.add('objective') }
          if (predefined.procedure) { updates.procedure  = predefined.procedure;  filled.add('procedure') }

          setData(prev => ({ ...prev, ...updates }))
          setAutoFields(filled)
        }
      })
      .catch(() => {})
  }, [requirement.id])

  const isAuto = (field: string) => autoFields.has(field)

  const validateForm = () => {
    let isValid = true
    clearErrors()

    if (!data.test_code.trim()) { setError('test_code', 'Test Code is required'); isValid = false }
    if (!data.name.trim())      { setError('name', 'Name is required'); isValid = false }
    if (!data.objective.trim()) { setError('objective', 'Objective is required'); isValid = false }
    if (!data.procedure.trim()) { setError('procedure', 'Procedure is required'); isValid = false }
    if (!data.result)           { setError('result', 'Result is required'); isValid = false }

    if (data.result === 'non_compliant' && !data.failure_reason.trim()) {
      setError('failure_reason', 'Reason for failure is required when result is non-compliant')
      isValid = false
    }

    return isValid
  }

  /* const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    post(route('requirements.test.store', requirement.id), {
      preserveScroll: true,
      onSuccess: () => {
        window.location.href = route('req-testing.index') + `?date=${data.test_date}`
      },
    })
  }
 */
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;

  const savedDate = localStorage.getItem('selectedComplianceDate');

  const testDate = savedDate || data.test_date;
  const testedAt = format(new Date(), 'yyyy-MM-dd');

  router.post(route('requirements.test.store', requirement.id), {
    ...data,
    test_date: testDate,
    tested_at: testedAt,
  }, {
    onSuccess: () => {
      localStorage.removeItem('selectedComplianceDate');
      router.visit(route('req-testing.index') + `?date=${testDate}`);
    },
  });
};
  const displayDate = (() => {
    try { return format(parseISO(resolvedDate), 'MMM dd, yyyy') }
    catch { return format(new Date(), 'MMM dd, yyyy') }
  })()

  return (
    <AppLayout breadcrumbs={[
      { title: 'Compliance Tests', href: route('req-testing.index') },
      { title: 'Create Test', href: '' },
    ]}>
      <Head title="New Compliance Test" />

      <div className="space-y-12 p-6 lg:p-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Compliance Test</h1>
            <div className="mt-3 space-y-2">
              <p className="text-lg text-foreground/90">
                <span className="font-semibold">{requirement.code}</span> — {requirement.title}
              </p>
              {requirement.framework && (
                <div className="inline-flex items-center gap-3 bg-background/70 px-4 py-2 rounded-full border border-border/60">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {requirement.framework.code}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-medium">
                    {requirement.framework.name}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={route('req-testing.index') + `?date=${data.test_date}`}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to List
            </a>
          </Button>
        </div>

        {/* ── Success ── */}
        {recentlySuccessful && (
          <Alert className="bg-emerald-950/50 border-emerald-800 text-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <AlertTitle className="text-emerald-300">Test created successfully!</AlertTitle>
            <AlertDescription className="mt-2">You will be redirected automatically.</AlertDescription>
          </Alert>
        )}

        {/* ── Form ── */}
        <Card className="border-none shadow-2xl bg-gradient-to-b from-card to-card/90 backdrop-blur-sm">
          <CardContent className="pt-10 pb-14 px-6 md:px-12 lg:px-16">
            <form onSubmit={handleSubmit} className="space-y-16">

              {/* Basic Information */}
              <div className="space-y-10">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-4">Basic Information</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  {/* Test Code */}
                  <div className="space-y-2">
                    <Label htmlFor="test_code" className="text-sm font-medium flex items-center">
                      Test Code <span className="text-red-500 ml-1">*</span>
                      <AutoChip show={isAuto('test_code')} />
                    </Label>
                    <Input
                      id="test_code"
                      placeholder="TEST-2025-001"
                      value={data.test_code}
                      onChange={e => { setData('test_code', e.target.value.trim().toUpperCase()); if (errors.test_code) clearErrors('test_code') }}
                      className={cn('h-11 text-base transition-all', autoInputClass(isAuto('test_code')), errors.test_code && 'border-red-500')}
                      maxLength={50}
                    />
                    {errors.test_code && <p className="text-red-600 text-sm mt-1.5">{errors.test_code}</p>}
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center">
                      Name / Summary <span className="text-red-500 ml-1">*</span>
                      <AutoChip show={isAuto('name')} />
                    </Label>
                    <Input
                      id="name"
                      placeholder="Quarterly access rights review"
                      value={data.name}
                      onChange={e => { setData('name', e.target.value); if (errors.name) clearErrors('name') }}
                      className={cn('h-11 text-base transition-all', autoInputClass(isAuto('name')), errors.name && 'border-red-500')}
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1.5">{errors.name}</p>}
                  </div>
                </div>
              </div>

              {/* Test Details */}
              <div className="space-y-10">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-4">Test Details</h2>

                <div className="space-y-6">

                  {/* Objective */}
                  <div className="space-y-3">
                    <Label htmlFor="objective" className="text-sm font-medium flex items-center">
                      Objective <span className="text-red-500 ml-1">*</span>
                      <AutoChip show={isAuto('objective')} />
                    </Label>
                    <Textarea
                      id="objective"
                      placeholder="Define what this test aims to verify..."
                      value={data.objective}
                      onChange={e => { setData('objective', e.target.value); if (errors.objective) clearErrors('objective') }}
                      className={cn('min-h-[120px] resize-y transition-all', autoInputClass(isAuto('objective')), errors.objective && 'border-red-500')}
                    />
                    {errors.objective && <p className="text-red-600 text-sm mt-1.5">{errors.objective}</p>}
                  </div>

                  {/* Procedure */}
                  <div className="space-y-3">
                    <Label htmlFor="procedure" className="text-sm font-medium flex items-center">
                      Procedure / Steps <span className="text-red-500 ml-1">*</span>
                      <AutoChip show={isAuto('procedure')} />
                    </Label>
                    <Textarea
                      id="procedure"
                      placeholder="Step-by-step instructions to perform the test..."
                      value={data.procedure}
                      onChange={e => { setData('procedure', e.target.value); if (errors.procedure) clearErrors('procedure') }}
                      className={cn('min-h-[160px] resize-y transition-all', autoInputClass(isAuto('procedure')), errors.procedure && 'border-red-500')}
                    />
                    {errors.procedure && <p className="text-red-600 text-sm mt-1.5">{errors.procedure}</p>}
                  </div>

                  {/* Evidence */}
                  <div className="space-y-3">
                    <Label htmlFor="evidence" className="text-sm font-medium">Evidence / Proof</Label>
                    <Textarea
                      id="evidence"
                      placeholder="Screenshots, logs, documents, links... (one per line if multiple)"
                      value={data.evidence}
                      onChange={e => setData('evidence', e.target.value)}
                      className="min-h-[140px] resize-y"
                    />
                  </div>

                  {/* Comment */}
                  <div className="space-y-3">
                    <Label htmlFor="comment" className="text-sm font-medium">Comment</Label>
                    <Textarea
                      id="comment"
                      placeholder="Additional notes or observations about this test..."
                      value={data.comment}
                      onChange={e => setData('comment', e.target.value)}
                      className="min-h-[100px] resize-y"
                    />
                  </div>

                  {/* Test Date — read-only */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-1.5">Test Date</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-11 cursor-not-allowed opacity-70',
                        isBackfill && 'border-amber-500/40 bg-amber-500/5 text-amber-400'
                      )}
                      disabled
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {displayDate}
                      {isBackfill && (
                        <Badge variant="outline" className="ml-auto text-xs border-amber-500/40 text-amber-400">
                          past date
                        </Badge>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {isBackfill
                        ? `Backdated to ${displayDate} — set from the date you selected in the calendar.`
                        : "Automatically set to today's date."
                      }
                    </p>
                  </div>

                  {/* Result */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      Result <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select
                      value={data.result}
                      onValueChange={v => {
                        setData(prev => ({ ...prev, result: v, failure_reason: '' }))
                        if (errors.result)         clearErrors('result')
                        if (errors.failure_reason) clearErrors('failure_reason')
                      }}
                    >
                      <SelectTrigger className={cn('h-11', errors.result && 'border-red-500')}>
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="non_compliant">Non-compliant</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.result && <p className="text-red-600 text-sm mt-1.5">{errors.result}</p>}
                  </div>

                  {/* Failure reason */}
                  {data.result === 'non_compliant' && (
                    <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
                      <Label htmlFor="failure_reason" className="text-sm font-medium flex items-center gap-2 text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        Reason for failure <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="failure_reason"
                        placeholder="Explain why this test is non-compliant..."
                        value={data.failure_reason}
                        onChange={e => {
                          setData('failure_reason', e.target.value)
                          if (errors.failure_reason) clearErrors('failure_reason')
                        }}
                        className={cn('min-h-[120px] resize-y bg-background', errors.failure_reason && 'border-red-500')}
                      />
                      {errors.failure_reason && (
                        <p className="text-red-600 text-sm flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {errors.failure_reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-12 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => router.visit(route('req-testing.index') + `?date=${data.test_date}`)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  size="lg"
                  className="min-w-[220px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                      </svg>
                      Creating...
                    </span>
                  ) : 'Create Test'}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}