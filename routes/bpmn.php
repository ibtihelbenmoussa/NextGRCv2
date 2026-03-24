<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BPMNDiagramController;

Route::middleware(['auth', 'verified'])->group(function () {
    // BPMN Diagrams CRUD
    Route::resource('bpmn-diagrams', BPMNDiagramController::class);

    Route::get('bpmn', [BPMNDiagramController::class, 'page'])->name('bpmn.index');
    Route::get('bpmn/test', function () {
        return inertia('bpmn/test');
    })->name('bpmn.test');
});
