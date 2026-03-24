<?php

/**
 * Example routes for document management
 * 
 * Add these routes to your routes/web.php or create a separate routes/documents.php file
 */

use App\Http\Controllers\DocumentController;
use App\Models\BusinessUnit;
use App\Models\MacroProcess;
use App\Models\Process;
use Illuminate\Support\Facades\Route;

// Business Unit Documents
Route::prefix('business-units/{businessUnit}')->name('business-units.')->group(function () {
    Route::get('documents', [DocumentController::class, 'index'])
        ->name('documents.index');

    Route::post('documents', function ($businessUnit) {
        $businessUnit = BusinessUnit::findOrFail($businessUnit);
        return app(DocumentController::class)->store(request(), $businessUnit);
    })->name('documents.store');
});

// Macro Process Documents
Route::prefix('macro-processes/{macroProcess}')->name('macro-processes.')->group(function () {
    Route::get('documents', [DocumentController::class, 'index'])
        ->name('documents.index');

    Route::post('documents', function ($macroProcess) {
        $macroProcess = MacroProcess::findOrFail($macroProcess);
        return app(DocumentController::class)->store(request(), $macroProcess);
    })->name('documents.store');
});

// Process Documents
Route::prefix('processes/{process}')->name('processes.')->group(function () {
    Route::get('documents', [DocumentController::class, 'index'])
        ->name('documents.index');

    Route::post('documents', function ($process) {
        $process = Process::findOrFail($process);
        return app(DocumentController::class)->store(request(), $process);
    })->name('documents.store');
});

// Document Management (same for all entity types)
Route::prefix('documents/{document}')->name('documents.')->group(function () {
    Route::get('download', [DocumentController::class, 'download'])
        ->name('download');

    Route::get('temporary-url', [DocumentController::class, 'temporaryUrl'])
        ->name('temporary-url');

    Route::patch('/', [DocumentController::class, 'update'])
        ->name('update');

    Route::delete('/', [DocumentController::class, 'destroy'])
        ->name('destroy');

    Route::delete('force', [DocumentController::class, 'forceDestroy'])
        ->name('force-destroy');
});

/**
 * Example API Endpoints:
 * 
 * Upload document to business unit:
 * POST /business-units/1/documents
 * Body: multipart/form-data with 'document' file, 'category', 'description'
 * 
 * List business unit documents:
 * GET /business-units/1/documents
 * 
 * Download document:
 * GET /documents/5/download
 * 
 * Get temporary URL:
 * GET /documents/5/temporary-url
 * 
 * Update document metadata:
 * PATCH /documents/5
 * Body: { "category": "policy", "description": "Updated description" }
 * 
 * Soft delete document:
 * DELETE /documents/5
 * 
 * Permanently delete document:
 * DELETE /documents/5/force
 */
