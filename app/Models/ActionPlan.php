<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActionPlan extends Model
{
    protected $fillable = [
        'gap_id', 'assigned_to', 'title', 
        'description', 'due_date', 'status',
    ];

    public function assessment()
    {
        return $this->belongsTo(GapAssessment::class, 'gap_id');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}