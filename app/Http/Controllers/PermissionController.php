<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $orgId = $user->current_organization_id;

        // Get all permissions (permissions are shared across organizations)
        // But count roles specific to this organization
        app()[\Spatie\Permission\PermissionRegistrar::class]->setPermissionsTeamId($orgId);

        $permissions = Permission::withCount(['roles' => function ($query) use ($orgId) {
            $query->where('organization_id', $orgId);
        }])
            ->orderBy('name')
            ->get()
            ->map(function ($permission) {
                // Extract category from permission name
                $parts = explode('.', $permission->name);
                $permission->category = isset($parts[0]) ? ucfirst($parts[0]) : 'General';
                return $permission;
            });

        // Group by category for stats
        $groupedPermissions = $permissions->groupBy('category');

        $stats = [
            'total' => $permissions->count(),
            'categories' => $groupedPermissions->count(),
            'assigned' => $permissions->where('roles_count', '>', 0)->count(),
        ];

        return Inertia::render('permissions/index', [
            'permissions' => $permissions,
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        return Inertia::render('permissions/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
            'guard_name' => 'required|string|max:255',
        ]);

        Permission::create([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'],
        ]);

        return redirect()->route('permissions.index')
            ->with('success', 'Permission created successfully.');
    }

    public function destroy(Request $request, Permission $permission)
    {
        // Permissions are shared, but only allow deletion if not used by any role
        $rolesCount = $permission->roles()->count();

        if ($rolesCount > 0) {
            return redirect()->route('permissions.index')
                ->with('error', 'Cannot delete permission that is assigned to roles.');
        }

        $permission->delete();

        return redirect()->route('permissions.index')
            ->with('success', 'Permission deleted successfully.');
    }
}
