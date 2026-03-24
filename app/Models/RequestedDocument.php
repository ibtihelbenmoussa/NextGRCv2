<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestedDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_mission_id',
        'name',
        'description',
        'status',
        'requested_date',
        'received_date',
        'requested_from_user_id',
        'notes',
    ];

    protected $casts = [
        'requested_date' => 'date',
        'received_date' => 'date',
    ];

    /**
     * Get the audit mission that owns the requested document.
     */
    public function auditMission(): BelongsTo
    {
        return $this->belongsTo(AuditMission::class);
    }

    /**
     * Get the user from whom the document is requested.
     */
    public function requestedFrom(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_from_user_id');
    }
}
