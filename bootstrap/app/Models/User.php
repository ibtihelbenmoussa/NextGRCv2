<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'department',
        'job_title',
        'current_organization_id',
    ];

      public function kri(): HasMany
    {
        return $this->hasMany(KRI::class);
    }


    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the organizations that the user belongs to.
     */
    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_user')
            ->withPivot('role', 'is_default')
            ->withTimestamps();
    }

    /**
     * Get the user's current organization.
     */
    public function currentOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'current_organization_id');
    }

    /**
     * Get the user's default organization.
     */
    public function defaultOrganization(): ?Organization
    {
        return $this->organizations()->wherePivot('is_default', true)->first();
    }

    /**
     * Set the user's current organization.
     */
    public function setCurrentOrganization(int $organizationId): bool
    {
        // Verify user belongs to this organization
        if (!$this->belongsToOrganization($organizationId)) {
            return false;
        }

        $this->current_organization_id = $organizationId;
        return $this->save();
    }

    /**
     * Check if user belongs to a specific organization.
     */
    public function belongsToOrganization(int $organizationId): bool
    {
        return $this->organizations()->where('organization_id', $organizationId)->exists();
    }

    /**
     * Get the user's role in a specific organization from the pivot table.
     */
    public function roleInOrganization(int $organizationId): ?string
    {
        $pivot = $this->organizations()->where('organization_id', $organizationId)->first()?->pivot;
        return $pivot ? $pivot->role : null;
    }

    /**
     * Get the user's role name in a specific organization.
     */
    public function roleNameInOrganization(int $organizationId): ?string
    {
        return $this->roleInOrganization($organizationId);
    }

    /**
     * Check if user has a specific role in an organization.
     */
    public function hasRoleInOrganization(string $roleName, int $organizationId): bool
    {
        return $this->roleInOrganization($organizationId) === strtolower($roleName);
    }

    /**
     * Assign a role to user in a specific organization.
     */
    public function assignRoleInOrganization(string $role, int $organizationId): self
    {
        $this->organizations()->updateExistingPivot($organizationId, ['role' => strtolower($role)]);
        return $this;
    }

    /**
     * Sync role for user in a specific organization.
     * Only one role per user per organization is allowed.
     */
    public function syncRoleInOrganization(string $role, int $organizationId): self
    {
        $this->organizations()->updateExistingPivot($organizationId, ['role' => strtolower($role)]);
        return $this;
    }

    /**
     * Remove role from user in a specific organization (sets to 'user').
     */
    public function removeRoleInOrganization(int $organizationId): self
    {
        $this->organizations()->updateExistingPivot($organizationId, ['role' => 'user']);
        return $this;
    }

    /**
     * Get the audit missions where this user is audit chief.
     */
    public function auditMissionsAsChief(): HasMany
    {
        return $this->hasMany(AuditMission::class, 'audit_chief_id');
    }

    /**
     * Get the audit missions where this user is an auditor.
     */
    public function auditMissionsAsAuditor(): BelongsToMany
    {
        return $this->belongsToMany(AuditMission::class, 'audit_mission_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get the business units managed by this user.
     */
    public function managedBusinessUnits(): HasMany
    {
        return $this->hasMany(BusinessUnit::class, 'manager_id');
    }

    /**
     * Get the macro processes owned by this user.
     */
    public function ownedMacroProcesses(): HasMany
    {
        return $this->hasMany(MacroProcess::class, 'owner_id');
    }

    /**
     * Get the processes owned by this user.
     */
    public function ownedProcesses(): HasMany
    {
        return $this->hasMany(Process::class, 'owner_id');
    }

    /**
     * Get the risks owned by this user.
     */
    public function ownedRisks(): HasMany
    {
        return $this->hasMany(Risk::class, 'owner_id');
    }

    /**
     * Get the controls owned by this user.
     */
    public function ownedControls(): HasMany
    {
        return $this->hasMany(Control::class, 'owner_id');
    }

    /**
     * Get the tests performed by this user.
     */
    public function performedTests(): HasMany
    {
        return $this->hasMany(Test::class, 'performed_by');
    }

    /**
     * Get the tests reviewed by this user.
     */
    public function reviewedTests(): HasMany
    {
        return $this->hasMany(Test::class, 'reviewed_by');
    }

    /**
     * Get the interviews where this user is the interviewee.
     */
    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class, 'interviewee_id');
    }

    /**
     * Get the requested documents from this user.
     */
    public function requestedDocuments(): HasMany
    {
        return $this->hasMany(RequestedDocument::class, 'requested_from_user_id');
    }

    /**
     * Check if the user is an admin in a specific organization.
     */
    public function isAdminIn(int $organizationId): bool
    {
        return $this->roleInOrganization($organizationId) === 'admin';
    }

    /**
     * Check if the user is an audit chief in a specific organization.
     */
    public function isAuditChiefIn(int $organizationId): bool
    {
        return $this->roleInOrganization($organizationId) === 'audit_chief';
    }

    /**
     * Check if the user is an auditor in a specific organization.
     */
    public function isAuditorIn(int $organizationId): bool
    {
        return $this->roleInOrganization($organizationId) === 'auditor';
    }

    /**
     * Check if the user is an admin in any organization.
     */
    public function isAdmin(): bool
    {
        return $this->organizations()->wherePivot('role', 'admin')->exists();
    }

    /**
     * Check if the user is an audit chief in any organization.
     */
    public function isAuditChief(): bool
    {
        return $this->organizations()->wherePivot('role', 'audit_chief')->exists();
    }

    /**
     * Check if the user is an auditor in any organization.
     */
    public function isAuditor(): bool
    {
        return $this->organizations()->wherePivot('role', 'auditor')->exists();
    }

    /**
     * Convert Spatie role name to organization_user pivot role value
     */
    public static function spatieRoleToSimpleRole(string $spatieRoleName): string
    {
        return match ($spatieRoleName) {
            'Admin' => 'admin',
            'Audit Chief' => 'audit_chief',
            'Auditor' => 'auditor',
            'Manager' => 'manager',
            'Viewer' => 'user',
            default => 'user',
        };
    }

    /**
     * Convert organization_user pivot role to Spatie role name
     */
    public static function simpleRoleToSpatieRole(string $simpleRole): string
    {
        return match (strtolower($simpleRole)) {
            'admin' => 'Admin',
            'audit_chief' => 'Audit Chief',
            'auditor' => 'Auditor',
            'manager' => 'Manager',
            'user', 'viewer' => 'Viewer',
            default => 'Viewer',
        };
    }

    // Removed: syncOrganizationUserRole based on Spatie roles. Now handled by assignRoleInOrganization/syncRoleInOrganization.
}
