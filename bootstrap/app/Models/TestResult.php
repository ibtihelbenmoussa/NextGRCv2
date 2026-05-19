<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestResult extends Model
{
    protected $fillable = [
        'predefined_test_id',
        'requirement_id',
        'result',
        'comment',
    ];

    public function predefinedTest(): BelongsTo
    {
        return $this->belongsTo(PredefinedTest::class);
    }

    public function requirement(): BelongsTo
    {
        return $this->belongsTo(Requirement::class);
    }
}