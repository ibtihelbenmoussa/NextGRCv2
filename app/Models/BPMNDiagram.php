<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BPMNDiagram extends Model
{
    use SoftDeletes;

    protected $table = 'bpmn_diagrams';

    protected $fillable = [
        'name',
        'bpmn_xml',
        'description',
        'uploaded_by',
        'diagramable_id',
        'diagramable_type',
    ];

    /**
     * Get the parent diagramable model (process or macro process).
     */
    public function diagramable()
    {
        return $this->morphTo();
    }

    /**
     * Uploader (user)
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
