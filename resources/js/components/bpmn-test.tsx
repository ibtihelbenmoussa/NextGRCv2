import React from 'react';
import { BpmnEditorWithProperties } from './bpmn-viewer';

const simpleBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1">
      <bpmn2:outgoing>Flow_1</bpmn2:outgoing>
    </bpmn2:startEvent>
    <bpmn2:task id="Task_1" name="Sample Task">
      <bpmn2:incoming>Flow_1</bpmn2:incoming>
      <bpmn2:outgoing>Flow_2</bpmn2:outgoing>
    </bpmn2:task>
    <bpmn2:endEvent id="EndEvent_1">
      <bpmn2:incoming>Flow_2</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn2:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_1" bpmnElement="Task_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_1" bpmnElement="EndEvent_1">
        <dc:Bounds x="392" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="392" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

export const BpmnPropertiesPanelTest: React.FC = () => {
    const [xml, setXml] = React.useState(simpleBpmnXml);

    const handleChange = (newXml: string) => {
        console.log('BPMN XML changed:', newXml.length, 'characters');
        setXml(newXml);
    };

    return (
        <div className="p-4 space-y-4">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">BPMN Properties Panel Test</h2>
                <p className="text-muted-foreground">
                    This component tests the BPMN editor with properties panel.
                    Click on any element in the diagram to see its properties in the right panel.
                </p>
                <div className="flex gap-4 text-sm">
                    <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                        XML Length: {xml.length} chars
                    </div>
                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900 rounded">
                        Status: Ready
                    </div>
                </div>
            </div>

            <div className="border rounded-lg">
                <BpmnEditorWithProperties
                    xml={xml}
                    onChange={handleChange}
                />
            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Instructions:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Click on the <strong>Start Event</strong> (circle) to see its properties</li>
                    <li>Click on the <strong>Task</strong> (rectangle) to edit its name and other properties</li>
                    <li>Click on the <strong>End Event</strong> (bold circle) to see its properties</li>
                    <li>Click on the <strong>Sequence Flows</strong> (arrows) to see connection properties</li>
                    <li>Use the properties panel on the right to modify element properties</li>
                </ul>
            </div>

            {/* Debug Info */}
            <details className="text-xs">
                <summary className="cursor-pointer font-medium">Debug Info</summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-48">
                    {JSON.stringify({ xmlLength: xml.length, timestamp: new Date().toISOString() }, null, 2)}
                </pre>
            </details>
        </div>
    );
};

export default BpmnPropertiesPanelTest;
