<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Document;


class Framework extends Model
{
     use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'release_date' => 'date',
       
        'effective_date' => 'date',
        'retired_date' => 'date',
    ];


public function jurisdictions()
    {
        return $this->belongsToMany(
            Jurisdiction::class,
            'framework_jurisdiction',
            'framework_id',
            'jurisdiction_id'
        )->withTimestamps();
    }

    public function tags()
    {
        return $this->belongsToMany(
            Tag::class,
            'tags_framework',
            'framework_id',
            'tag_id'
        )->withTimestamps();
    }
    // Ajouter dans Framework.php

public function processes()
{
    return $this->belongsToMany(
        \App\Models\Process::class,
        'framework_process',
        'framework_id',
        'process_id'
    )->withTimestamps();
}
public function documents()
{
    return $this->morphMany(Document::class, 'documentable');
}
}








