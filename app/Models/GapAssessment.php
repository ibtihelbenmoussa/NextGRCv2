<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Requirement;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GapAssessment extends Model
{
    protected $fillable = [
        'requirement_id',
        'score',
        'maturity_level',
        'answers',
        'ai_feedback'
    ];

    protected $casts = [
        'answers' => 'array',
    ];

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }
}
