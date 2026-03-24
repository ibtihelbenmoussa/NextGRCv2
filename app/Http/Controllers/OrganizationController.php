<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HasDataTable;
use App\Http\Filters\DateFromFilter;
use App\Http\Filters\DateToFilter;
use App\Http\Filters\StatusFilter;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\QueryBuilder\AllowedFilter;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\OrganizationsExport;

class OrganizationController extends Controller
{
    use HasDataTable;

    public function index(Request $request)
    {
        $user = $request->user();

        // Get stats from all organizations the user belongs to (not filtered)
        $allOrganizations = $user->organizations()
            ->withCount([
                'businessUnits',
                'users',
                'risks',
                'controls'
            ])->get();

        $stats = [
            'total' => $allOrganizations->count(),
            'active' => $allOrganizations->where('is_active', true)->count(),
            'users' => $allOrganizations->sum('users_count'),
        ];

        // Build base query for DataTable
        $baseQuery = $user->organizations()
            ->withCount([
                'businessUnits',
                'users',
                'risks',
                'controls'
            ]);

        // Build DataTable query with Spatie Query Builder
        $organizations = $this->buildDataTableQuery($baseQuery, [
            'searchColumns' => ['name', 'code', 'description', 'email'],
            'filters' => [
                AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
                AllowedFilter::custom('date_from', new DateFromFilter(), 'created_at'),
                AllowedFilter::custom('date_to', new DateToFilter(), 'created_at'),
            ],
            'sorts' => [
                'name',
                'code',
                'created_at',
                'business_units_count',
                'users_count',
                'risks_count',
            ],
            'defaultSort' => 'name',
            'perPage' => 10,
        ]);

        return Inertia::render('organizations/index', [
            'organizations' => $organizations,
            'stats' => $stats,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    public function show(Request $request, Organization $organization)
    {
        $user = $request->user();

        // Verify user has access to this organization
        if (!$user->belongsToOrganization($organization->id)) {
            abort(403, 'You do not have access to this organization.');
        }

        $organization->load([
            'businessUnits.managers',
            'risks',
            'controls',
        ])->loadCount([
            'businessUnits',
            'users',
            'risks',
            'controls',
            'auditMissions',
        ]);

        // Get available roles for this organization
        app()[\Spatie\Permission\PermissionRegistrar::class]->setPermissionsTeamId($organization->id);
        $availableRoles = \Spatie\Permission\Models\Role::where('organization_id', $organization->id)
            ->orderBy('name')
            ->get();

        // Load users with their roles from the pivot table
        $users = $organization->users()->get()->map(function ($user) {
            // Get the role from the pivot table
            $pivotRole = $user->pivot->role ?? 'user';

            // Create a role object to match the expected frontend structure
            $roleObject = [
                'id' => $pivotRole, // Using role name as ID since it's from pivot
                'name' => ucwords(str_replace('_', ' ', $pivotRole)), // Format: "Audit Chief"
                'guard_name' => 'web',
            ];

            $userArray = $user->toArray();
            $userArray['organization_roles'] = [$roleObject]; // Array with single role
            return $userArray;
        });

        $organization->setRelation('users', $users);

        return Inertia::render('organizations/show', [
            'organization' => $organization,
            'availableRoles' => $availableRoles,
        ]);
    }

    public function create()
    {
        return Inertia::render('organizations/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:organizations,code',
            'description' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $user = $request->user();
        $organization = Organization::create($validated);

        // Attach the creating user to the organization as admin
        $organization->users()->attach($user->id, [
            'role' => 'admin',
            'is_default' => true,
        ]);

        // Assign Admin role to the creating user in this organization
        app()[\Spatie\Permission\PermissionRegistrar::class]->setPermissionsTeamId($organization->id);
        $adminRole = \Spatie\Permission\Models\Role::where('organization_id', $organization->id)
            ->where('name', 'Admin')
            ->first();

        if ($adminRole) {
            $user->assignRole($adminRole);
        }

        // Set as current organization
        $user->setCurrentOrganization($organization->id);

        return redirect()->route('organizations.show', $organization)
            ->with('success', 'Organization created successfully.');
    }

    public function edit(Organization $organization)
    {
        return Inertia::render('organizations/edit', [
            'organization' => $organization,
        ]);
    }

    public function update(Request $request, Organization $organization)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:organizations,code,' . $organization->id,
            'description' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $organization->update($validated);

        return redirect()->route('organizations.show', $organization)
            ->with('success', 'Organization updated successfully.');
    }

    public function destroy(Organization $organization)
    {
        $organization->delete();

        return redirect()->route('organizations.index')
            ->with('success', 'Organization deleted successfully.');
    }

  public function selectPage(Request $request)
{
    $user = $request->user();
    $organizations = $user->organizations()->get();

    return Inertia::render('organizations/select', [
        'organizations' => $organizations,
    ]);
}

   public function select(Request $request, Organization $organization)
{
    $user = $request->user();

    if (!$user->belongsToOrganization($organization->id)) {
        return back()->with('error', 'You do not have access to this organization.');
    }

    $user->setCurrentOrganization($organization->id);

    $hasCurrentOrg = $request->boolean('hasCurrentOrg');

    $message = $hasCurrentOrg
        ? "Switched to {$organization->name}"
        : "Selected {$organization->name}";

    return redirect('/dashboard')->with('success', $message);
}

    public function addUser(Request $request, Organization $organization)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role_ids' => 'required|array',
            'role_ids.*' => 'required|exists:roles,id',
        ]);

        // Check if user already belongs to this organization
        if ($organization->users()->where('user_id', $validated['user_id'])->exists()) {
            return back()->with('error', 'User already belongs to this organization.');
        }

        $user = User::findOrFail($validated['user_id']);

        // Get the primary role name for the pivot table
        $primaryRole = 'user'; // default
        if (!empty($validated['role_ids'])) {
            $firstRole = \Spatie\Permission\Models\Role::find($validated['role_ids'][0]);
            if ($firstRole) {
                // Convert role name to snake_case for pivot column
                $primaryRole = match ($firstRole->name) {
                    'Admin' => 'admin',
                    'Audit Chief' => 'audit_chief',
                    'Auditor' => 'auditor',
                    'Manager' => 'manager',
                    'Viewer' => 'user',
                    default => 'user',
                };
            }
        }

        // Attach organization with role
        $organization->users()->attach($validated['user_id'], [
            'role' => $primaryRole,
            'is_default' => false,
        ]);

        // Assign roles for this organization
        app()[\Spatie\Permission\PermissionRegistrar::class]->setPermissionsTeamId($organization->id);
        $user->assignRole($validated['role_ids']);

        return back()->with('success', 'User added to organization successfully.');
    }

