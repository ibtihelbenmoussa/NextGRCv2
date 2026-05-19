<?php

namespace App\Policies;

use App\Models\RiskConfiguration;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class RiskConfigurationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view risk configurations') || 
               $user->hasPermissionTo('manage risk configurations');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, RiskConfiguration $riskConfiguration): bool
    {
        // User can view if they belong to the same organization
        return $user->current_organization_id === $riskConfiguration->organization_id &&
               ($user->hasPermissionTo('view risk configurations') || 
                $user->hasPermissionTo('manage risk configurations'));
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage risk configurations');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, RiskConfiguration $riskConfiguration): bool
    {
        // User can update if they belong to the same organization and have permission
        return $user->current_organization_id === $riskConfiguration->organization_id &&
               $user->hasPermissionTo('manage risk configurations');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, RiskConfiguration $riskConfiguration): bool
    {
        // User can delete if they belong to the same organization and have permission
        return $user->current_organization_id === $riskConfiguration->organization_id &&
               $user->hasPermissionTo('manage risk configurations');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, RiskConfiguration $riskConfiguration): bool
    {
        return $user->current_organization_id === $riskConfiguration->organization_id &&
               $user->hasPermissionTo('manage risk configurations');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, RiskConfiguration $riskConfiguration): bool
    {
        return $user->current_organization_id === $riskConfiguration->organization_id &&
               $user->hasPermissionTo('manage risk configurations');
    }
}
