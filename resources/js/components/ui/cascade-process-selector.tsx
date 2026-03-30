import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, ChevronRight, Building2, Layers, GitBranch } from 'lucide-react'

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

  const selectedBu      = businessUnits.find((b) => b.id.toString() === selectedBuId)
  const selectedMp      = macroProcesses.find((m) => m.id.toString() === selectedMpId)
  const selectedProcess = processes.find((p) => p.id.toString() === selectedProcessId)

  const filteredMp = selectedBuId
    ? macroProcesses.filter((m) => m.business_unit_id === parseInt(selectedBuId))
    : []

  const filteredProcesses = selectedMpId
    ? processes.filter((p) => p.macro_process_id === parseInt(selectedMpId))
    : []

  const handleSelectBu = (buId: string) => {
    setSelectedBuId(buId)
    setSelectedMpId('')
    onProcessChange('')
    setOpenStep('mp')
  }

  const handleSelectMp = (mpId: string) => {
    setSelectedMpId(mpId)
    onProcessChange('')
    setOpenStep('process')
  }

  const handleSelectProcess = (processId: string) => {
    onProcessChange(processId)
    setOpenStep(null)
  }

  const handleReset = () => {
    setSelectedBuId('')
    setSelectedMpId('')
    onProcessChange('')
    setOpenStep('bu')
  }

  const steps: {
    key: Step
    label: string
    icon: React.ReactNode
    value: string | undefined
  }[] = [
    {
      key: 'bu',
      label: 'Business Unit',
      icon: <Building2 className="h-4 w-4" />,
      value: selectedBu ? `${selectedBu.code} — ${selectedBu.name}` : undefined,
    },
    {
      key: 'mp',
      label: 'Macro Process',
      icon: <Layers className="h-4 w-4" />,
      value: selectedMp ? `${selectedMp.code} — ${selectedMp.name}` : undefined,
    },
    {
      key: 'process',
      label: 'Process',
      icon: <GitBranch className="h-4 w-4" />,
      value: selectedProcess ? selectedProcess.name : undefined,
    },
  ]

  const isStepAccessible = (step: Step) => {
    if (step === 'bu')      return true
    if (step === 'mp')      return !!selectedBuId
    if (step === 'process') return !!selectedMpId
    return false
  }

  const getStepItems = (step: Step) => {
    if (step === 'bu')      return businessUnits.map((b) => ({ id: b.id, label: `${b.code} — ${b.name}` }))
    if (step === 'mp')      return filteredMp.map((m) => ({ id: m.id, label: `${m.code} — ${m.name}` }))
    if (step === 'process') return filteredProcesses.map((p) => ({ id: p.id, label: p.name }))
    return []
  }

  const getSelectedId = (step: Step) => {
    if (step === 'bu')      return selectedBuId
    if (step === 'mp')      return selectedMpId
    if (step === 'process') return selectedProcessId
    return ''
  }

  const handleSelect = (step: Step, id: string) => {
    if (step === 'bu')      handleSelectBu(id)
    else if (step === 'mp')      handleSelectMp(id)
    else if (step === 'process') handleSelectProcess(id)
  }

  return (
    <div className="space-y-2">
      {/* Résumé breadcrumb + Reset — visible uniquement quand process sélectionné */}
      {selectedProcessId && (
        <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <div className="flex items-center gap-1.5 text-primary font-medium flex-wrap">
            <span>{selectedBu?.name}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span>{selectedMp?.name}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span>{selectedProcess?.name}</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="ml-3 shrink-0 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Étapes verticales */}
      <div className="rounded-lg border divide-y overflow-hidden">
        {steps.map((step, index) => {
          const accessible = isStepAccessible(step.key)
          const isOpen     = openStep === step.key
          const isDone     = !!step.value
          const items      = getStepItems(step.key)
          const selectedId = getSelectedId(step.key)

          return (
            <div key={step.key}>
              {/* En-tête de l'étape */}
              <button
                type="button"
                disabled={!accessible}
                onClick={() => accessible && setOpenStep(isOpen ? null : step.key)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors',
                  accessible
                    ? 'hover:bg-muted/50 cursor-pointer'
                    : 'opacity-40 cursor-not-allowed',
                  isOpen && 'bg-muted/40'
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Numéro / Check */}
                  <div
                    className={cn(
                      'flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold shrink-0 transition-colors',
                      isDone
                        ? 'bg-primary text-primary-foreground'
                        : isOpen
                          ? 'bg-primary/20 text-primary border border-primary'
                          : 'bg-muted text-muted-foreground border'
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      {step.icon}
                      {step.label}
                    </div>
                    {step.value && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.value}</p>
                    )}
                  </div>
                </div>

                <ChevronRight
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    isOpen && 'rotate-90'
                  )}
                />
              </button>

              {/* Liste des items */}
              {isOpen && accessible && (
                <div className="bg-background border-t">
                  {items.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground italic">
                      No items available
                    </p>
                  ) : (
                    <ul className="max-h-48 overflow-y-auto divide-y">
                      {items.map((item) => {
                        const isSelected = selectedId === item.id.toString()
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => handleSelect(step.key, item.id.toString())}
                              className={cn(
                                'w-full flex items-center justify-between px-5 py-2.5 text-sm text-left transition-colors',
                                isSelected
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'hover:bg-muted/50 text-foreground'
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
    </div>
  )
}