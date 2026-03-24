<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HasDataTable;
use App\Http\Filters\DateFromFilter;
use App\Http\Filters\DateToFilter;
use App\Http\Filters\ManagerFilter;
use App\Http\Filters\StatusFilter;
use App\Models\BusinessUnit;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\QueryBuilder\AllowedFilter;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\BusinessUnitsExport;

class BusinessUnitController extends Controller
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

        // Get stats from all business units (not filtered)
        $allBusinessUnits = BusinessUnit::where('organization_id', $currentOrgId)
            ->withCount('macroProcesses')
            ->get();

        $stats = [
            'total' => $allBusinessUnits->count(),
            'active' => $allBusinessUnits->where('is_active', true)->count(),
            'macro_processes' => $allBusinessUnits->sum('macro_processes_count'),
        ];

        // Build base query
        $baseQuery = BusinessUnit::where('organization_id', $currentOrgId)
            ->with('managers')
            ->withCount('macroProcesses');

        // Get all managers from current organization for filter dropdown
        $managers = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })
            ->orderBy('name')
            ->get(['id', 'name']);

        // Build DataTable query with Spatie Query Builder
        $businessUnits = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'code', 'description', 'managers.name'],
            'filters' => [
                AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
                AllowedFilter::custom('manager', new ManagerFilter('managers')),
                AllowedFilter::custom('date_from', new DateFromFilter(), 'updated_at'),
                AllowedFilter::custom('date_to', new DateToFilter(), 'updated_at'),
            ],
            'sorts' => [
                'name',
                'code',
                'updated_at',
                'macro_processes_count',
            ],
            'defaultSort' => 'name',
            'perPage' => 10,
        ]);

        return Inertia::render('business-units/index', [
            'businessUnits' => $businessUnits,
            'stats' => $stats,
            'managers' => $managers,
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

        // Get potential managers from current organization
        $managers = User::whereHas('organizations', function ($query) use ($currentOrgId) {
            $query->where('organization_id', $currentOrgId);
        })->get();

        return Inertia::render('business-units/create', [
            'managers' => $managers,
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
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:business_units,code',
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

        $validated['organization_id'] = $currentOrgId;
        $managerIds = $validated['manager_ids'] ?? [];
        $documents = $request->file('documents', []);
        $documentCategories = $validated['document_categories'] ?? [];
        $documentDescriptions = $validated['document_descriptions'] ?? [];

        // Debug: Log document information
        \Log::info('Documents received:', [
            'count' => count($documents),
            'has_files' => $request->hasFile('documents'),
            'all_files' => $request->allFiles(),
        ]);

        unset($validated['manager_ids'], $validated['documents'], $validated['document_categories'], $validated['document_descriptions']);

        $businessUnit = BusinessUnit::create($validated);

        // Attach managers
        if (!empty($managerIds)) {
            $businessUnit->managers()->attach($managerIds);
        }

        // Upload documents
        if (!empty($documents)) {
            foreach ($documents as $index => $document) {
                \Log::info('Uploading document:', [
                    'index' => $index,
                    'name' => $document->getClientOriginalName(),
                    'size' => $document->getSize(),
                ]);

                $uploadedDoc = $businessUnit->addDocument(
                    $document,
                    [
                        'category' => $documentCategories[$index] ?? null,
                        'description' => $documentDescriptions[$index] ?? null,
                    ]
                );

                \Log::info('Document uploaded:', ['id' => $uploadedDoc->id]);
            }
        } else {
            \Log::info('No documents to upload');
        }

        return redirect()->route('business-units.show', $businessUnit)
            ->with('success', 'Business Unit created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, BusinessUnit $businessUnit)
    {
        $user = $request->user();

        // Verify business unit belongs to current organization
        if ($businessUnit->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this business unit.');
        }

        $businessUnit->load([
            'organization',
            'managers',
            'macroProcesses.managers',
            'documents',
        ])->loadCount('macroProcesses');

        return Inertia::render('business-units/show', [
            'businessUnit' => $businessUnit,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, BusinessUnit $businessUnit)
    {
        $user = $request->user();

        // Verify business unit belongs to current organization
        if ($businessUnit->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this business unit.');
        }

        // Get potential managers from current organization
        $managers = User::whereHas('organizations', function ($query) use ($user) {
            $query->where('organization_id', $user->current_organization_id);
        })->get();

        $businessUnit->load(['managers', 'documents']);

        return Inertia::render('business-units/edit', [
            'businessUnit' => $businessUnit,
            'managers' => $managers,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BusinessUnit $businessUnit)
    {
        $user = $request->user();

        // Verify business unit belongs to current organization
        if ($businessUnit->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this business unit.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:business_units,code,' . $businessUnit->id,
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

        $managerIds = $validated['manager_ids'] ?? [];
        $documents = $request->file('documents', []);
        $documentCategories = $validated['document_categories'] ?? [];
        $documentDescriptions = $validated['document_descriptions'] ?? [];

        unset($validated['manager_ids'], $validated['documents'], $validated['document_categories'], $validated['document_descriptions']);

        $businessUnit->update($validated);

        // Sync managers
        $businessUnit->managers()->sync($managerIds);

        // Upload new documents
        if (!empty($documents)) {
            foreach ($documents as $index => $document) {
                $businessUnit->addDocument(
                    $document,
                    [
                        'category' => $documentCategories[$index] ?? null,
                        'description' => $documentDescriptions[$index] ?? null,
                    ]
                );
            }
        }

        return redirect()->route('business-units.show', $businessUnit)
            ->with('success', 'Business Unit updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, BusinessUnit $businessUnit)
    {
        $user = $request->user();

        // Verify business unit belongs to current organization
        if ($businessUnit->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this business unit.');
        }

        $businessUnit->delete();

        return redirect()->route('business-units.index')
            ->with('success', 'Business Unit deleted successfully.');
    }

    /**
     * Export business units to Excel.
     */
    public function export(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return response()->json(['message' => 'No organization selected'], 400);
        }

        // Build base query for export (same as index)
        $baseQuery = BusinessUnit::where('organization_id', $currentOrgId)
            ->with('managers')
            ->withCount('macroProcesses');

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
            'macro_processes_count',
        ])->defaultSort('name');

        // Handle global search
        if ($request->has('search')) {
            $searchTerm = $request->input('search');
            $searchColumns = ['name', 'code', 'description', 'managers.name'];

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
        $businessUnits = $query->get();

        try {
            $filename = 'business-units-' . now()->format('Y-m-d-H-i-s') . '.xlsx';
            return Excel::download(new BusinessUnitsExport($businessUnits), $filename);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
