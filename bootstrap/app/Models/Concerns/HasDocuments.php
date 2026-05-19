<?php

namespace App\Models\Concerns;

use App\Models\Document;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait HasDocuments
{
    /**
     * Get all documents for the model.
     */
    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    /**
     * Upload and attach a document to the model.
     *
     * @param UploadedFile $file
     * @param array $attributes Additional attributes (category, description, etc.)
     * @param string|null $disk Storage disk to use
     * @return Document
     */
    public function addDocument(
        UploadedFile $file,
        array $attributes = [],
        ?string $disk = null
    ): Document {
        $disk = $disk ?? config('filesystems.default');

        // Generate unique filename
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $fileName = Str::uuid() . '.' . $extension;

        // Determine storage path based on model type
        $modelType = class_basename($this);
        $path = "documents/{$modelType}/{$this->id}";

        // Store the file
        $filePath = $file->storeAs($path, $fileName, $disk);

        // Create document record
        return $this->documents()->create([
            'name' => $originalName,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'disk' => $disk,
            'uploaded_by' => auth()->id(),
            ...$attributes, // Spread additional attributes (category, description)
        ]);
    }

    /**
     * Get documents by category.
     *
     * @param string $category
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getDocumentsByCategory(string $category)
    {
        return $this->documents()->where('category', $category)->get();
    }

    /**
     * Check if the model has documents.
     */
    public function hasDocuments(): bool
    {
        return $this->documents()->exists();
    }

    /**
     * Get the total size of all documents in bytes.
     */
    public function getTotalDocumentsSize(): int
    {
        return $this->documents()->sum('file_size');
    }

    /**
     * Delete all documents associated with the model.
     */
    public function deleteAllDocuments(): void
    {
        $this->documents()->each(function (Document $document) {
            $document->forceDelete(); // This will trigger file deletion
        });
    }
}
