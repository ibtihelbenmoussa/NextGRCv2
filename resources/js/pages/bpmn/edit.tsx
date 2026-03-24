import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectWithSearch } from '@/components/ui/select-with-search';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BPMNDiagram } from '@/types';
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import BpmnModeler from 'bpmn-js/lib/Modeler';
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

interface BPMNEditProps {
    diagram: BPMNDiagram & {
        diagramable?: {
            id: number;
            name: string;
            code?: string;
        };
    };
    processes: Process[];
    macroProcesses: MacroProcess[];
}

export default function BPMNEdit({
    diagram,
    processes,
    macroProcesses,
}: BPMNEditProps) {
    // Determine entity type based on diagram data (for display purposes)
    const entityType =
        diagram.diagramable_type === 'Process'
            ? 'process'
            : diagram.diagramable_type === 'Macro Process'
              ? 'macro_process'
              : '';

    const containerRef = useRef<HTMLDivElement>(null);
    const modelerRef = useRef<BpmnModeler | null>(null);
    const initialized = useRef(false);
    const [isModelerReady, setIsModelerReady] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: diagram.name,
        description: diagram.description || '',
        bpmn_xml: diagram.bpmn_xml,
        _method: 'PUT',
    });

    // Add detailed debugging logs
    console.log('Loading BPMN diagram for edit:', {
        diagramName: diagram.name,
        diagramId: diagram.id,
        xmlLength: diagram.bpmn_xml?.length || 0,
        hasXml: !!diagram.bpmn_xml,
        diagramableType: diagram.diagramable_type,
        diagramableId: diagram.diagramable_id,
    });

    // Log the actual XML content (first 500 chars)
    console.log('BPMN XML content:', diagram.bpmn_xml?.substring(0, 500));

    // Initialize BPMN modeler manually
    useEffect(() => {
        if (!containerRef.current || initialized.current) return;

        console.log('Initializing BPMN modeler manually...');

        const timer = setTimeout(() => {
            if (!containerRef.current) return;

            try {
                const modeler = new BpmnModeler({
                    container: containerRef.current,
                    propertiesPanel: {
                        parent: '#properties-panel',
                    },
                    additionalModules: [
                        BpmnPropertiesPanelModule,
                        BpmnPropertiesProviderModule,
                    ],
                });

                modelerRef.current = modeler;

                // Listen for changes
                const eventBus = modeler.get('eventBus') as {
                    on: (event: string, callback: () => void) => void;
                };

                const saveDiagram = async () => {
                    try {
                        const result = await modeler.saveXML({ format: true });
                        if (result.xml) {
                            console.log(
                                'BPMN diagram changed, new XML length:',
                                result.xml.length,
                            );
                            setData('bpmn_xml', result.xml);
                        }
                    } catch (err) {
                        console.error('Failed to save diagram:', err);
                    }
                };

                eventBus.on('commandStack.changed', saveDiagram);

                // Load the diagram XML
                if (diagram.bpmn_xml) {
                    console.log('Loading diagram XML...');
                    modeler
                        .importXML(diagram.bpmn_xml)
                        .then(() => {
                            console.log('BPMN diagram loaded successfully');

                            // Get the canvas and zoom to fit viewport
                            const canvas = modeler.get('canvas') as {
                                zoom: (type: string) => void;
                            };
                            canvas.zoom('fit-viewport');

                            initialized.current = true;
                            setIsModelerReady(true);
                        })
                        .catch((err) => {
                            console.error('Failed to load BPMN XML:', err);
                        });
                }
            } catch (error) {
                console.error('Failed to initialize BPMN modeler:', error);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (modelerRef.current) {
                modelerRef.current.destroy();
            }
        };
    }, [diagram.bpmn_xml, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Form data before submission:', data);

        if (!data.bpmn_xml || data.bpmn_xml.trim() === '') {
            console.error('No BPMN XML data available');
            alert('Please create or modify the BPMN diagram before submitting');
            return;
        }

        console.log(
            'Updating BPMN diagram with XML length:',
            data.bpmn_xml.length,
        );

        put(`/bpmn-diagrams/${diagram.id}`, {
            forceFormData: true,
        });
    };

    // Get the current entity for display
    const currentEntity =
        entityType === 'process'
            ? processes.find((p) => p.id === diagram.diagramable_id)
            : macroProcesses.find((mp) => mp.id === diagram.diagramable_id);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'BPMN Diagrams', href: '/bpmn' },
                { title: diagram.name, href: `/bpmn-diagrams/${diagram.id}` },
                { title: 'Edit', href: '' },
            ]}
        >
            <Head title={`Edit ${diagram.name}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit BPMN Diagram
                        </h1>
                        <p className="text-muted-foreground">
                            Update the BPMN diagram details and design
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
                                <div className="space-y-4 md:col-span-1">
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

                                    {/* Entity Type (Disabled/Read-only) */}
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
                                            value={entityType}
                                            onValueChange={() => {}} // No-op since it's disabled
                                            required
                                            disabled={true}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Entity type cannot be changed when
                                            editing
                                        </p>
                                    </div>

                                    {/* Entity Selection (Disabled/Read-only) */}
                                    {entityType && (
                                        <div className="space-y-2">
                                            <SelectWithSearch
                                                label={
                                                    entityType === 'process'
                                                        ? 'Process'
                                                        : 'Macro Process'
                                                }
                                                placeholder={`Select ${entityType === 'process' ? 'process' : 'macro process'}`}
                                                options={
                                                    currentEntity
                                                        ? [
                                                              {
                                                                  value: currentEntity.id.toString(),
                                                                  label: currentEntity.code
                                                                      ? `${currentEntity.code} - ${currentEntity.name}`
                                                                      : currentEntity.name,
                                                              },
                                                          ]
                                                        : []
                                                }
                                                value={diagram.diagramable_id.toString()}
                                                onValueChange={() => {}} // No-op since it's disabled
                                                required
                                                disabled={true}
                                                searchPlaceholder={`Search ${entityType === 'process' ? 'processes' : 'macro processes'}...`}
                                                emptyMessage={`No ${entityType === 'process' ? 'processes' : 'macro processes'} found.`}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Associated{' '}
                                                {entityType === 'process'
                                                    ? 'process'
                                                    : 'macro process'}{' '}
                                                cannot be changed when editing
                                            </p>
                                        </div>
                                    )}

                                    {/* Current Association Display */}
                                    {currentEntity && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Current Association
                                            </Label>
                                            <div className="rounded-md border bg-muted/50 p-3">
                                                <div className="text-sm">
                                                    <div className="font-medium text-foreground">
                                                        {
                                                            diagram.diagramable_type
                                                        }
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {currentEntity.code && (
                                                            <span>
                                                                {
                                                                    currentEntity.code
                                                                }{' '}
                                                                -{' '}
                                                            </span>
                                                        )}
                                                        {currentEntity.name}
                                                    </div>
                                                </div>
                                            </div>
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
                                                ? 'Updating...'
                                                : 'Update BPMN Diagram'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4 md:col-span-3">
                                    {/* BPMN Diagram Canvas with Properties Panel */}
                                    <div className="rounded-lg py-4">
                                        <div className="flex h-[800px] w-full overflow-hidden rounded border border-gray-300 bg-white dark:border-accent dark:bg-background">
                                            {/* BPMN Canvas */}
                                            <div
                                                ref={containerRef}
                                                className="relative h-full flex-1"
                                            >
                                                {/* BPMN.js canvas will be rendered here */}
                                                {!isModelerReady && (
                                                    <div className="flex h-full items-center justify-center">
                                                        <p className="text-muted-foreground">
                                                            Loading BPMN
                                                            modeler...
                                                        </p>
                                                    </div>
                                                )}
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