    public function removeUser(Request $request, Organization $organization, User $user)
    {
        // Check if user belongs to this organization
        if (!$organization->users()->where('user_id', $user->id)->exists()) {
            return back()->with('error', 'User does not belong to this organization.');
        }

        // Remove roles for this organization
        app()[\Spatie\Permission\PermissionRegistrar::class]->setPermissionsTeamId($organization->id);
        $user->syncRoles([]);

        // Detach organization
        $organization->users()->detach($user->id);

        return back()->with('success', 'User removed from organization successfully.');
    }

    public function updateUserRole(Request $request, Organization $organization, User $user)
    {
        $validated = $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'required|exists:roles,id',
        ]);

        // Check if user belongs to this organization
        if (!$organization->users()->where('user_id', $user->id)->exists()) {
            return back()->with('error', 'User does not belong to this organization.');
        }

        // Sync roles for this organization
        app()[\Spatie\Permission\PermissionRegistrar::class]->setPermissionsTeamId($organization->id);
        $user->syncRoles($validated['role_ids']);

        return back()->with('success', 'User role updated successfully.');
    }

    public function export(Request $request)
    {
        $user = $request->user();

        // Build base query for export (same as index)
        $baseQuery = $user->organizations()
            ->withCount([
                'businessUnits',
                'users',
                'risks',
                'controls'
            ]);

        // Apply filters using QueryBuilder but get all records
        $query = \Spatie\QueryBuilder\QueryBuilder::for($baseQuery);

        // Apply filters
        $query->allowedFilters([
            AllowedFilter::custom('status', new StatusFilter(), 'is_active'),
            AllowedFilter::custom('date_from', new DateFromFilter(), 'created_at'),
            AllowedFilter::custom('date_to', new DateToFilter(), 'created_at'),
        ]);

        // Apply sorts
        $query->allowedSorts([
            'name',
            'code',
            'created_at',
            'business_units_count',
            'users_count',
            'risks_count',
        ])->defaultSort('name');

        // Handle global search
        if ($request->has('search')) {
            $searchTerm = $request->input('search');
            $searchColumns = ['name', 'code', 'description', 'email'];

            $query->where(function ($q) use ($searchColumns, $searchTerm) {
                foreach ($searchColumns as $column) {
                    $q->orWhere($column, 'like', "%{$searchTerm}%");
                }
            });
        }

        // Get all records without pagination
        $organizations = $query->get();

        try {
            $filename = 'organizations-' . now()->format('Y-m-d-H-i-s') . '.xlsx';
            return Excel::download(new OrganizationsExport($organizations), $filename);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
