declare module 'bpmn-js-properties-panel' {
    export const BpmnPropertiesPanelModule: any;
    export const BpmnPropertiesProviderModule: any;
    export const ZeebePropertiesProviderModule: any;

    export interface PropertiesPanel {
        attachTo(container: string | HTMLElement): void;
        detach(): void;
        registerProvider(priority: number, provider: any): void;
    }

    export interface PropertiesProvider {
        getGroups(element: any): (groups: any[]) => any[];
    }
}

declare module '@bpmn-io/properties-panel' {
    export const PropertiesPanel: any;
    export const PropertiesPanelHeaderProvider: any;
    export const PropertiesPanelPlaceholderProvider: any;
}
