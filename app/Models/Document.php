<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'documentable_id',
        'documentable_type',
        'name',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'disk',
        'category',
        'description',
        'uploaded_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    protected $appends = [
        'url',
    ];

    /**
     * Get the parent documentable model (BusinessUnit, MacroProcess, or Process).
     */
    public function documentable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user who uploaded the document.
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the full storage path of the document.
     */
    public function getFullPathAttribute(): string
    {
        return Storage::disk($this->disk)->path($this->file_path);
    }

    /**
     * Get the public URL of the document.
     */
    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->file_path);
    }

    /**
     * Get the temporary download URL (for private disks like S3).
     */
    public function getTemporaryUrl(int $minutes = 60): string
    {
        return Storage::disk($this->disk)->temporaryUrl(
            $this->file_path,
            now()->addMinutes($minutes)
        );
    }

    /**
     * Get human-readable file size.
     */
    public function getHumanFileSizeAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if the document is an image.
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if the document is a PDF.
     */
    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    /**
     * Delete the physical file when the model is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (Document $document) {
            // Only delete the file if it's a force delete (not soft delete)
            if ($document->isForceDeleting()) {
                Storage::disk($document->disk)->delete($document->file_path);
            }
        });
    }
}
