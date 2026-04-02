import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronRight, Building2, Layers, GitBranch, Search, X } from 'lucide-react'

interface BusinessUnit {
  id: number
  name: string
  code: string
}

interface MacroProcess {
  id: number
  name: string
  code: string
  business_unit_id: number
}

interface Process {
  id: number
  name: string
  macro_process_id: number
}

interface CascadeProcessSelectorProps {
  businessUnits: BusinessUnit[]
  macroProcesses: MacroProcess[]
  processes: Process[]
  selectedProcessId: string
  onProcessChange: (processId: string) => void
}

type Step = 'bu' | 'mp' | 'process'

export function CascadeProcessSelector({
  businessUnits,
  macroProcesses,
  processes,
  selectedProcessId,
  onProcessChange,
}: CascadeProcessSelectorProps) {
  const [selectedBuId, setSelectedBuId] = useState<string>('')
  const [selectedMpId, setSelectedMpId] = useState<string>('')
  const [openStep, setOpenStep]         = useState<Step | null>('bu')
  const [searchQuery, setSearchQuery]   = useState<string>('')

  // ── Search mode : active quand la query n'est pas vide ──────────────────
  const isSearching = searchQuery.trim().length > 0
  const q = searchQuery.toLowerCase().trim()

  // Résultats filtrés pour chaque niveau
  const matchedBus = useMemo(() =>
    businessUnits.filter(b =>
      b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
    ), [businessUnits, q])

  const matchedMps = useMemo(() =>
    macroProcesses.filter(m =>
      m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
    ), [macroProcesses, q])

  const matchedProcesses = useMemo(() =>
    processes.filter(p =>
      p.name.toLowerCase().includes(q)
    ), [processes, q])

  // ── Helpers pour les labels ─────────────────────────────────────────────
  const getBuLabel = (id: number) => {
    const b = businessUnits.find(b => b.id === id)
    return b ? `${b.code} — ${b.name}` : ''
  }
  const getMpLabel = (id: number) => {
    const m = macroProcesses.find(m => m.id === id)
    return m ? `${m.code} — ${m.name}` : ''
  }
  const getMpBuLabel = (mp: MacroProcess) => {
    const bu = businessUnits.find(b => b.id === mp.business_unit_id)
    return bu ? `${bu.code} — ${bu.name}` : ''
  }
  const getProcessMpLabel = (p: Process) => {
    const mp = macroProcesses.find(m => m.id === p.macro_process_id)
    if (!mp) return ''
    const bu = businessUnits.find(b => b.id === mp.business_unit_id)
    return bu ? `${bu.code} › ${mp.code} › ${p.name}` : `${mp.code} › ${p.name}`
  }

  // ── Sélection normale (cascade) ─────────────────────────────────────────
  const selectedBu      = businessUnits.find(b => b.id.toString() === selectedBuId)
  const selectedMp      = macroProcesses.find(m => m.id.toString() === selectedMpId)
  const selectedProcess = processes.find(p => p.id.toString() === selectedProcessId)

  const filteredMp = selectedBuId
    ? macroProcesses.filter(m => m.business_unit_id === parseInt(selectedBuId))
    : []
  const filteredProcesses = selectedMpId
    ? processes.filter(p => p.macro_process_id === parseInt(selectedMpId))
    : []

  const handleSelectBu = (buId: string) => {
    setSelectedBuId(buId); setSelectedMpId(''); onProcessChange(''); setOpenStep('mp')
  }
  const handleSelectMp = (mpId: string) => {
    setSelectedMpId(mpId); onProcessChange(''); setOpenStep('process')
  }
  const handleSelectProcess = (processId: string) => {
    onProcessChange(processId); setOpenStep(null)
  }
  const handleReset = () => {
    setSelectedBuId(''); setSelectedMpId(''); onProcessChange(''); setOpenStep('bu')
  }

  // ── Sélection depuis la recherche ───────────────────────────────────────
  const handleSearchSelectBu = (bu: BusinessUnit) => {
    setSelectedBuId(bu.id.toString())
    setSelectedMpId('')
    onProcessChange('')
    setSearchQuery('')
    setOpenStep('mp')
  }
  const handleSearchSelectMp = (mp: MacroProcess) => {
    setSelectedBuId(mp.business_unit_id.toString())
    setSelectedMpId(mp.id.toString())
    onProcessChange('')
    setSearchQuery('')
    setOpenStep('process')
  }
  const handleSearchSelectProcess = (p: Process) => {
    const mp = macroProcesses.find(m => m.id === p.macro_process_id)
    if (mp) {
      setSelectedBuId(mp.business_unit_id.toString())
      setSelectedMpId(mp.id.toString())
    }
    onProcessChange(p.id.toString())
    setSearchQuery('')
    setOpenStep(null)
  }

  // ── Steps config (cascade normale) ─────────────────────────────────────
  const steps: { key: Step; label: string; icon: React.ReactNode; value: string | undefined }[] = [
    { key: 'bu',      label: 'Business Unit',  icon: <Building2 className="h-4 w-4" />, value: selectedBu ? `${selectedBu.code} — ${selectedBu.name}` : undefined },
    { key: 'mp',      label: 'Macro Process',  icon: <Layers className="h-4 w-4" />,    value: selectedMp ? `${selectedMp.code} — ${selectedMp.name}` : undefined },
    { key: 'process', label: 'Process',        icon: <GitBranch className="h-4 w-4" />, value: selectedProcess ? selectedProcess.name : undefined },
  ]

  const isStepAccessible = (step: Step) => {
    if (step === 'bu') return true
    if (step === 'mp') return !!selectedBuId
    if (step === 'process') return !!selectedMpId
    return false
  }

  const getStepItems = (step: Step) => {
    if (step === 'bu')      return businessUnits.map(b => ({ id: b.id, label: `${b.code} — ${b.name}` }))
    if (step === 'mp')      return filteredMp.map(m => ({ id: m.id, label: `${m.code} — ${m.name}` }))
    if (step === 'process') return filteredProcesses.map(p => ({ id: p.id, label: p.name }))
    return []
  }

  const getSelectedId = (step: Step) => {
    if (step === 'bu')      return selectedBuId
    if (step === 'mp')      return selectedMpId
    if (step === 'process') return selectedProcessId
    return ''
  }

  const handleSelect = (step: Step, id: string) => {
    if (step === 'bu')           handleSelectBu(id)
    else if (step === 'mp')      handleSelectMp(id)
    else if (step === 'process') handleSelectProcess(id)
  }

  const totalMatches = matchedBus.length + matchedMps.length + matchedProcesses.length

  return (
    <div className="space-y-2">
      {/* ── Breadcrumb résumé ── */}
      {selectedProcessId && !isSearching && (
        <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <div className="flex items-center gap-1.5 text-primary font-medium flex-wrap">
            <span>{selectedBu?.name}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span>{selectedMp?.name}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span>{selectedProcess?.name}</span>
          </div>
          <button type="button" onClick={handleReset} className="ml-3 shrink-0 text-xs text-muted-foreground hover:text-destructive transition-colors">
            Reset
          </button>
        </div>
      )}

      {/* ── Barre de recherche ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search business units, macro-processes or processes…"
          className="w-full rounded-lg border bg-background pl-9 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Mode recherche ── */}
      {isSearching ? (
        <div className="rounded-lg border overflow-hidden">
          {totalMatches === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground italic">
              No results for &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y">

              {/* Business Units */}
              {matchedBus.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
                    <Building2 className="h-3.5 w-3.5" /> Business Units
                    <span className="ml-auto bg-muted rounded-full px-1.5 py-0.5 text-[10px]">{matchedBus.length}</span>
                  </div>
                  {matchedBus.map(bu => (
                    <button
                      key={bu.id}
                      type="button"
                      onClick={() => handleSearchSelectBu(bu)}
                      className={cn(
                        'w-full flex items-center justify-between px-5 py-2.5 text-sm text-left transition-colors hover:bg-muted/50',
                        selectedBuId === bu.id.toString() && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <span>{bu.code} — {bu.name}</span>
                      {selectedBuId === bu.id.toString() && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  ))}
                </>
              )}

              {/* Macro Processes */}
              {matchedMps.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
                    <Layers className="h-3.5 w-3.5" /> Macro Processes
                    <span className="ml-auto bg-muted rounded-full px-1.5 py-0.5 text-[10px]">{matchedMps.length}</span>
                  </div>
                  {matchedMps.map(mp => (
                    <button
                      key={mp.id}
                      type="button"
                      onClick={() => handleSearchSelectMp(mp)}
                      className={cn(
                        'w-full flex items-center justify-between px-5 py-2.5 text-sm text-left transition-colors hover:bg-muted/50',
                        selectedMpId === mp.id.toString() && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <div>
                        <span>{mp.code} — {mp.name}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{getMpBuLabel(mp)}</p>
                      </div>
                      {selectedMpId === mp.id.toString() && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  ))}
                </>
              )}

              {/* Processes */}
              {matchedProcesses.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
                    <GitBranch className="h-3.5 w-3.5" /> Processes
                    <span className="ml-auto bg-muted rounded-full px-1.5 py-0.5 text-[10px]">{matchedProcesses.length}</span>
                  </div>
                  {matchedProcesses.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSearchSelectProcess(p)}
                      className={cn(
                        'w-full flex items-center justify-between px-5 py-2.5 text-sm text-left transition-colors hover:bg-muted/50',
                        selectedProcessId === p.id.toString() && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <div>
                        <span>{p.name}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{getProcessMpLabel(p)}</p>
                      </div>
                      {selectedProcessId === p.id.toString() && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Mode cascade normal ── */
        <div className="rounded-lg border divide-y overflow-hidden">
          {steps.map((step, index) => {
            const accessible = isStepAccessible(step.key)
            const isOpen     = openStep === step.key
            const isDone     = !!step.value
            const items      = getStepItems(step.key)
            const selectedId = getSelectedId(step.key)

            return (
              <div key={step.key}>
                <button
                  type="button"
                  disabled={!accessible}
                  onClick={() => accessible && setOpenStep(isOpen ? null : step.key)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors',
                    accessible ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-40 cursor-not-allowed',
                    isOpen && 'bg-muted/40'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold shrink-0 transition-colors',
                      isDone
                        ? 'bg-primary text-primary-foreground'
                        : isOpen
                          ? 'bg-primary/20 text-primary border border-primary'
                          : 'bg-muted text-muted-foreground border'
                    )}>
                      {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        {step.icon}{step.label}
                      </div>
                      {step.value && <p className="text-xs text-muted-foreground mt-0.5">{step.value}</p>}
                    </div>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-90')} />
                </button>

                {isOpen && accessible && (
                  <div className="bg-background border-t">
                    {items.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground italic">No items available</p>
                    ) : (
                      <ul className="max-h-48 overflow-y-auto divide-y">
                        {items.map(item => {
                          const isSelected = selectedId === item.id.toString()
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => handleSelect(step.key, item.id.toString())}
                                className={cn(
                                  'w-full flex items-center justify-between px-5 py-2.5 text-sm text-left transition-colors',
                                  isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-foreground'
                                )}
                              >
                                <span>{item.label}</span>
                                {isSelected && <Check className="h-4 w-4 shrink-0" />}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}