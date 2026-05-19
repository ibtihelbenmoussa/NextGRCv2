<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HasDataTable;
use App\Http\Filters\DateFromFilter;
use App\Http\Filters\DateToFilter;
use App\Http\Filters\UploaderFilter;
use App\Models\BPMNDiagram;
use App\Models\Process;
use App\Models\MacroProcess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Inertia\Inertia;
use Spatie\QueryBuilder\AllowedFilter;

class BPMNDiagramController extends Controller
{
    use HasDataTable;

    /**
     * Get current filters from request
     *
     * @return array
     */
    protected function getCurrentFilters(): array
    {
        $request = request();
        return [
            'search' => $request->input('search'),
            'uploader' => $request->input('filter.uploader'),
            'date_from' => $request->input('filter.date_from'),
            'date_to' => $request->input('filter.date_to'),
            'sort_column' => ltrim($request->input('sort', ''), '-'),
            'sort_direction' => str_starts_with($request->input('sort', ''), '-') ? 'desc' : 'asc',
            'per_page' => (int) $request->input('per_page', 10),
        ];
    }

    /**
     * Display a listing of BPMN diagrams for a diagramable model.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        $type = $request->input('type'); // e.g., 'process', 'macro_process'
        $id = $request->input('id');

        // Get IDs of processes and macro processes that belong to the current organization
        $processIds = Process::whereHas('macroProcess', function ($mq) use ($currentOrgId) {
            $mq->whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                $bq->where('organization_id', $currentOrgId);
            });
        })->pluck('id');

        $macroProcessIds = MacroProcess::whereHas('businessUnit', function ($bq) use ($currentOrgId) {
            $bq->where('organization_id', $currentOrgId);
        })->pluck('id');

        // Build base query with organization filtering
        $baseQuery = BPMNDiagram::where(function ($query) use ($processIds, $macroProcessIds) {
            $query->where(function ($q) use ($processIds) {
                $q->where('diagramable_type', 'process')
                    ->whereIn('diagramable_id', $processIds);
            })->orWhere(function ($q) use ($macroProcessIds) {
                $q->where('diagramable_type', 'macro_process')
                    ->whereIn('diagramable_id', $macroProcessIds);
            });
        })->with(['diagramable', 'uploader']);

        if ($type && $id) {
            $baseQuery->where('diagramable_type', $type)
                ->where('diagramable_id', $id);
        }

        // Build DataTable query with Spatie Query Builder
        $diagrams = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'description', 'uploader.name'],
            'filters' => [
                AllowedFilter::custom('uploader', new UploaderFilter(), 'uploaded_by'),
                AllowedFilter::custom('date_from', new DateFromFilter(), 'created_at'),
                AllowedFilter::custom('date_to', new DateToFilter(), 'created_at'),
            ],
            'sorts' => [
                'name',
                'created_at',
                'updated_at',
            ],
            'defaultSort' => '-created_at',
            'perPage' =>  $request->input('per_page', 10),
        ]);

        // Map diagramable data for frontend
        $diagrams->getCollection()->transform(function ($diagram) {
            $diagram->diagramable_name = $diagram->diagramable->name ?? null;
            $diagram->diagramable_type = $diagram->diagramable_type === 'process' ? 'Process' : 'Macro Process';
            return $diagram;
        });

        return Inertia::render('bpmn/index', [
            'diagrams' => $diagrams,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    /**
     * Display the BPMN diagrams index page.
     */
    public function page(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        $type = $request->input('type'); // e.g., 'process', 'macro_process'
        $id = $request->input('id');

        // Get IDs of processes and macro processes that belong to the current organization
        $processIds = Process::whereHas('macroProcess', function ($mq) use ($currentOrgId) {
            $mq->whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                $bq->where('organization_id', $currentOrgId);
            });
        })->pluck('id');

        $macroProcessIds = MacroProcess::whereHas('businessUnit', function ($bq) use ($currentOrgId) {
            $bq->where('organization_id', $currentOrgId);
        })->pluck('id');

        // Build base query with organization filtering
        $baseQuery = BPMNDiagram::where(function ($query) use ($processIds, $macroProcessIds) {
            $query->where(function ($q) use ($processIds) {
                $q->where('diagramable_type', 'process')
                    ->whereIn('diagramable_id', $processIds);
            })->orWhere(function ($q) use ($macroProcessIds) {
                $q->where('diagramable_type', 'macro_process')
                    ->whereIn('diagramable_id', $macroProcessIds);
            });
        })->with(['diagramable', 'uploader']);

        if ($type && $id) {
            $baseQuery->where('diagramable_type', $type)
                ->where('diagramable_id', $id);
        }

        // Get stats from all diagrams (not filtered)
        $allDiagrams = $baseQuery->get();
        $stats = [
            'total' => $allDiagrams->count(),
            'process_diagrams' => $allDiagrams->where('diagramable_type', 'process')->count(),
            'macro_process_diagrams' => $allDiagrams->where('diagramable_type', 'macro_process')->count(),
        ];

        // Build DataTable query with Spatie Query Builder
        $diagrams = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'description', 'uploader.name'],
            'filters' => [
                AllowedFilter::custom('uploader', new UploaderFilter(), 'uploaded_by'),
                AllowedFilter::custom('date_from', new DateFromFilter(), 'created_at'),
                AllowedFilter::custom('date_to', new DateToFilter(), 'created_at'),
            ],
            'sorts' => [
                'name',
                'created_at',
                'updated_at',
            ],
            'defaultSort' => '-created_at',
            'perPage' =>  $request->input('per_page', 10),
        ]);

        // Map diagramable data for frontend
        $diagrams->getCollection()->transform(function ($diagram) {
            $diagram->diagramable_name = $diagram->diagramable->name ?? null;
            $diagram->diagramable_type = $diagram->diagramable_type === 'process' ? 'Process' : 'Macro Process';
            return $diagram;
        });

        // Fetch users in the current organization for filter dropdown
        $users = \App\Models\User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organizations.id', $currentOrgId);
        })->select('id', 'name')->get();

        return Inertia::render('bpmn/index', [
            'diagrams' => $diagrams,
            'stats' => $stats,
            'users' => $users,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    /**
     * Show the form for creating a new BPMN diagram.
     */
    public function create(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        $processes = Process::whereHas('macroProcess', function ($query) use ($currentOrgId) {
            $query->whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                $bq->where('organization_id', $currentOrgId);
            });
        })->select('id', 'name', 'code')->get();

        $macroProcesses = MacroProcess::whereHas('businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })->select('id', 'name', 'code')->get();

        return Inertia::render('bpmn/create', [
            'processes' => $processes,
            'macroProcesses' => $macroProcesses,
        ]);
    }

    /**
     * Show the form for editing a BPMN diagram.
     */
    public function edit(Request $request, BPMNDiagram $bpmnDiagram)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        // Get IDs of processes and macro processes that belong to the current organization
        $processIds = Process::whereHas('macroProcess', function ($mq) use ($currentOrgId) {
            $mq->whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                $bq->where('organization_id', $currentOrgId);
            });
        })->pluck('id');

        $macroProcessIds = MacroProcess::whereHas('businessUnit', function ($bq) use ($currentOrgId) {
            $bq->where('organization_id', $currentOrgId);
        })->pluck('id');

        // Verify the diagram belongs to current organization
        $diagram = $bpmnDiagram;
        $diagramable = $diagram->diagramable;

        if ($diagram->diagramable_type === 'process') {
            $belongsToOrg = Process::whereHas('macroProcess', function ($mq) use ($currentOrgId) {
                $mq->whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                    $bq->where('organization_id', $currentOrgId);
                });
            })->where('id', $diagram->diagramable_id)->exists();
        } elseif ($diagram->diagramable_type === 'macro_process') {
            $belongsToOrg = MacroProcess::whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                $bq->where('organization_id', $currentOrgId);
            })->where('id', $diagram->diagramable_id)->exists();
        } else {
            $belongsToOrg = false;
        }

        if (!$belongsToOrg) {
            abort(404);
        }
        $processes = Process::whereHas('macroProcess', function ($query) use ($currentOrgId) {
            $query->whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                $bq->where('organization_id', $currentOrgId);
            });
        })->select('id', 'name', 'code')->get();

        $macroProcesses = MacroProcess::whereHas('businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })->select('id', 'name', 'code')->get();

        return Inertia::render('bpmn/edit', [
            'diagram' => $diagram,
            'processes' => $processes,
            'macroProcesses' => $macroProcesses,
        ]);
    }

    /**
     * Store a newly created BPMN diagram.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'bpmn_xml' => 'required|string',
            'diagramable_type' => 'required|string',
            'diagramable_id' => 'required|integer',
            'description' => 'nullable|string',
        ]);

        // Verify the diagramable entity belongs to current organization
        if ($validated['diagramable_type'] === 'process') {
            $process = Process::whereHas('macroProcess', function ($query) use ($currentOrgId) {
                $query->whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                    $bq->where('organization_id', $currentOrgId);
                });
            })->findOrFail($validated['diagramable_id']);
        } elseif ($validated['diagramable_type'] === 'macro_process') {
            $macroProcess = MacroProcess::whereHas('businessUnit', function ($query) use ($currentOrgId) {
                $query->where('organization_id', $currentOrgId);
            })->findOrFail($validated['diagramable_id']);
        } else {
            abort(422, 'Invalid diagramable type.');
        }

        $diagram = BPMNDiagram::create([
            'name' => $validated['name'],
            'bpmn_xml' => $validated['bpmn_xml'],
            'diagramable_type' => $validated['diagramable_type'],
            'diagramable_id' => $validated['diagramable_id'],
            'description' => $validated['description'],
            'uploaded_by' => Auth::id(),
        ]);

        return redirect()->route('bpmn-diagrams.index')->with('success', 'BPMN diagram created successfully.');
    }

    /**
     * Display the specified BPMN diagram.
     */
    public function show(Request $request, BPMNDiagram $bpmnDiagram)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        // Verify the diagram belongs to current organization
        $diagram = $bpmnDiagram;

        if ($diagram->diagramable_type === 'process') {
            $belongsToOrg = Process::whereHas('macroProcess', function ($mq) use ($currentOrgId) {
                $mq->whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                    $bq->where('organization_id', $currentOrgId);
                });
            })->where('id', $diagram->diagramable_id)->exists();
        } elseif ($diagram->diagramable_type === 'macro_process') {
            $belongsToOrg = MacroProcess::whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                $bq->where('organization_id', $currentOrgId);
            })->where('id', $diagram->diagramable_id)->exists();
        } else {
            $belongsToOrg = false;
        }

        if (!$belongsToOrg) {
            abort(404);
        }

        return Inertia::render('bpmn/show', [
            'diagram' => $diagram,
        ]);
    }

    /**
     * Update the specified BPMN diagram.
     */
    public function update(Request $request, BPMNDiagram $bpmnDiagram)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        try {
            // Verify the diagram belongs to current organization
            $diagram = $bpmnDiagram;

            if ($diagram->diagramable_type === 'process') {
                $belongsToOrg = Process::whereHas('macroProcess', function ($mq) use ($currentOrgId) {
                    $mq->whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                        $bq->where('organization_id', $currentOrgId);
                    });
                })->where('id', $diagram->diagramable_id)->exists();
            } elseif ($diagram->diagramable_type === 'macro_process') {
                $belongsToOrg = MacroProcess::whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                    $bq->where('organization_id', $currentOrgId);
                })->where('id', $diagram->diagramable_id)->exists();
            } else {
                $belongsToOrg = false;
            }

            if (!$belongsToOrg) {
                abort(404);
            }

            // Fix multipart form data parsing for PUT requests
            $inputData = $this->parseMultipartFormData($request);

            // Validate the data
            $validated = [];

            if (empty($inputData['name'])) {
                return redirect()->back()
                    ->withErrors(['name' => 'The name field is required.'])
                    ->withInput();
            }
            $validated['name'] = $inputData['name'];

            if (empty($inputData['bpmn_xml'])) {
                return redirect()->back()
                    ->withErrors(['bpmn_xml' => 'The bpmn_xml field is required.'])
                    ->withInput();
            }
            $validated['bpmn_xml'] = $inputData['bpmn_xml'];

            $validated['description'] = $inputData['description'] ?? null;

            $updated = $diagram->update($validated);

            // Debug: Log update result and fresh data
            \Log::info('Update result:', ['success' => $updated]);
            \Log::info('Updated diagram data:', $diagram->fresh()->toArray());

            if (!$updated) {
                return redirect()->back()
                    ->with('error', 'Failed to update BPMN diagram.')
                    ->withInput();
            }

            return redirect()->route('bpmn-diagrams.show', $diagram->id)
                ->with('success', 'BPMN diagram updated successfully.');
        } catch (ModelNotFoundException $e) {
            return redirect()->route('bpmn-diagrams.index')
                ->with('error', 'BPMN diagram not found.');
        }
    }

    /**
     * Remove the specified BPMN diagram.
     */
    public function destroy(Request $request, BPMNDiagram $bpmnDiagram)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        try {
            // Verify the diagram belongs to current organization
            $diagram = $bpmnDiagram;

            if ($diagram->diagramable_type === 'process') {
                $belongsToOrg = Process::whereHas('macroProcess', function ($mq) use ($currentOrgId) {
                    $mq->whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                        $bq->where('organization_id', $currentOrgId);
                    });
                })->where('id', $diagram->diagramable_id)->exists();
            } elseif ($diagram->diagramable_type === 'macro_process') {
                $belongsToOrg = MacroProcess::whereHas('businessUnit', function ($bq) use ($currentOrgId) {
                    $bq->where('organization_id', $currentOrgId);
                })->where('id', $diagram->diagramable_id)->exists();
            } else {
                $belongsToOrg = false;
            }

            if (!$belongsToOrg) {
                abort(404);
            }

            $diagram->delete();

            return redirect()->route('bpmn-diagrams.index')
                ->with('success', 'BPMN diagram deleted successfully.');
        } catch (ModelNotFoundException $e) {
            return redirect()->route('bpmn-diagrams.index')
                ->with('error', 'BPMN diagram not found.');
        }
    }

    /**
     * Parse multipart form data for PUT/PATCH requests
     * Laravel doesn't automatically parse multipart data for non-POST requests
     */
    private function parseMultipartFormData($request)
    {
        $data = [];

        // First try to get data from normal request methods
        $requestData = $request->all();
        if (!empty($requestData['name']) && !empty($requestData['bpmn_xml'])) {
            return $requestData;
        }

        // If normal methods don't work, parse raw input
        $rawData = $request->getContent();

        if (empty($rawData)) {
            return $data;
        }

        // Parse multipart boundary
        $contentType = $request->header('Content-Type');
        if (!$contentType || !preg_match('/boundary=(.*)$/', $contentType, $matches)) {
            return $data;
        }

        $boundary = $matches[1];
        $parts = explode('--' . $boundary, $rawData);

        foreach ($parts as $part) {
            if (trim($part) === '' || trim($part) === '--') {
                continue;
            }

            // Split headers from content
            if (strpos($part, "\r\n\r\n") !== false) {
                list($headers, $content) = explode("\r\n\r\n", $part, 2);
            } elseif (strpos($part, "\n\n") !== false) {
                list($headers, $content) = explode("\n\n", $part, 2);
            } else {
                continue;
            }

            // Extract field name
            if (preg_match('/name="([^"]*)"/', $headers, $matches)) {
                $fieldName = $matches[1];

                // Clean up content (remove trailing boundary markers and whitespace)
                $content = rtrim($content, "\r\n-");
                $content = trim($content);

                // Skip the _method field
                if ($fieldName !== '_method') {
                    $data[$fieldName] = $content;
                }
            }
        }

        return $data;
    }
}
