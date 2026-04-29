<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GapAssessmentAnswer extends Model
{
    protected $fillable = [
        'gap_assessment_id',
        'gap_question_id',
        'answer',
        'note',
        'score',
        'maturity_level',
        'answered_at',
    ];

    protected $casts = [
        'answered_at' => 'datetime',
        'score' => 'float',
    ];

    public function assessment()
    {
        return $this->belongsTo(GapAssessment::class, 'gap_assessment_id');
    }

    public function question()
    {
        return $this->belongsTo(GapQuestion::class, 'gap_question_id');
    }
}