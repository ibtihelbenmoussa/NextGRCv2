<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PredefinedTestRequirment extends Model
{
    protected $table = 'predefined_tests_requirments';

    protected $fillable = [
        'requirement_id',
        'test_code',
        'test_name',
        'objective',
        'procedure',
    ];

    public function requirement(): BelongsTo
    {
        return $this->belongsTo(Requirement::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(TestResult::class);
    }
}