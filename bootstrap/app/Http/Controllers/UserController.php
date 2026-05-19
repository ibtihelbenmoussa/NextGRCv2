<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\UsersExport;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $orgId = $currentUser->current_organization_id;

        $users = User::with(['organizations', 'roles' => function ($query) use ($orgId) {
            $query->where('roles.organization_id', $orgId);
        }])
            ->withCount('organizations')
            ->orderBy('name')
            ->get();

        // Calculate stats
        $stats = [
            'total' => $users->count(),
            'active' => $users->where('email_verified_at', '!=', null)->count(),
            'admins' => $users->filter(function ($user) {
                return $user->roles->count() > 0;
            })->count(),
        ];

        return Inertia::render('users/index', [
            'users' => $users,
            'stats' => $stats,
        ]);
    }

    public function show(User $user)
    {
        $user->load('organizations');

        return Inertia::render('users/show', [
            'user' => $user,
        ]);
    }

    public function create(Request $request)
    {
        $organizations = Organization::orderBy('name')->get();

        // Get all roles grouped by organization
        $allRoles = \Spatie\Permission\Models\Role::orderBy('organization_id')
            ->orderBy('name')
            ->get()
            ->groupBy('organization_id');

        return Inertia::render('users/create', [
            'organizations' => $organizations,
            'rolesByOrganization' => $allRoles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'job_title' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'organization_roles' => 'nullable|array',
            'organization_roles.*.organization_id' => 'required|exists:organizations,id',
            'organization_roles.*.role_ids' => 'required|array',
            'organization_roles.*.role_ids.*' => 'required|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'job_title' => $validated['job_title'] ?? null,
            'department' => $validated['department'] ?? null,
        ]);

        // Attach organizations and assign roles
        if (!empty($validated['organization_roles'])) {
            foreach ($validated['organization_roles'] as $index => $orgRole) {
                $orgId = $orgRole['organization_id'];

                // Get the primary role name for the pivot table
                $primaryRole = 'user'; // default
                if (!empty($orgRole['role_ids'])) {
                    $firstRole = \Spatie\Permission\Models\Role::find($orgRole['role_ids'][0]);
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
                $user->organizations()->attach($orgId, [
                    'role' => $primaryRole,
                    'is_default' => $index === 0, // First organization is default
                ]);

                // Assign roles for this organization
                if (!empty($orgRole['role_ids'])) {
                    app()[\Spatie\Permission\PermissionRegistrar::class]->setPermissionsTeamId($orgId);

                    // Filter role IDs to only include roles that belong to this organization
                    $validRoleIds = \Spatie\Permission\Models\Role::where('organization_id', $orgId)
                        ->whereIn('id', $orgRole['role_ids'])
                        ->pluck('id')
                        ->toArray();

                    if (!empty($validRoleIds)) {
                        $user->assignRole($validRoleIds);
                    }
                }
            }

            // Set current organization to the first one
            if (!empty($validated['organization_roles'][0])) {
                $user->update([
                    'current_organization_id' => $validated['organization_roles'][0]['organization_id'],
                ]);
            }
        }

        return redirect()->route('users.show', $user)
            ->with('success', 'User created successfully.');
    }

    public function edit(Request $request, User $user)
    {
        $currentUser = $request->user();
        $orgId = $currentUser->current_organization_id;

        $user->load('organizations');
        $organizations = Organization::orderBy('name')->get();

        // Get roles for current organization
        app()[\Spatie\Permission\PermissionRegistrar::class]->setPermissionsTeamId($orgId);
        $roles = \Spatie\Permission\Models\Role::where('organization_id', $orgId)
            ->orderBy('name')
            ->get();

        // Get user's roles per organization
        $userOrganizationRoles = [];
        foreach ($user->organizations as $org) {
            $userOrganizationRoles[$org->id] = $user->rolesInOrganization($org->id)->pluck('id')->toArray();
        }

        return Inertia::render('users/edit', [
            'user' => $user,
            'organizations' => $organizations,
            'availableRoles' => $roles,
            'userOrganizationRoles' => $userOrganizationRoles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'job_title' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'organization_roles' => 'nullable|array',
            'organization_roles.*.organization_id' => 'required|exists:organizations,id',
            'organization_roles.*.role_ids' => 'required|array',
            'organization_roles.*.role_ids.*' => 'required|exists:roles,id',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'job_title' => $validated['job_title'] ?? null,
            'department' => $validated['department'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        // Get current organization memberships
        $currentOrgs = $user->organizations()->pluck('organization_id')->toArray();

        // Sync organizations and roles
        if (isset($validated['organization_roles'])) {
            $syncData = [];
            $newOrgIds = [];

            foreach ($validated['organization_roles'] as $index => $orgRole) {
                $orgId = $orgRole['organization_id'];
                $newOrgIds[] = $orgId;

                // Get the primary role name for the pivot table
                $primaryRole = 'user'; // default
                if (!empty($orgRole['role_ids'])) {
                    $firstRole = \Spatie\Permission\Models\Role::find($orgRole['role_ids'][0]);
                    if ($firstRole) {
                        $primaryRole = User::spatieRoleToSimpleRole($firstRole->name);
                    }
                }

                $syncData[$orgId] = [
                    'role' => $primaryRole,
                    'is_default' => $index === 0,
                ];

                // Sync roles for this organization
                if (!empty($orgRole['role_ids'])) {
                    app()[\Spatie\Permission\PermissionRegistrar::class]->setPermissionsTeamId($orgId);
                    $user->syncRoles($orgRole['role_ids']);
                }
            }

            // Remove roles from organizations that are being removed
            $removedOrgs = array_diff($currentOrgs, $newOrgIds);
            foreach ($removedOrgs as $removedOrgId) {
                app()[\Spatie\Permission\PermissionRegistrar::class]->setPermissionsTeamId($removedOrgId);
                $user->syncRoles([]);
            }

            $user->organizations()->sync($syncData);

            // Update current organization if needed
            if (!empty($validated['organization_roles'][0])) {
                $firstOrgId = $validated['organization_roles'][0]['organization_id'];
                if (!$user->current_organization_id || !$user->belongsToOrganization($user->current_organization_id)) {
                    $user->update(['current_organization_id' => $firstOrgId]);
                }
            }
        }

        return redirect()->route('users.show', $user)
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Export users to Excel.
     */
    public function export(Request $request)
    {
        $currentUser = $request->user();
        $orgId = $currentUser->current_organization_id;

        if (!$orgId) {
            return response()->json(['message' => 'No organization selected'], 400);
        }

        // Build query for export (same as index)
        $users = User::with(['organizations', 'roles' => function ($query) use ($orgId) {
            $query->where('roles.organization_id', $orgId);
        }])
            ->withCount('organizations')
            ->orderBy('name')
            ->get();

        // Filter users based on search if provided
        if ($request->has('search')) {
            $searchTerm = strtolower($request->input('search'));
            $users = $users->filter(function ($user) use ($searchTerm) {
                return str_contains(strtolower($user->name), $searchTerm) ||
                       str_contains(strtolower($user->email), $searchTerm);
            });
        }

        try {
            $filename = 'users-' . now()->format('Y-m-d-H-i-s') . '.xlsx';
            return Excel::download(new UsersExport($users), $filename);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
