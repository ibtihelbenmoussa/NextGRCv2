<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;


class Requirement extends Model
{
    use HasFactory;
    protected $guarded = [];



    protected $casts = [
        'deadline'        => 'date',
        'completion_date' => 'date',
        'auto_validate'   => 'boolean',
    ];

    public function framework()
    {
        return $this->belongsTo(Framework::class);
    }

    public function process()
    {
        return $this->belongsTo(Process::class);
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
}