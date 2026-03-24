<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasOrganization
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Skip if user is not authenticated
        if (!$user) {
            return $next($request);
        }

        // Skip if on organization selection page or auth pages
        if ($request->routeIs('organizations.select*') || $request->routeIs('logout')) {
            return $next($request);
        }

        // If user has no current organization, redirect to selection page
        if (!$user->current_organization_id) {
            // Get user's organizations
            $organizations = $user->organizations()->get();

            // If user has exactly one organization, auto-select it
            if ($organizations->count() === 1) {
                $user->setCurrentOrganization($organizations->first()->id);
                return $next($request);
            }

            // Redirect to selection page if user has multiple organizations or none
            if ($organizations->count() > 1) {
                return redirect()->route('organizations.select.page');
            }

            // If no organizations, continue (will show appropriate message elsewhere)
        }

        // Verify that the current organization is still valid
        // (user might have been removed from it)
        if ($user->current_organization_id) {
            $hasAccess = $user->organizations()
                ->where('organizations.id', $user->current_organization_id)
                ->exists();

            if (!$hasAccess) {
                // Current organization is invalid, clear it and redirect to selection
                $user->current_organization_id = null;
                $user->save();
                return redirect()->route('organizations.select.page');
            }

            // Set permission team context for the current organization
            setPermissionsTeamId($user->current_organization_id);
        }

        return $next($request);
    }
}
