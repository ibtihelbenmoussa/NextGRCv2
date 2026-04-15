<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Requirement;

class GapAssessment extends Model
{
    protected $fillable = [
        'requirement_id',
        'current_state',
        'expected_state',
        'gap_description',
        'compliance_level',
        'score',
        'recommendation'
    ];

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }
}
