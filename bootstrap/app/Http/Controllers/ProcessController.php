<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HasDataTable;
use App\Http\Filters\DateFromFilter;
use App\Http\Filters\DateToFilter;
use App\Http\Filters\ManagerFilter;
use App\Http\Filters\StatusFilter;
use App\Models\BusinessUnit;
use App\Models\MacroProcess;
use App\Models\Process;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\QueryBuilder\AllowedFilter;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProcessesExport;

class ProcessController extends Controller
{
    use HasDataTable;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        // Get stats from all processes (not filtered)
        $allProcesses = Process::whereHas('macroProcess.businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })->withCount('risks')->get();

        $stats = [
            'total' => $allProcesses->count(),
            'active' => $allProcesses->where('is_active', true)->count(),
            'risks' => $allProcesses->sum('risks_count'),
        ];

        // Build base query
        $baseQuery = Process::whereHas('macroProcess.businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->with(['macroProcess.businessUnit', 'managers'])
            ->withCount('risks');

        // Get all managers from current organization for filter dropdown
        $managers = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get all macro processes from current organization for filter dropdown
        $macroProcesses = MacroProcess::whereHas('businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get all business units from current organization for filter dropdown
        $businessUnits = BusinessUnit::where('organization_id', $currentOrgId)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Build DataTable query with Spatie Query Builder
        $processes = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'code', 'description', 'objectives', 'managers.name', 'macroProcess.name', 'macroProcess.businessUnit.name'],
            'filters' => [
                AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
                AllowedFilter::custom('manager', new ManagerFilter('managers')),
                AllowedFilter::exact('macro_process', 'macro_process_id'),
                AllowedFilter::callback('business_unit', function ($query, $value) {
                    $query->whereHas('macroProcess', function ($q) use ($value) {
                        $q->where('business_unit_id', $value);
                    });
                }),
                AllowedFilter::custom('date_from', new DateFromFilter(), 'updated_at'),
                AllowedFilter::custom('date_to', new DateToFilter(), 'updated_at'),
            ],
            'sorts' => [
                'name',
                'code',
                'updated_at',
                'risks_count',
            ],
            'defaultSort' => 'name',
            'perPage' => 10,
        ]);

