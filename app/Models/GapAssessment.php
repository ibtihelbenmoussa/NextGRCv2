<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GapAssessment extends Model
{
    protected $guarded = []; 

    protected $casts = [
        'answers'    => 'array',
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function framework()
    {
        return $this->belongsTo(Framework::class);
    }

    public function assessmentRequirements()
    {
        return $this->hasMany(GapAssessmentRequirement::class);
    }

    public function requirements()
    {
        return $this->hasManyThrough(
            Requirement::class,
            GapAssessmentRequirement::class,
            'gap_assessment_id',
            'id',
            'id',
            'requirement_id'
        );
    }

    // Gardé pour compatibilité
    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }
        public function answers()
    {
        return $this->hasMany(GapAssessmentAnswer::class);
    }
}