<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Base controller for handling document uploads, downloads, and deletion
 * for any model that uses the HasDocuments trait.
 */
class DocumentController extends Controller
{
    /**
     * Upload a document to a documentable entity.
     *
     * @param Request $request
     * @param Model $documentable The model instance (BusinessUnit, MacroProcess, or Process)
     * @return JsonResponse
     */
    public function store(Request $request, Model $documentable): JsonResponse
    {
        $request->validate([
            'document' => 'required|file|max:10240', // 10MB max
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        // Authorization check - customize based on your policies
        // $this->authorize('manageDocuments', $documentable);

        try {
            $document = $documentable->addDocument(
                $request->file('document'),
                $request->only(['category', 'description'])
            );

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'document' => [
                    'id' => $document->id,
                    'name' => $document->name,
                    'file_size' => $document->human_file_size,
                    'mime_type' => $document->mime_type,
                    'category' => $document->category,
                    'description' => $document->description,
                    'uploaded_at' => $document->created_at->format('Y-m-d H:i:s'),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download a document.
     *
     * @param Document $document
     * @return StreamedResponse
     */
    public function download(Document $document): StreamedResponse
    {
        // Authorization check - customize based on your policies
        // $this->authorize('view', $document->documentable);

        return Storage::disk($document->disk)->download(
            $document->file_path,
            $document->name
        );
    }

    /**
     * Get a temporary URL for a document (useful for private S3 buckets).
     *
     * @param Document $document
     * @return JsonResponse
     */
    public function temporaryUrl(Document $document): JsonResponse
    {
        // Authorization check - customize based on your policies
        // $this->authorize('view', $document->documentable);

        try {
            $url = $document->getTemporaryUrl(60); // Valid for 60 minutes

            return response()->json([
                'success' => true,
                'url' => $url,
                'expires_in' => 60, // minutes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate temporary URL',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update document metadata.
     *
     * @param Request $request
     * @param Document $document
     * @return JsonResponse
     */
    public function update(Request $request, Document $document): JsonResponse
    {
        // Authorization check - customize based on your policies
        // $this->authorize('update', $document->documentable);

        $request->validate([
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $document->update($request->only(['category', 'description']));

        return response()->json([
            'success' => true,
            'message' => 'Document updated successfully',
            'document' => $document,
        ]);
    }

    /**
     * Delete a document (soft delete).
     *
     * @param Request $request
     * @param Document $document
     * @return JsonResponse|\Illuminate\Http\RedirectResponse
     */
    public function destroy(Request $request, Document $document)
    {
        // Authorization check - customize based on your policies
        // $this->authorize('delete', $document->documentable);

        $document->delete();

        // If request expects JSON (API call), return JSON
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully',
            ]);
        }

        // Otherwise redirect back (for Inertia forms)
        return back()->with('success', 'Document deleted successfully.');
    }

    /**
     * Permanently delete a document (removes file from storage).
     *
     * @param Document $document
     * @return JsonResponse
     */
    public function forceDestroy(Document $document): JsonResponse
    {
        // Authorization check - customize based on your policies
        // $this->authorize('forceDelete', $document->documentable);

        $document->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Document permanently deleted',
        ]);
    }

    /**
     * List all documents for a documentable entity.
     *
     * @param Model $documentable
     * @return JsonResponse
     */
    public function index(Model $documentable): JsonResponse
    {
        // Authorization check - customize based on your policies
        // $this->authorize('viewDocuments', $documentable);

        $documents = $documentable->documents()
            ->with('uploadedBy:id,name,email')
            ->latest()
            ->get()
            ->map(function ($document) {
                return [
                    'id' => $document->id,
                    'name' => $document->name,
                    'file_size' => $document->human_file_size,
                    'mime_type' => $document->mime_type,
                    'category' => $document->category,
                    'description' => $document->description,
                    'uploaded_by' => $document->uploadedBy?->name,
                    'uploaded_at' => $document->created_at->format('Y-m-d H:i:s'),
                    'is_image' => $document->isImage(),
                    'is_pdf' => $document->isPdf(),
                ];
            });

        return response()->json([
            'success' => true,
            'documents' => $documents,
            'total_size' => $documentable->getTotalDocumentsSize(),
        ]);
    }
}
