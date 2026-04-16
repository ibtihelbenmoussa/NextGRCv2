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
     public function actionPlans(): HasMany
    {
        return $this->hasMany(ActionPlan::class, 'gap_id');
    }
}
