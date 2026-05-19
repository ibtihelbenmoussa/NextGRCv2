<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
class KRI extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'owner_id',
        'name',
        'description',
        'threshold',
        'status'

    ];


public function risks(): HasMany
{
    return $this->hasMany(Risk::class, 'kri_id');
}
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class,'owner_id');
    }
    public function measures()
{
    return $this->hasMany(Mesure::class);
}
}
