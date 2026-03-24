import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import { Textarea } from '@/components/ui/textarea';
import { useBpmnModeler } from '@/hooks/use-bpmn-modeler';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Process {
    id: number;
    name: string;
    code: string;
}

interface MacroProcess {
    id: number;
    name: string;
    code: string;
}

interface BPMNCreateProps {
    processes: Process[];
    macroProcesses: MacroProcess[];
}

export default function BPMNCreate({
    processes,
    macroProcesses,
}: BPMNCreateProps) {
    const [entityType, setEntityType] = useState<
        'process' | 'macro_process' | ''
    >('');
    const [selectedEntityId, setSelectedEntityId] = useState<string>('');
    const initialized = useRef(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        diagramable_type: '',
        diagramable_id: '',
        bpmn_xml: '',
    });

    const { containerRef, loadXml } = useBpmnModeler({
        onChange: (xml: string) => {
            setData('bpmn_xml', xml);
        },
        showPropertiesPanel: true,
        propertiesPanelParent: '#properties-panel',
    });

    // Handle URL query parameters for pre-selection
    useEffect(() => {
        if (initialized.current || !processes.length || !macroProcesses.length)
            return;

        const urlParams = new URLSearchParams(window.location.search);
        const processId = urlParams.get('process_id');
        const macroProcessId = urlParams.get('macro_process_id');

        console.log('URL params:', { processId, macroProcessId });
        console.log('Available processes:', processes.length);
        console.log('Available macro processes:', macroProcesses.length);

        if (processId) {
            // Pre-select process
            const process = processes.find(
                (p) => p.id.toString() === processId,
            );
            console.log('Found process:', process);
            if (process) {
                setEntityType('process');
                setData('diagramable_type', 'process');
                setSelectedEntityId(processId);
                setData('diagramable_id', processId);

                // Delay loading template to ensure modeler is ready
                setTimeout(() => {
                    const templateXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="sid-38422fae-e03e-43a3-bef4-bd33b32041b2" targetNamespace="http://bpmn.io/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="18.6.1">
  <collaboration id="Collaboration_1yyxkdf">
    <participant id="Participant_1hdy48n" name="${process.name}" processRef="Process_1" />
  </collaboration>
  <process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="BpmnDiagram_1">
    <bpmndi:BPMNPlane id="BpmnPlane_1" bpmnElement="Collaboration_1yyxkdf">
      <bpmndi:BPMNShape id="Participant_1hdy48n_di" bpmnElement="Participant_1hdy48n" isHorizontal="true">
        <omgdc:Bounds x="160" y="90" width="600" height="250" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
                    console.log(
                        'Loading BPMN template for process:',
                        process.name,
                    );
                    setData('bpmn_xml', templateXml);
                    loadXml(templateXml);
                }, 100);
                initialized.current = true;
            }
        } else if (macroProcessId) {
            // Pre-select macro process
            const macroProcess = macroProcesses.find(
                (mp) => mp.id.toString() === macroProcessId,
            );
            console.log('Found macro process:', macroProcess);
            if (macroProcess) {
                setEntityType('macro_process');
                setData('diagramable_type', 'macro_process');
                setSelectedEntityId(macroProcessId);
                setData('diagramable_id', macroProcessId);

                // Delay loading template to ensure modeler is ready
                setTimeout(() => {
                    const templateXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="sid-38422fae-e03e-43a3-bef4-bd33b32041b2" targetNamespace="http://bpmn.io/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="18.6.1">
  <collaboration id="Collaboration_1yyxkdf">
    <participant id="Participant_1hdy48n" name="${macroProcess.name}" processRef="Process_1" />
  </collaboration>
  <process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="BpmnDiagram_1">
    <bpmndi:BPMNPlane id="BpmnPlane_1" bpmnElement="Collaboration_1yyxkdf">
      <bpmndi:BPMNShape id="Participant_1hdy48n_di" bpmnElement="Participant_1hdy48n" isHorizontal="true">
        <omgdc:Bounds x="160" y="90" width="600" height="250" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
                    console.log(
                        'Loading BPMN template for macro process:',
                        macroProcess.name,
                    );
                    setData('bpmn_xml', templateXml);
                    loadXml(templateXml);
                }, 100);
                initialized.current = true;
            }
        }
    }, [processes, macroProcesses, loadXml, setData]);

    const availableEntities =
        entityType === 'process' ? processes : macroProcesses;

    const handleEntityTypeChange = (value: string) => {
        setEntityType(value as 'process' | 'macro_process');
        setData('diagramable_type', value);
        setSelectedEntityId('');
        setData('diagramable_id', '');
    };

    const handleEntityChange = (value: string) => {
        setSelectedEntityId(value);
        setData('diagramable_id', value);

        // Load the BPMN template when an entity is selected
        const selectedEntity = availableEntities.find(
            (entity) => entity.id.toString() === value,
        );
        if (selectedEntity) {
            const templateXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="sid-38422fae-e03e-43a3-bef4-bd33b32041b2" targetNamespace="http://bpmn.io/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="18.6.1">
  <collaboration id="Collaboration_1yyxkdf">
    <participant id="Participant_1hdy48n" name="${selectedEntity.name}" processRef="Process_1" />
  </collaboration>
  <process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="BpmnDiagram_1">
    <bpmndi:BPMNPlane id="BpmnPlane_1" bpmnElement="Collaboration_1yyxkdf">
      <bpmndi:BPMNShape id="Participant_1hdy48n_di" bpmnElement="Participant_1hdy48n" isHorizontal="true">
        <omgdc:Bounds x="160" y="90" width="600" height="250" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
            loadXml(templateXml);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Form data before submission:', data);

        if (!data.bpmn_xml || data.bpmn_xml.trim() === '') {
            console.error('No BPMN XML data available');
            alert('Please create or modify the BPMN diagram before submitting');
            return;
        }

        console.log(
            'Submitting BPMN diagram with XML length:',
            data.bpmn_xml.length,
        );

        post('/bpmn-diagrams', {
            forceFormData: true,
        });
    };

    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlParams =
        urlParams.get('process_id') || urlParams.get('macro_process_id');

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'BPMN Diagrams', href: '/bpmn' },
                { title: 'Create', href: '' },
            ]}
        >
            <Head title="Create BPMN Diagram" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create BPMN Diagram
                        </h1>
                        <p className="text-muted-foreground">
                            Add a new BPMN diagram to your organization
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/bpmn">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                                <div className="space-y-4 md:col-span-4">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Diagram Name{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            placeholder="Enter diagram name"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Brief description of the diagram"
                                            rows={3}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-destructive">
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Entity Type */}
                                    <div className="space-y-2">
                                        <SelectWithSearch
                                            label="Entity Type"
                                            placeholder="Select entity type"
                                            options={[
                                                {
                                                    value: 'process',
                                                    label: 'Process',
                                                },
                                                {
                                                    value: 'macro_process',
                                                    label: 'Macro Process',
                                                },
                                            ]}
                                            value={data.diagramable_type}
                                            onValueChange={
                                                handleEntityTypeChange
                                            }
                                            required
                                            disabled={selectedEntityId !== ''}
                                        />
                                        {errors.diagramable_type && (
                                            <p className="text-sm text-destructive">
                                                {errors.diagramable_type}
                                            </p>
                                        )}
                                    </div>

                                    {/* Entity Selection */}
                                    {entityType && (
                                        <div className="space-y-2">
                                            <SelectWithSearch
                                                label={
                                                    entityType === 'process'
                                                        ? 'Process'
                                                        : 'Macro Process'
                                                }
                                                placeholder={`Select ${entityType === 'process' ? 'process' : 'macro process'}`}
                                                options={availableEntities.map(
                                                    (entity) => ({
                                                        value: entity.id.toString(),
                                                        label: `${entity.code} - ${entity.name}`,
                                                    }),
                                                )}
                                                value={selectedEntityId}
                                                onValueChange={
                                                    handleEntityChange
                                                }
                                                required
                                                disabled={
                                                    !entityType ||
                                                    !!hasUrlParams
                                                }
                                            />
                                            {errors.diagramable_id && (
                                                <p className="text-sm text-destructive">
                                                    {errors.diagramable_id}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Form Actions */}
                                    <div className="mt-4 flex justify-end gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link href="/bpmn">Cancel</Link>
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Creating...'
                                                : 'Create BPMN Diagram'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-4">
                                    {/* BPMN Diagram Canvas with Properties Panel */}
                                    <div className="rounded-lg">
                                        <div className="flex h-[800px] w-full overflow-hidden rounded border border-gray-300 bg-white dark:border-gray-950 dark:bg-gray-900">
                                            {/* BPMN Canvas */}
                                            <div
                                                ref={containerRef}
                                                className="relative h-full flex-1"
                                            >
                                                {/* BPMN.js canvas will be rendered here */}
                                            </div>

                                            {/* Properties Panel */}
                                            <div
                                                id="properties-panel"
                                                className="w-80 border-l border-border bg-background"
                                            />
                                        </div>
                                    </div>
                                    {errors.bpmn_xml && (
                                        <p className="text-sm text-destructive">
                                            {errors.bpmn_xml}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
