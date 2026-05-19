<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $currentOrganizationId = $user->current_organization_id;

        // Get global roles (no organization_id)
        $roles = Role::orderBy('name')
            ->withCount('permissions')
            ->get()
            ->map(function ($role) use ($currentOrganizationId) {
                // Count users with this role in this organization via organization_user pivot
                $role->users_count = \DB::table('organization_user')
                    ->where('organization_id', $currentOrganizationId)
                    ->where('role', strtolower($role->name))
                    ->count();
                return $role;
            });

        // Count total unique users in this organization across ALL roles
        $totalUniqueUsers = \DB::table('organization_user')
            ->where('organization_id', $currentOrganizationId)
            ->distinct('user_id')
            ->count('user_id');

        $stats = [
            'total' => $roles->count(),
            'withPermissions' => $roles->where('permissions_count', '>', 0)->count(),
            'assignedUsers' => $totalUniqueUsers,
        ];

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'stats' => $stats,
        ]);
    }

    public function create(Request $request)
    {
        // Get all permissions (permissions are shared across organizations)
        $permissions = Permission::orderBy('name')
            ->get()
            ->map(function ($permission) {
                // Extract category from permission name (e.g., "users.create" -> "Users")
                $parts = explode('.', $permission->name);
                $permission->category = isset($parts[0]) ? ucfirst($parts[0]) : 'General';
                return $permission;
            });

        return Inertia::render('roles/create', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $currentOrganizationId = $user->current_organization_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'guard_name' => 'required|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        // Create role for current organization
        // Only create global role if it doesn't exist
        $role = Role::firstOrCreate([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'],
        ]);

        // Assign permissions to role
        if (!empty($validated['permissions'])) {
            $permissions = Permission::whereIn('id', $validated['permissions'])->get();
            $role->syncPermissions($permissions);
        }

        return redirect()->route('roles.show', $role)
            ->with('success', 'Role created successfully.');
    }

    public function show(Request $request, Role $role)
    {
        $user = $request->user();
        $currentOrganizationId = $user->current_organization_id;

        // Load permissions
        $role->load('permissions');

        // Load users for this role in this organization only via organization_user pivot
        $uniqueUserIds = \DB::table('organization_user')
            ->where('organization_id', $currentOrganizationId)
            ->where('role', strtolower($role->name))
            ->distinct()
            ->pluck('user_id');

        // Load the actual user models
        $role->users = \App\Models\User::whereIn('id', $uniqueUserIds)->get();

        // Count users in this organization
        $role->users_count = $uniqueUserIds->count();
        $role->permissions_count = $role->permissions->count();

        return Inertia::render('roles/show', [
            'role' => $role,
        ]);
    }

    public function edit(Request $request, Role $role)
    {
        $user = $request->user();
        $currentOrganizationId = $user->current_organization_id;

        $role->load('permissions');

        // Get all permissions (permissions are shared across organizations)
        $permissions = Permission::orderBy('name')
            ->get()
            ->map(function ($permission) {
                $parts = explode('.', $permission->name);
                $permission->category = isset($parts[0]) ? ucfirst($parts[0]) : 'General';
                return $permission;
            });

        return Inertia::render('roles/edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $user = $request->user();
        $currentOrganizationId = $user->current_organization_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'guard_name' => 'required|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role->update([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'],
        ]);

        // Sync permissions
        if (isset($validated['permissions'])) {
            $permissions = Permission::whereIn('id', $validated['permissions'])->get();
            $role->syncPermissions($permissions);
        } else {
            $role->syncPermissions([]);
        }

        return redirect()->route('roles.show', $role)
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Request $request, Role $role)
    {
        $user = $request->user();
        $currentOrganizationId = $user->current_organization_id;

        $role->delete();

        return redirect()->route('roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}
