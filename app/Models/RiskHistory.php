<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiskHistory extends Model
{
protected $fillable = [
        'risk_id',
        'control_id',
        'inhImpact',
        'inhProbability',
        'resImpact',
        'resProbability',
        'type',
        'score',
         'changed_by'
    ];

}
