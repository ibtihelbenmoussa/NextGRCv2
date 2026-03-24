import '@bpmn-io/properties-panel/dist/assets/properties-panel.css';
import {
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { useEffect, useRef } from 'react';

interface BpmnModelerConfig {
    container: HTMLElement;
    propertiesPanel?: {
        parent: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalModules?: any[];
}

interface UseBpmnModelerProps {
    onChange?: (xml: string) => void;
    xml?: string;
    showPropertiesPanel?: boolean;
    propertiesPanelParent?: string;
}

export function useBpmnModeler({
    onChange,
    xml,
    showPropertiesPanel = false,
    propertiesPanelParent = '#properties-panel',
}: UseBpmnModelerProps = {}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const modelerRef = useRef<BpmnModeler | null>(null);
    const lastLoadedXml = useRef<string>('');
    const isInitialized = useRef(false);
    const onChangeRef = useRef(onChange);

    // Update the ref when onChange changes
    onChangeRef.current = onChange;

    useEffect(() => {
        if (!containerRef.current) return;

        // Small delay to ensure container is fully rendered
        const timer = setTimeout(() => {
            if (!containerRef.current) return;

            // Create BPMN modeler instance with optional properties panel
            const modelerConfig: BpmnModelerConfig = {
                container: containerRef.current,
            };

            if (showPropertiesPanel) {
                modelerConfig.propertiesPanel = {
                    parent: propertiesPanelParent,
                };
                modelerConfig.additionalModules = [
                    BpmnPropertiesPanelModule,
                    BpmnPropertiesProviderModule,
                ];
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const modeler = new BpmnModeler(modelerConfig as any);

            modelerRef.current = modeler;
            isInitialized.current = true; // Allow drawing immediately on empty canvas

            // Load minimal empty diagram to enable palette and tools
            const emptyDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="sid-38422fae-e03e-43a3-bef4-bd33b32041b2" targetNamespace="http://bpmn.io/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="18.6.1">
  <process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="BpmnDiagram_1">
    <bpmndi:BPMNPlane id="BpmnPlane_1" bpmnElement="Process_1">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

            modeler
                .importXML(emptyDiagram)
                .then(() => {
                    // Get the canvas and zoom to fit viewport
                    const canvas = modeler.get('canvas') as {
                        zoom: (type: string) => void;
                    };
                    canvas.zoom('fit-viewport');
                })
                .catch((err) => {
                    console.error('Failed to load empty diagram:', err);
                });

            // Listen for changes - but only after initialization
            const eventBus = modeler.get('eventBus') as {
                on: (event: string, callback: () => void) => void;
            };
            const saveDiagram = async () => {
                // Only save if diagram has been initialized (user has interacted with it)
                if (!isInitialized.current) return;

                try {
                    const result = await modeler.saveXML({ format: true });
                    const xmlString = result.xml;
                    if (xmlString) {
                        onChangeRef.current?.(xmlString);
                    }
                } catch (err) {
                    console.error('Failed to save diagram:', err);
                }
            };

            eventBus.on('commandStack.changed', saveDiagram);
        }, 100);

        return () => {
            clearTimeout(timer);
            if (modelerRef.current) {
                modelerRef.current.destroy();
            }
        };
    }, [showPropertiesPanel, propertiesPanelParent]); // Include properties panel dependencies

    // Load diagram when xml changes to a new value
    useEffect(() => {
        if (!modelerRef.current || !xml || xml === lastLoadedXml.current)
            return;

        const loadDiagram = async () => {
            try {
                await modelerRef.current!.importXML(xml);
                lastLoadedXml.current = xml;
                // Get the canvas and zoom to fit viewport
                const canvas = modelerRef.current!.get('canvas') as {
                    zoom: (type: string) => void;
                };
                canvas.zoom('fit-viewport');
                // Don't reset initialization when loading XML - user can still draw
            } catch (err) {
                console.error('Failed to load diagram:', err);
            }
        };

        loadDiagram();
    }, [xml]);

    const getXml = async (): Promise<string | null> => {
        if (!modelerRef.current) return null;

        try {
            const result = await modelerRef.current.saveXML({ format: true });
            return result.xml || null;
        } catch (err) {
            console.error('Failed to get XML:', err);
            return null;
        }
    };

    const loadXml = async (xml: string) => {
        if (!modelerRef.current) return;

        try {
            await modelerRef.current.importXML(xml);
            // Get the canvas and zoom to fit viewport
            const canvas = modelerRef.current.get('canvas') as {
                zoom: (type: string) => void;
            };
            canvas.zoom('fit-viewport');
        } catch (err) {
            console.error('Failed to load XML:', err);
        }
    };

    return {
        containerRef,
        getXml,
        loadXml,
        modeler: modelerRef.current,
    };
}
