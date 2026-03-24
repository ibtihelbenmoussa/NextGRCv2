import '@bpmn-io/properties-panel/dist/assets/properties-panel.css';
import {
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import React, { useEffect, useRef, useState } from 'react';

interface BpmnProps {
    xml: string;
    onChange?: (xml: string) => void;
    readOnly?: boolean;
    className?: string;
    style?: React.CSSProperties;
    showPropertiesPanel?: boolean;
}

const BpmnComponent: React.FC<BpmnProps> = ({
    xml,
    onChange,
    readOnly = false,
    className = 'bpmn-custom-viewer w-full rounded-lg',
    style = { height: 'calc(100vh - 180px)' },
    showPropertiesPanel = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const propertiesPanelRef = useRef<HTMLDivElement>(null);
    const modelerRef = useRef<BpmnModeler | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const initializeModeler = async () => {
            if (!containerRef.current) return;

            // Wait a bit for DOM to be ready
            await new Promise((resolve) => setTimeout(resolve, 100));

            try {
                console.log(
                    'Initializing BPMN modeler with properties panel:',
                    showPropertiesPanel,
                );

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const modelerConfig: any = {
                    container: containerRef.current,
                };

                if (showPropertiesPanel && propertiesPanelRef.current) {
                    console.log('Adding properties panel configuration');
                    console.log(
                        'Properties panel element:',
                        propertiesPanelRef.current,
                    );
                    console.log('Properties panel element dimensions:', {
                        width: propertiesPanelRef.current.offsetWidth,
                        height: propertiesPanelRef.current.offsetHeight,
                        visible:
                            propertiesPanelRef.current.offsetParent !== null,
                    });

                    modelerConfig.propertiesPanel = {
                        parent: propertiesPanelRef.current,
                    };
                    modelerConfig.additionalModules = [
                        BpmnPropertiesPanelModule,
                        BpmnPropertiesProviderModule,
                    ];
                }

                const modeler = new BpmnModeler(modelerConfig);
                modelerRef.current = modeler;

                console.log('BPMN modeler created, importing XML...');

                // Import XML
                await modeler.importXML(xml);

                console.log('XML imported successfully');

                // Fit to viewport
                const canvas = modeler.get('canvas') as {
                    zoom: (type: string) => void;
                };
                canvas.zoom('fit-viewport');

                // Set up change listeners for non-readonly mode
                if (!readOnly && onChange) {
                    const eventBus = modeler.get('eventBus') as {
                        on: (event: string, callback: () => void) => void;
                    };

                    const handleChange = async () => {
                        try {
                            const { xml: newXml } = await modeler.saveXML({
                                format: true,
                            });
                            if (typeof newXml === 'string') {
                                onChange(newXml);
                            }
                        } catch (err) {
                            console.error('Failed to save XML:', err);
                        }
                    };

                    eventBus.on('commandStack.changed', handleChange);
                }

                setIsReady(true);
                console.log('BPMN modeler initialized successfully');

                // Additional debug info for properties panel
                if (showPropertiesPanel) {
                    setTimeout(() => {
                        const panelContent =
                            propertiesPanelRef.current?.querySelector(
                                '.bio-properties-panel',
                            );
                        console.log(
                            'Properties panel content found:',
                            !!panelContent,
                        );
                        console.log(
                            'Properties panel children:',
                            propertiesPanelRef.current?.children,
                        );
                        if (panelContent) {
                            console.log(
                                'Panel content styles:',
                                getComputedStyle(panelContent),
                            );
                        }
                    }, 500);
                }
            } catch (error) {
                console.error('Error initializing BPMN modeler:', error);
            }
        };

        initializeModeler();

        return () => {
            if (modelerRef.current) {
                modelerRef.current.destroy();
                modelerRef.current = null;
            }
        };
    }, [xml, onChange, readOnly, showPropertiesPanel]);

    if (showPropertiesPanel) {
        return (
            <div
                className="flex w-full overflow-hidden rounded border border-gray-300 bg-white dark:border-accent dark:bg-background"
                style={{ height: '800px' }}
            >
                {/* BPMN Canvas */}
                <div ref={containerRef} className="relative h-full flex-1">
                    {!isReady && (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-muted-foreground">
                                Loading BPMN modeler...
                            </div>
                        </div>
                    )}
                </div>

                {/* Properties Panel */}
                <div
                    ref={propertiesPanelRef}
                    className="h-full w-80 overflow-auto border-l border-border bg-background"
                    style={{ minWidth: '320px' }}
                >
                    {!isReady && (
                        <div className="p-4 text-sm text-muted-foreground">
                            Loading properties panel...
                        </div>
                    )}
                    {isReady && (
                        <div className="border-b p-2 text-xs text-muted-foreground">
                            Properties Panel Ready
                            <br />
                            Select an element to view properties
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div ref={containerRef} className={className} style={style}>
                {!isReady && (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-muted-foreground">
                            Loading BPMN viewer...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Export variants
export const BpmnEditor: React.FC<BpmnProps> = (props) => (
    <BpmnComponent {...props} readOnly={false} />
);

export const BpmnViewer: React.FC<BpmnProps> = (props) => (
    <BpmnComponent {...props} readOnly={true} />
);

export const BpmnEditorWithProperties: React.FC<BpmnProps> = (props) => (
    <BpmnComponent {...props} readOnly={false} showPropertiesPanel={true} />
);

export const BpmnViewerWithProperties: React.FC<BpmnProps> = (props) => (
    <BpmnComponent {...props} readOnly={true} showPropertiesPanel={true} />
);

export default BpmnViewer;
