<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GapAssessmentRequirement extends Model
{
    protected $guarded = [];

    public function gapAssessment()
    {
        return $this->belongsTo(GapAssessment::class);
    }

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }
}