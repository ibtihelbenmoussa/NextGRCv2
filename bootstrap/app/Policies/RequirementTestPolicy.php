<?php

namespace App\Policies;

use App\Models\User;
use App\Models\RequirementTest;
use Illuminate\Auth\Access\HandlesAuthorization;

class RequirementTestPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    // ✅ Méthode manquante — à ajouter
    public function viewAnyValidation(User $user): bool
    {
        return true; // Tous les utilisateurs connectés peuvent accéder
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, RequirementTest $test): bool
    {
        return $user->id === $test->user_id;
    }

    public function delete(User $user, RequirementTest $test): bool
    {
        return $user->id === $test->user_id;
    }
}