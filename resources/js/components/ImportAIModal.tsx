import { useState, useRef, useCallback } from 'react'
import { router } from '@inertiajs/react'
import axios from 'axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, Loader2, Check, ChevronRight } from 'lucide-react'

interface ExtractedRequirement {
  code: string
  title: string
  description: string
  type: string
  priority: string
  frequency: string
  compliance_level: string
  source_text: string
  selected: boolean
}

interface Framework {
  id: number
  code: string
  name: string
}

interface Props {
  open: boolean
  onClose: () => void
  frameworks: Framework[]
}

function StepDot({ step, current, label }: { step: number; current: number; label: string }) {
  const done   = current > step
  const active = current === step
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
        done   && 'bg-emerald-600 text-white',
        active && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
        !done && !active && 'bg-muted text-muted-foreground',
      )}>
        {done ? <Check className="h-3.5 w-3.5" /> : step}
      </div>
      <span className={cn('text-sm hidden sm:block', active ? 'text-foreground font-medium' : 'text-muted-foreground')}>
        {label}
      </span>
    </div>
  )
}

const priorityColors: Record<string, string> = {
  critical: 'bg-[#FCEBEB] text-[#501313] dark:bg-[#501313] dark:text-[#F7C1C1]',
  high:     'bg-[#FCEBEB] text-[#501313] dark:bg-[#501313] dark:text-[#F7C1C1]',
  medium:   'bg-[#FAEEDA] text-[#412402] dark:bg-[#412402] dark:text-[#FAC775]',
  low:      'bg-[#EAF3DE] text-[#27500A] dark:bg-[#27500A] dark:text-[#C0DD97]',
}

