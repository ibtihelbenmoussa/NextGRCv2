<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Mesure extends Model
{
    use SoftDeletes;
     protected $fillable = [
        'created_by',
        'date',
        'value',
        'kri_id'
    ];

      public function kri()
    {
        return $this->belongsTo(KRI::class);
    }

   public function user()
{
    return $this->belongsTo(User::class, 'created_by');
}
}
