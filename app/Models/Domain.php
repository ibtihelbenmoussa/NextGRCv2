<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Domain extends Model
{
    protected $guarded = [];

    // Un domaine a plusieurs requirements
    public function requirements()
    {
        return $this->hasMany(Requirement::class);
    }
}