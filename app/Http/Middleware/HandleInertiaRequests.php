<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\AppSetting;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $currentOrganization = null;

        if ($user) {
            $user->load(['currentOrganization:id,name,code', 'organizations:id,name,code']);
            $currentOrganization = $user->currentOrganization;

            // ← hada el fix
            if ($user->current_organization_id) {
                setPermissionsTeamId($user->current_organization_id);
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user'        => $user,
                'roles'       => $user?->getRoleNames() ?? [],
                'permissions' => $user?->getAllPermissions()->pluck('name') ?? [],
            ],
            'settings'            => AppSetting::all(),
            'currentOrganization' => $currentOrganization,
            'sidebarOpen'         => !$request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ];
    }
}