        return Inertia::render('processes/index', [
            'processes' => $processes,
            'stats' => $stats,
            'managers' => $managers,
            'macroProcesses' => $macroProcesses,
            'businessUnits' => $businessUnits,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
     public function create(Request $request)
         {
             $user = $request->user();
             $currentOrgId = $user->current_organization_id;

             if (!$currentOrgId) {
                 return redirect()->route('organizations.select.page')
                     ->with('error', 'Please select an organization first.');
             }

             // Get macro processes for current organization
             $macroProcesses = MacroProcess::whereHas('businessUnit', function ($query) use ($currentOrgId) {
                 $query->where('organization_id', $currentOrgId);
             })
                 ->with('businessUnit')
                 ->where('is_active', true)
                 ->get();

             // Get potential managers from current organization
             $managers = User::whereHas('organizations', function ($query) use ($currentOrgId) {
                 $query->where('organization_id', $currentOrgId);
             })->get(['id', 'name']);

             // Get pre-selected macro process if provided
             $selectedMacroProcessId = $request->input('macro_process_id');

             return Inertia::render('processes/create', [
                 'macroProcesses' => $macroProcesses,
                 'managers' => $managers,
                 'selectedMacroProcessId' => $selectedMacroProcessId,
             ]);
         }

    /**
     * Store a newly created resource in storage.
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
            'macro_process_id' => 'required|exists:macro_processes,id',
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                \Illuminate\Validation\Rule::unique('processes')
                    ->where('macro_process_id', $request->input('macro_process_id'))
                    ->whereNull('deleted_at'),
            ],
            'description' => 'nullable|string',
            'objectives' => 'nullable|string',
            'manager_ids' => 'nullable|array',
            'manager_ids.*' => 'exists:users,id',
            'is_active' => 'boolean',
            'documents' => 'nullable|array',
            'documents.*' => 'file|max:10240', // 10MB max per file
            'document_categories' => 'nullable|array',
            'document_categories.*' => 'nullable|string|max:255',
            'document_descriptions' => 'nullable|array',
            'document_descriptions.*' => 'nullable|string|max:1000',
        ]);

        // Verify macro process belongs to current organization
        $macroProcess = MacroProcess::with('businessUnit')->findOrFail($validated['macro_process_id']);
        if ($macroProcess->businessUnit->organization_id !== $currentOrgId) {
            abort(403, 'Invalid macro process.');
        }

        $managerIds = $validated['manager_ids'] ?? [];
        $documents = $request->file('documents', []);
        $documentCategories = $validated['document_categories'] ?? [];
        $documentDescriptions = $validated['document_descriptions'] ?? [];

        unset($validated['manager_ids'], $validated['documents'], $validated['document_categories'], $validated['document_descriptions']);

        $process = Process::create($validated);

        // Attach managers
        if (!empty($managerIds)) {
            $process->managers()->attach($managerIds);
        }

        // Upload documents
        if (!empty($documents)) {
            foreach ($documents as $index => $document) {
                $process->addDocument(
                    $document,
                    [
                        'category' => $documentCategories[$index] ?? null,
                        'description' => $documentDescriptions[$index] ?? null,
                    ]
                );
            }
        }

        return redirect()->route('processes.show', $process)
            ->with('success', 'Process created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Process $process)
    {
        $user = $request->user();

        // Verify process belongs to current organization
        if ($process->macroProcess->businessUnit->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this process.');
        }

        $process->load([
            'macroProcess.businessUnit.organization',
            'managers',
            'risks.owner',
            'documents',
            'bpmnDiagrams',
        ])->loadCount('risks');

        return Inertia::render('processes/show', [
            'process' => $process,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, Process $process)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        // Verify process belongs to current organization
        if ($process->macroProcess->businessUnit->organization_id !== $currentOrgId) {
            abort(403, 'You do not have access to this process.');
        }

        // Get macro processes for current organization
        $macroProcesses = MacroProcess::whereHas('businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->with('businessUnit')
            ->where('is_active', true)
            ->get();

        // Ensure the current macro process is included even if inactive
        if (!$macroProcesses->contains('id', $process->macro_process_id)) {
            $macroProcesses->push($process->macroProcess);
            $macroProcesses = $macroProcesses->sortBy('name')->values();
        }

        // Get potential managers from current organization
        $managers = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })->get(['id', 'name']);

        return Inertia::render('processes/edit', [
            'process' => $process->load(['macroProcess.businessUnit', 'managers', 'documents']),
            'macroProcesses' => $macroProcesses,
            'managers' => $managers,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Process $process)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        // Verify process belongs to current organization
        if ($process->macroProcess->businessUnit->organization_id !== $currentOrgId) {
            abort(403, 'You do not have access to this process.');
        }

        $validated = $request->validate([
            'macro_process_id' => 'required|exists:macro_processes,id',
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                \Illuminate\Validation\Rule::unique('processes')
                    ->ignore($process->id)
                    ->where('macro_process_id', $request->input('macro_process_id'))
                    ->whereNull('deleted_at'),
            ],
            'description' => 'nullable|string',
            'objectives' => 'nullable|string',
            'manager_ids' => 'nullable|array',
            'manager_ids.*' => 'exists:users,id',
            'is_active' => 'boolean',
            'documents' => 'nullable|array',
            'documents.*' => 'file|max:10240', // 10MB max per file
            'document_categories' => 'nullable|array',
            'document_categories.*' => 'nullable|string|max:255',
            'document_descriptions' => 'nullable|array',
            'document_descriptions.*' => 'nullable|string|max:1000',
        ]);

        // Verify macro process belongs to current organization
        $macroProcess = MacroProcess::with('businessUnit')->findOrFail($validated['macro_process_id']);
        if ($macroProcess->businessUnit->organization_id !== $currentOrgId) {
            abort(403, 'Invalid macro process.');
        }

        $managerIds = $validated['manager_ids'] ?? [];
        $documents = $request->file('documents', []);
        $documentCategories = $validated['document_categories'] ?? [];
        $documentDescriptions = $validated['document_descriptions'] ?? [];

        unset($validated['manager_ids'], $validated['documents'], $validated['document_categories'], $validated['document_descriptions']);

        $process->update($validated);

        // Sync managers
        $process->managers()->sync($managerIds);

        // Upload new documents
        if (!empty($documents)) {
            foreach ($documents as $index => $document) {
                $process->addDocument(
                    $document,
                    [
                        'category' => $documentCategories[$index] ?? null,
                        'description' => $documentDescriptions[$index] ?? null,
                    ]
                );
            }
        }

        return redirect()->route('processes.show', $process)
            ->with('success', 'Process updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Process $process)
    {
        $user = $request->user();

        // Verify process belongs to current organization
        if ($process->macroProcess->businessUnit->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this process.');
        }

        $process->delete();

        return redirect()->route('processes.index')
            ->with('success', 'Process deleted successfully.');
    }

    /**
     * Export processes to Excel.
     */
    public function export(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return response()->json(['message' => 'No organization selected'], 400);
        }

        // Build base query for export (same as index)
        $baseQuery = Process::whereHas('macroProcess.businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->with(['macroProcess.businessUnit', 'managers'])
            ->withCount('risks');

        // Apply filters using QueryBuilder but get all records
        $query = \Spatie\QueryBuilder\QueryBuilder::for($baseQuery);

        // Apply filters
        $query->allowedFilters([
            AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
            AllowedFilter::custom('manager', new ManagerFilter('managers')),
            AllowedFilter::custom('date_from', new DateFromFilter(), 'updated_at'),
            AllowedFilter::custom('date_to', new DateToFilter(), 'updated_at'),
            AllowedFilter::exact('macro_process_id'),
        ]);

        // Apply sorts
        $query->allowedSorts([
            'name',
            'code',
            'updated_at',
            'risks_count',
        ])->defaultSort('name');

        // Handle global search
        if ($request->has('search')) {
            $searchTerm = $request->input('search');
            $searchColumns = ['name', 'code', 'description', 'objectives', 'managers.name', 'macroProcess.name', 'macroProcess.businessUnit.name'];

            $query->where(function ($q) use ($searchColumns, $searchTerm) {
                foreach ($searchColumns as $column) {
                    if (str_contains($column, '.')) {
                        [$relation, $field] = explode('.', $column);
                        $q->orWhereHas($relation, function ($subQuery) use ($field, $searchTerm) {
                            $subQuery->where($field, 'like', "%{$searchTerm}%");
                        });
                    } else {
                        $q->orWhere($column, 'like', "%{$searchTerm}%");
                    }
                }
            });
        }

        // Get all records without pagination
        $processes = $query->get();

        try {
            $filename = 'processes-' . now()->format('Y-m-d-H-i-s') . '.xlsx';
            return Excel::download(new ProcessesExport($processes), $filename);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
