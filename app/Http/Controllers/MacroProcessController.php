<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HasDataTable;
use App\Http\Filters\DateFromFilter;
use App\Http\Filters\DateToFilter;
use App\Http\Filters\ManagerFilter;
use App\Http\Filters\StatusFilter;
use App\Models\BusinessUnit;
use App\Models\MacroProcess;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\QueryBuilder\AllowedFilter;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\MacroProcessesExport;

class MacroProcessController extends Controller
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

             // Get stats from all macro processes (not filtered)
             $allMacroProcesses = MacroProcess::whereHas('businessUnit', function ($query) use ($currentOrgId) {
                 $query->where('organization_id', $currentOrgId);
             })->withCount('processes')->get();

             $stats = [
                 'total' => $allMacroProcesses->count(),
                 'active' => $allMacroProcesses->where('is_active', true)->count(),
                 'processes' => $allMacroProcesses->sum('processes_count'),
             ];

             // Build base query
             $baseQuery = MacroProcess::whereHas('businessUnit', function ($query) use ($currentOrgId) {
                 $query->where('organization_id', $currentOrgId);
             })
                 ->with(['businessUnit', 'managers'])
                 ->withCount('processes');

             // Get all managers from current organization for filter dropdown
             $managers = User::whereHas('organizations', function ($query) use ($currentOrgId) {
                 $query->where('organization_id', $currentOrgId);
             })
                 ->orderBy('name', 'asc')
                 ->get(['id', 'name']);

             // Get all business units from current organization for filter dropdown
             $businessUnits = BusinessUnit::where('organization_id', '=', $currentOrgId)
                 ->orderBy('name', 'asc')
                 ->get(['id', 'name']);

             // Build DataTable query with Spatie Query Builder
             $macroProcesses = $this->buildDataTableQuery($baseQuery, [
                 'searchColumns' => ['name', 'code', 'description', 'managers.name', 'businessUnit.name'],
                 'filters' => [
                     AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
                     AllowedFilter::custom('manager', new ManagerFilter('managers')),
                     AllowedFilter::exact('business_unit', 'business_unit_id'),
                     AllowedFilter::custom('date_from', new DateFromFilter(), 'updated_at'),
                     AllowedFilter::custom('date_to', new DateToFilter(), 'updated_at'),
                 ],
                 'sorts' => [
                     'name',
                     'code',
                     'updated_at',
                     'processes_count',
                 ],
                 'defaultSort' => 'name',
                 'perPage' => 10,
             ]);

             return Inertia::render('macro-processes/index', [
                 'macroProcesses' => $macroProcesses,
                 'stats' => $stats,
                 'managers' => $managers,
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

        // Get business units for current organization
        $businessUnits = BusinessUnit::where('organization_id', $currentOrgId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Get potential managers from current organization
        $managers = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })->get(['id', 'name']);

        // Get pre-selected business unit if provided
        $selectedBusinessUnitId = $request->input('business_unit_id');

        return Inertia::render('macro-processes/create', [
            'businessUnits' => $businessUnits,
            'managers' => $managers,
            'selectedBusinessUnitId' => $selectedBusinessUnitId,
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
            'business_unit_id' => 'required|exists:business_units,id',
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                \Illuminate\Validation\Rule::unique('macro_processes')
                    ->where('business_unit_id', $request->input('business_unit_id'))
                    ->whereNull('deleted_at'),
            ],
            'description' => 'nullable|string',
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

        // Verify business unit belongs to current organization
        $businessUnit = BusinessUnit::findOrFail($validated['business_unit_id']);
        if ($businessUnit->organization_id !== $currentOrgId) {
            abort(403, 'Invalid business unit.');
        }

        $managerIds = $validated['manager_ids'] ?? [];
        $documents = $request->file('documents', []);
        $documentCategories = $validated['document_categories'] ?? [];
        $documentDescriptions = $validated['document_descriptions'] ?? [];

        unset($validated['manager_ids'], $validated['documents'], $validated['document_categories'], $validated['document_descriptions']);

        $macroProcess = MacroProcess::create($validated);

        // Attach managers
        if (!empty($managerIds)) {
            $macroProcess->managers()->attach($managerIds);
        }

        // Upload documents
        if (!empty($documents)) {
            foreach ($documents as $index => $document) {
                $macroProcess->addDocument(
                    $document,
                    [
                        'category' => $documentCategories[$index] ?? null,
                        'description' => $documentDescriptions[$index] ?? null,
                    ]
                );
            }
        }

        return redirect()->route('macro-processes.show', $macroProcess)
            ->with('success', 'Macro Process created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, MacroProcess $macroProcess)
    {
        $user = $request->user();

        // Verify macro process belongs to current organization
        if ($macroProcess->businessUnit->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this macro process.');
        }

        $macroProcess->load([
            'businessUnit.organization',
            'managers',
            'processes.managers',
            'documents',
            'bpmnDiagrams',
        ])->loadCount('processes');

        return Inertia::render('macro-processes/show', [
            'macroProcess' => $macroProcess,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, MacroProcess $macroProcess)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        // Verify macro process belongs to current organization
        if ($macroProcess->businessUnit->organization_id !== $currentOrgId) {
            abort(403, 'You do not have access to this macro process.');
        }

        // Get business units for current organization
        $businessUnits = BusinessUnit::where('organization_id', $currentOrgId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Ensure the current business unit is included even if inactive
        if (!$businessUnits->contains('id', $macroProcess->business_unit_id)) {
            $businessUnits->push($macroProcess->businessUnit);
            $businessUnits = $businessUnits->sortBy('name')->values();
        }

        // Get potential managers from current organization
        $managers = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })->get();

        return Inertia::render('macro-processes/edit', [
            'macroProcess' => $macroProcess->load(['businessUnit', 'managers', 'documents']),
            'businessUnits' => $businessUnits,
            'managers' => $managers,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MacroProcess $macroProcess)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        // Verify macro process belongs to current organization
        if ($macroProcess->businessUnit->organization_id !== $currentOrgId) {
            abort(403, 'You do not have access to this macro process.');
        }

        $validated = $request->validate([
            'business_unit_id' => 'required|exists:business_units,id',
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                \Illuminate\Validation\Rule::unique('macro_processes')
                    ->ignore($macroProcess->id)
                    ->where('business_unit_id', $request->input('business_unit_id'))
                    ->whereNull('deleted_at'),
            ],
            'description' => 'nullable|string',
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

        // Verify business unit belongs to current organization
        $businessUnit = BusinessUnit::findOrFail($validated['business_unit_id']);
        if ($businessUnit->organization_id !== $currentOrgId) {
            abort(403, 'Invalid business unit.');
        }

        $managerIds = $validated['manager_ids'] ?? [];
        $documents = $request->file('documents', []);
        $documentCategories = $validated['document_categories'] ?? [];
        $documentDescriptions = $validated['document_descriptions'] ?? [];

        unset($validated['manager_ids'], $validated['documents'], $validated['document_categories'], $validated['document_descriptions']);

        $macroProcess->update($validated);

        // Sync managers
        $macroProcess->managers()->sync($managerIds);

        // Upload new documents
        if (!empty($documents)) {
            foreach ($documents as $index => $document) {
                $macroProcess->addDocument(
                    $document,
                    [
                        'category' => $documentCategories[$index] ?? null,
                        'description' => $documentDescriptions[$index] ?? null,
                    ]
                );
            }
        }

        return redirect()->route('macro-processes.show', $macroProcess)
            ->with('success', 'Macro Process updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, MacroProcess $macroProcess)
    {
        $user = $request->user();

        // Verify macro process belongs to current organization
        if ($macroProcess->businessUnit->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this macro process.');
        }

        $macroProcess->delete();

        return redirect()->route('macro-processes.index')
            ->with('success', 'Macro Process deleted successfully.');
    }

    /**
     * Export macro processes to Excel.
     */
    public function export(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return response()->json(['message' => 'No organization selected'], 400);
        }

        // Build base query for export (same as index)
        $baseQuery = MacroProcess::whereHas('businessUnit', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->with(['businessUnit', 'managers'])
            ->withCount('processes');

        // Apply filters using QueryBuilder but get all records
        $query = \Spatie\QueryBuilder\QueryBuilder::for($baseQuery);

        // Apply filters
        $query->allowedFilters([
            AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
            AllowedFilter::custom('manager', new ManagerFilter('managers')),
            AllowedFilter::custom('date_from', new DateFromFilter(), 'updated_at'),
            AllowedFilter::custom('date_to', new DateToFilter(), 'updated_at'),
        ]);

        // Apply sorts
        $query->allowedSorts([
            'name',
            'code',
            'updated_at',
            'processes_count',
        ])->defaultSort('name');

        // Handle global search
        if ($request->has('search')) {
            $searchTerm = $request->input('search');
            $searchColumns = ['name', 'code', 'description', 'objectives', 'managers.name', 'business_unit.name'];

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
        $macroProcesses = $query->get();

        try {
            $filename = 'macro-processes-' . now()->format('Y-m-d-H-i-s') . '.xlsx';
            return Excel::download(new MacroProcessesExport($macroProcesses), $filename);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