export function ImportAIModal({ open, onClose, frameworks }: Props) {
  const [step,         setStep]         = useState(1)
  const [file,         setFile]         = useState<File | null>(null)
  const [frameworkHint,setFrameworkHint]= useState('')
  const [frameworkId,  setFrameworkId]  = useState<string>('')
  const [dragging,     setDragging]     = useState(false)
  const [analyzing,    setAnalyzing]    = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [requirements, setRequirements] = useState<ExtractedRequirement[]>([])
  const [importing,    setImporting]    = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep(1); setFile(null); setFrameworkHint(''); setFrameworkId('')
    setDragging(false); setAnalyzing(false); setError(null)
    setRequirements([]); setImporting(false); setImportResult(null)
  }

  const handleClose = () => { reset(); onClose() }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }, [])

  const handleAnalyze = async () => {
    if (!file) return
    setAnalyzing(true); setError(null); setStep(2)
    const formData = new FormData()
    formData.append('file', file)
    if (frameworkHint) formData.append('framework_hint', frameworkHint)

    try {
      const res = await axios.post('/ai/analyze-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRequirements(res.data.requirements.map((r: any) => ({ ...r, selected: true })))
      setStep(3)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'analyse.')
      setStep(1)
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleAll = (val: boolean) => setRequirements(prev => prev.map(r => ({ ...r, selected: val })))
  const toggleOne = (idx: number)  => setRequirements(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r))

  const handleImport = async () => {
    if (!frameworkId) { setError('Sélectionne un framework'); return }
    const selected = requirements.filter(r => r.selected)
    if (selected.length === 0) { setError('Sélectionne au moins un requirement'); return }

    setImporting(true); setError(null)
    try {
      const res = await axios.post('/ai/import-requirements', {
        requirements: selected,
        framework_id: frameworkId,
      })
      setImportResult(res.data)
      setStep(4)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'import.')
    } finally {
      setImporting(false)
    }
  }

  const selectedCount = requirements.filter(r => r.selected).length

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Import with AI</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Extract requirements automatically from a compliance document
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <StepDot step={1} current={step} label="Upload" />
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            <StepDot step={2} current={step} label="Analyzing" />
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            <StepDot step={3} current={step} label="Review" />
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            <StepDot step={4} current={step} label="Done" />
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="p-6 space-y-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                  dragging  && 'border-primary bg-primary/5 scale-[1.01]',
                  file      && 'border-emerald-500/60 bg-emerald-500/5',
                  !dragging && !file && 'border-border/60 hover:border-border hover:bg-muted/20',
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <FileText className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-400">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB — click to change
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Drop your document here</p>
                      <p className="text-sm text-muted-foreground mt-1">PDF, Word (.docx) or Excel (.xlsx) · Max 20 MB</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      ISO 27001 · RGPD · SOC2 · any compliance standard
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">
                  Framework hint <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g. ISO 27001, RGPD, SOC2..."
                  value={frameworkHint}
                  onChange={e => setFrameworkHint(e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">AI is analyzing your document</p>
                <p className="text-sm text-muted-foreground">Reading and extracting compliance requirements...</p>
                <p className="text-xs text-muted-foreground/60 font-mono">{file?.name}</p>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-sm">Target Framework <span className="text-red-500">*</span></Label>
                  <Select value={frameworkId} onValueChange={setFrameworkId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework..." />
                    </SelectTrigger>
                    <SelectContent>
                      {frameworks.map(fw => (
                        <SelectItem key={fw.id} value={String(fw.id)}>
                          <span className="font-mono text-xs text-muted-foreground mr-2">{fw.code}</span>
                          {fw.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-semibold">{selectedCount}</span> / {requirements.length} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>All</Button>
                  <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>None</Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="grid grid-cols-[28px_110px_1fr_100px_80px_100px] gap-3 px-4 py-2.5 bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span/><span>Code</span><span>Title</span><span>Type</span><span>Priority</span><span>Frequency</span>
                </div>
                <div className="divide-y divide-border/40 max-h-[400px] overflow-y-auto">
                  {requirements.map((req, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleOne(idx)}
                      className={cn(
                        'grid grid-cols-[28px_110px_1fr_100px_80px_100px] gap-3 px-4 py-3 items-center cursor-pointer transition-colors',
                        req.selected ? 'hover:bg-muted/20' : 'opacity-50 bg-muted/10 hover:opacity-70',
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all',
                        req.selected ? 'bg-primary border-primary' : 'border-border',
                      )}>
                        {req.selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <span className="font-mono text-xs text-muted-foreground truncate">{req.code}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{req.title}</p>
                        {req.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{req.description}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs capitalize w-fit">{req.type}</Badge>
                      <span className={cn('inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full capitalize w-fit', priorityColors[req.priority] ?? priorityColors['medium'])}>
                        {req.priority}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{req.frequency?.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && importResult && (
            <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold">Import réussi !</p>
                <p className="text-muted-foreground">
                  <span className="text-emerald-400 font-semibold">{importResult.created}</span> requirement(s) créé(s)
                  {importResult.skipped > 0 && <span className="text-muted-foreground/60"> · {importResult.skipped} ignoré(s)</span>}
                </p>
              </div>
              <Button onClick={() => { handleClose(); router.reload() }}>
                Voir les requirements
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0 bg-muted/20">
          <Button variant="ghost" onClick={handleClose} disabled={analyzing || importing}>Cancel</Button>
          <div className="flex items-center gap-3">
            {step === 1 && (
              <Button onClick={handleAnalyze} disabled={!file || analyzing} className="gap-2 min-w-[160px]">
                {analyzing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                  : <><Sparkles className="h-4 w-4" /> Analyze with AI</>
                }
              </Button>
            )}
            {step === 3 && (
              <Button
                onClick={handleImport}
                disabled={importing || selectedCount === 0 || !frameworkId}
                className="gap-2 min-w-[160px] bg-emerald-700 hover:bg-emerald-600 text-white"
              >
                {importing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</>
                  : <><CheckCircle2 className="h-4 w-4" /> Import {selectedCount} requirement{selectedCount > 1 ? 's' : ''}</>
                }
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}