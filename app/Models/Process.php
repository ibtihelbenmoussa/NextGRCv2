<?php

namespace App\Models;

use App\Models\Concerns\HasDocuments;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Process extends Model
{
    use HasFactory, SoftDeletes, HasDocuments;

    protected $fillable = [
        'macro_process_id',
        'name',
        'code',
        'description',
        'objectives',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the macro process that owns the process.
     */
    public function macroProcess(): BelongsTo
    {
        return $this->belongsTo(MacroProcess::class);
    }

    /**
     * Get the BPMN diagrams attached to this process.
     */
    public function bpmnDiagrams()
    {
        return $this->morphMany(BPMNDiagram::class, 'diagramable');
    }

    /**
     * Get the managers of the process.
     */
    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'process_manager')
            ->withTimestamps();
    }

    /**
     * Get the risks associated with the process.
     */
    public function risks(): BelongsToMany
    {
        return $this->belongsToMany(Risk::class, 'process_risk')
            ->withTimestamps();
    }

    /**
     * Get the organization through the macro process and business unit.
     */
    public function organization(): BelongsTo
    {
        return $this->macroProcess->businessUnit->organization();
    }

    /**
     * Get the organization_id through the hierarchy.
     */
    public function getOrganizationIdAttribute(): ?int
    {
        return $this->macroProcess?->businessUnit?->organization_id;
    }
}
