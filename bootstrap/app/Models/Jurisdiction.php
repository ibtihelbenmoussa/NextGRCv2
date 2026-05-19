<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Jurisdiction extends Model
{
     use HasFactory;

    protected $fillable = [
        'name',
        'is_deleted',
        'organization_id',
    ];

    public function frameworks()
    {
        return $this->belongsToMany(Framework::class,'framework_jurisdiction')->withTimestamps();

    }
}
