<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Requirement;


class GapQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'requirement_id',
        'text',
        'dimension',
        'weight',
        'order'
    ];

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }
}
