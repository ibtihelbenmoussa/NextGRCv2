<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GapAssessment extends Model
{
    protected $guarded = [];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'ml_result'  => 'array', 
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
        return $this->belongsToMany(
            Requirement::class,
            'gap_assessment_requirements',
            'gap_assessment_id',
            'requirement_id'
        );
    }

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }

    public function answers()
    {
        return $this->hasMany(GapAssessmentAnswer::class);
    }
    public function actionPlans()
{
    return $this->hasMany(ActionPlan::class, 'gap_id');
}
}