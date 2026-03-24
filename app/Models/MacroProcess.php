<?php

namespace App\Models;

use App\Models\Concerns\HasDocuments;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MacroProcess extends Model
{
    use HasFactory, SoftDeletes, HasDocuments;

    protected $fillable = [
        'business_unit_id',
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the business unit that owns the macro process.
     */
    public function businessUnit(): BelongsTo
    {
        return $this->belongsTo(BusinessUnit::class);
    }

    /**
     * Get the BPMN diagrams attached to this macro process.
     */
    public function bpmnDiagrams()
    {
        return $this->morphMany(BPMNDiagram::class, 'diagramable');
    }

    /**
     * Get the managers of the macro process.
     */
    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'macro_process_manager')
            ->withTimestamps();
    }

    /**
     * Get the processes for the macro process.
     */
    public function processes(): HasMany
    {
        return $this->hasMany(Process::class);
    }

    /**
     * Get the organization through the business unit.
     */
    public function organization(): BelongsTo
    {
        return $this->businessUnit->organization();
    }

    /**
     * Get the organization_id through the business unit.
     */
    public function getOrganizationIdAttribute(): ?int
    {
        return $this->businessUnit?->organization_id;
    }
}
