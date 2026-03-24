<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequirementTest extends Model
{
    use HasFactory;

    /**
     * Tous les champs sont autorisés en mass assignment
     * (tu peux repasser à $fillable si tu veux plus de sécurité plus tard)
     */
    protected $guarded = [];

    /**
     * Casts pour conversion automatique des types
     */
    protected $casts = [
        'evidence'          => 'array',           // JSON → tableau PHP
        'test_date'         => 'date',            // DATE → instance Carbon/Date
        'validated_at'      => 'datetime',        // TIMESTAMP → instance Carbon
        'validation_status' => 'string',          // ENUM → string
        'created_at'        => 'datetime',
        'updated_at'        => 'datetime',
        'failure_reason'    => 'string', 
    ];

    // Relations
    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }

    public function user() // celui qui a créé / effectué le test
    {
        return $this->belongsTo(User::class);
    }

    public function framework()
    {
        return $this->belongsTo(Framework::class);
    }

    public function validator() // celui qui a validé ou refusé
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    // Accessor : libellé français pour le statut de validation
    public function getValidationLabelAttribute(): string
    {
        return match ($this->validation_status) {
            'pending'   => 'En attente',
            'accepted'  => 'Accepté',
            'rejected'  => 'Refusé',
            default     => 'Inconnu',
        };
    }

    // Accessor : booléen pratique pour vérifier si en attente
    public function getIsPendingValidationAttribute(): bool
    {
        return $this->validation_status === 'pending';
    }

    // Accessor : libellé français pour le statut du test
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'pending'         => 'En attente',
            'in_progress'     => 'En cours',
            'completed'       => 'Terminé',
            'compliant'       => 'Conforme',
            'non_compliant'   => 'Non conforme',
            'partial'         => 'Partiel',
            'na'              => 'N/A',
            default           => ucfirst($this->status),
        };
    }
}