<?php

namespace App\Models;

use App\Models\Concerns\HasDocuments;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessUnit extends Model
{
    use HasFactory, SoftDeletes, HasDocuments;

    protected $fillable = [
        'organization_id',
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the organization that owns the business unit.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the managers of the business unit.
     */
    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'business_unit_manager')
            ->withTimestamps();
    }

    /**
     * Get the macro processes for the business unit.
     */
    public function macroProcesses(): HasMany
    {
        return $this->hasMany(MacroProcess::class);
    }
}
