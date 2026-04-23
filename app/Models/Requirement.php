<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\Document;
use App\Models\gapQuestions;




class Requirement extends Model
{
    use HasFactory;
    protected $guarded = [];



    protected $casts = [
        'effective_date'        => 'date',
        'completion_date' => 'date',
        'auto_validate'   => 'boolean',
    ];

    public function framework()
    {
        return $this->belongsTo(Framework::class);
    }

   public function processes(): BelongsToMany
{
    return $this->belongsToMany(Process::class, 'process_requirement')
        ->withTimestamps();
}

    public function tests()
    {
        return $this->hasMany(RequirementTest::class);
    }

     public function tags()
    {
        return $this->belongsToMany(
            Tag::class,
            'tags_requirments',
            'requirment_id',
            'tags_id'
        )->withTimestamps();
    } 
/*     public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'tags_requirments')
            ->withTimestamps();
    } */

    public function predefinedTests(): HasMany
    {
        return $this->hasMany(PredefinedTestRequirment::class);
    }

    public function reservations(): HasMany
{
    return $this->hasMany(RequirementTestReservation::class);
}

public function activeReservation(?string $date = null): HasOne
{
    return $this->hasOne(RequirementTestReservation::class)
                ->where('date', $date ?? today()->toDateString());
}

public function documents()
{
    return $this->morphMany(Document::class, 'documentable');
}
public function gapAssessments()
{
    return $this->hasMany(GapAssessment::class);
}
public function gapQuestions()
{
    return $this->hasMany(GapQuestion::class);
}
}