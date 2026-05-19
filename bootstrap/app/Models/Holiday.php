<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $fillable = ['date', 'name', 'organization_id'];
    protected $casts    = ['date' => 'date'];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}