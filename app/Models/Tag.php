<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;


class Tag extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'is_deleted',
        'organization_id',
    ];
    public function framework()
    {
        return $this->belongsToMany(
            Tag::class,
            'tags_framework',
            'framework_id',
            'tag_id'
        )->withTimestamps();
    }

    public function requirments()
    {
        return $this->belongsToMany(
            Requirement::class,
            'tags_requirments',
            'requirment_id',
            'tags_id'
        )->withTimestamps();
    }
    /*  public function requirments(): BelongsToMany
        {
            return $this->belongsToMany(Requirement::class, 'tags_requirments')
                ->withTimestamps();
        } */

}
