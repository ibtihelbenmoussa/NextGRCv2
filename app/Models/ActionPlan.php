<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActionPlan extends Model
{
    protected $fillable = [
        'gap_id',
        'assigned_to',
        'title',
        'description',
        'due_date',
        'status',
        'step_level',
        'step_index',
    ];

    protected $casts = [
        'due_date'    => 'date',
        'step_level'  => 'integer',
        'step_index'  => 'integer',
    ];

    public function assessment()
    {
        return $this->belongsTo(GapAssessment::class, 'gap_id');
    }

    public function gapAssessment()
    {
        return $this->belongsTo(GapAssessment::class, 'gap_id');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}