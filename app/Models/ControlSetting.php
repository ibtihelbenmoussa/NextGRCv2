<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ControlSetting extends Model
{
    protected $casts = [
        'impact' => 'integer',
        'probability' => 'integer',
    ];
protected $fillable = [
       'organization_id',
    'risk_level',
    'effectiveness',
    'impact',
    'probability',
    'score',
];
protected static function boot()
{
    parent::boot();

    static::saving(function ($model) {
        $model->score = $model->impact * $model->probability;
    });
}
}
