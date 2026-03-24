<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Control extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'code',
        'name',
        'description',
        'control_type',
        'control_nature',
        'frequency',
        'owner_id',
        'pertinance',
        'realite',
        'efficiency',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the organization that owns the control.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the owner of the control.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the risks mitigated by this control.
     */
    public function risks(): BelongsToMany
    {
        return $this->belongsToMany(Risk::class, 'control_risk')
            ->withTimestamps();
    }

    /**
     * Get the tests for the control.
     */
    public function tests(): HasMany
    {
        return $this->hasMany(Test::class);
    }

    public function scopeDateFrom($query, $date)
{
    if ($date) {
        $query->whereDate('created_at', '>=', $date);
    }
}

public function scopeDateTo($query, $date)
{
    if ($date) {
        $query->whereDate('created_at', '<=', $date);
    }
}
}
