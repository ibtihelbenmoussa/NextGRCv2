import { BpmnEditorWithProperties, BpmnViewerWithProperties } from '@/components/bpmn-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { RefreshCcw } from 'lucide-react';
import React, { useState } from 'react';

const simpleBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1" name="Start Process">
      <bpmn2:outgoing>Flow_1</bpmn2:outgoing>
    </bpmn2:startEvent>
    <bpmn2:task id="Task_1" name="Review Application">
      <bpmn2:incoming>Flow_1</bpmn2:incoming>
      <bpmn2:outgoing>Flow_2</bpmn2:outgoing>
    </bpmn2:task>
    <bpmn2:exclusiveGateway id="Gateway_1" name="Application Valid?">
      <bpmn2:incoming>Flow_2</bpmn2:incoming>
      <bpmn2:outgoing>Flow_3</bpmn2:outgoing>
      <bpmn2:outgoing>Flow_4</bpmn2:outgoing>
    </bpmn2:exclusiveGateway>
    <bpmn2:task id="Task_2" name="Approve Application">
      <bpmn2:incoming>Flow_3</bpmn2:incoming>
      <bpmn2:outgoing>Flow_5</bpmn2:outgoing>
    </bpmn2:task>
    <bpmn2:task id="Task_3" name="Reject Application">
      <bpmn2:incoming>Flow_4</bpmn2:incoming>
      <bpmn2:outgoing>Flow_6</bpmn2:outgoing>
    </bpmn2:task>
    <bpmn2:endEvent id="EndEvent_1" name="Process Complete">
      <bpmn2:incoming>Flow_5</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:endEvent id="EndEvent_2" name="Application Rejected">
      <bpmn2:incoming>Flow_6</bpmn2:incoming>
    </bpmn2:endEvent>
    <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn2:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn2:sequenceFlow id="Flow_3" name="Yes" sourceRef="Gateway_1" targetRef="Task_2" />
    <bpmn2:sequenceFlow id="Flow_4" name="No" sourceRef="Gateway_1" targetRef="Task_3" />
    <bpmn2:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="EndEvent_1" />
    <bpmn2:sequenceFlow id="Flow_6" sourceRef="Task_3" targetRef="EndEvent_2" />
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="135" y="145" width="70" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_1" bpmnElement="Task_1">
        <dc:Bounds x="240" y="80" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1" isMarkerVisible="true">
        <dc:Bounds x="395" y="95" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="378" y="65" width="84" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_2" bpmnElement="Task_2">
        <dc:Bounds x="500" y="80" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_3" bpmnElement="Task_3">
        <dc:Bounds x="500" y="200" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_1" bpmnElement="EndEvent_1">
        <dc:Bounds x="652" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="627" y="145" width="86" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Event_2" bpmnElement="EndEvent_2">
        <dc:Bounds x="652" y="222" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="632" y="265" width="76" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="395" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="445" y="120" />
        <di:waypoint x="500" y="120" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="464" y="102" width="18" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="420" y="145" />
        <di:waypoint x="420" y="240" />
        <di:waypoint x="500" y="240" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="428" y="190" width="15" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <di:waypoint x="600" y="120" />
        <di:waypoint x="652" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6">
        <di:waypoint x="600" y="240" />
        <di:waypoint x="652" y="240" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

export default function BPMNTest() {
    const [editorXml, setEditorXml] = useState(simpleBpmnXml);
    const [lastChanged, setLastChanged] = useState<Date>(new Date());
    const [changeCount, setChangeCount] = useState(0);

    const handleEditorChange = (newXml: string) => {
        console.log('BPMN Editor XML changed:', {
            length: newXml.length,
            timestamp: new Date().toISOString(),
        });
        setEditorXml(newXml);
        setLastChanged(new Date());
        setChangeCount((prev) => prev + 1);
    };

    const resetDiagram = () => {
        setEditorXml(simpleBpmnXml);
        setLastChanged(new Date());
        setChangeCount(0);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'BPMN Diagrams', href: '/bpmn' },
                { title: 'Properties Panel Test', href: '/bpmn/test' },
            ]}
        >
            <Head title="BPMN Properties Panel Test" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            BPMN Properties Panel Test
                        </h1>
                        <p className="text-muted-foreground">
                            Test and demonstrate the BPMN properties panel
                            functionality
                        </p>
                    </div>
                    <Button onClick={resetDiagram} variant="outline">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reset Diagram
                    </Button>
                </div>

                {/* Status Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                XML Length
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {editorXml.length.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                characters
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Changes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{changeCount}</div>
                            <p className="text-xs text-muted-foreground">
                                modifications
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Last Updated
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {lastChanged.toLocaleTimeString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {lastChanged.toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                Ready
                            </div>
                            <p className="text-xs text-muted-foreground">
                                properties panel
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>How to Test the Properties Panel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="font-semibold mb-2">
                                    🔄 Editor Tab (Interactive):
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    <li>Click on any element (start event, tasks, gateway, end events)</li>
                                    <li>Use the properties panel on the right to modify element properties</li>
                                    <li>Change names, add documentation, modify IDs</li>
                                    <li>Add new elements from the palette</li>
                                    <li>Connect elements with sequence flows</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">
                                    👁️ Viewer Tab (Read-only):
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    <li>Click on elements to view their properties (read-only)</li>
                                    <li>Properties panel shows element details</li>
                                    <li>No editing capabilities</li>
                                    <li>Good for inspection and review</li>
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <p className="text-sm">
                                <strong>💡 Tip:</strong> The properties panel appears on the right side of the diagram.
                                If you don't see it, make sure to click on an element first, then look for the properties
                                section on the right side of the screen.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* BPMN Tabs */}
                <Tabs defaultValue="editor" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="editor">
                            🔄 Editor (with Properties Panel)
                        </TabsTrigger>
                        <TabsTrigger value="viewer">
                            👁️ Viewer (with Properties Panel)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="editor" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Interactive BPMN Editor</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Edit the diagram and use the properties panel to modify elements
                                </p>
                            </CardHeader>
                            <CardContent className="p-0">
                                <BpmnEditorWithProperties
                                    xml={editorXml}
                                    onChange={handleEditorChange}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="viewer" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>BPMN Viewer with Properties Panel</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    View-only mode with properties panel for inspection
                                </p>
                            </CardHeader>
                            <CardContent className="p-0">
                                <BpmnViewerWithProperties xml={editorXml} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Debug Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Debug Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div className="grid gap-2 md:grid-cols-2">
                                <div>
                                    <strong>Current XML Length:</strong> {editorXml.length} characters
                                </div>
                                <div>
                                    <strong>Total Changes:</strong> {changeCount}
                                </div>
                                <div>
                                    <strong>Last Modified:</strong> {lastChanged.toLocaleString()}
                                </div>
                                <div>
                                    <strong>Browser:</strong> {navigator.userAgent.split(' ')[0]}
                                </div>
                            </div>
                        </div>
                        <details className="mt-4">
                            <summary className="cursor-pointer font-medium hover:text-primary">
                                View Current XML (click to expand)
                            </summary>
                            <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
                                {editorXml}
                            </pre>
                        </details>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
