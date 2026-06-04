<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Domain extends Model
{
    protected $guarded = [];

    // Un domaine a plusieurs requirements
    public function requirements()
    {
        return $this->hasMany(Requirement::class);
    }
public function frameworks(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
{
    return $this->belongsToMany(
        Framework::class,
        'domain_framework',
        'domain_id',
        'framework_id'
    )->withTimestamps();
}
}