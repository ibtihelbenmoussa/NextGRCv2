<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\FrameworkController;
use App\Http\Controllers\JurisdictionController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\ControleController;
use App\Http\Controllers\RequirementTestController;
use App\Http\Controllers\RequirementController;
use App\Http\Controllers\TestResultController;
use App\Http\Controllers\PredefinedTestRequirmentController;
use App\Http\Controllers\RequirementTestReservationController;
use App\Http\Controllers\GapAssessmentController;
use App\Http\Controllers\ActionPlanController;
use App\Http\Controllers\DocumentAnalysisController;
use App\Http\Controllers\DomainController;
use App\Http\Controllers\NotificationController;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('organizations.select.page');
    }
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // ── Organizations select (tout le monde) ──────────────
    Route::get('organizations/select', [App\Http\Controllers\OrganizationController::class, 'selectPage'])
        ->name('organizations.select.page');
    Route::post('organizations/{organization}/select', [App\Http\Controllers\OrganizationController::class, 'select'])
        ->name('organizations.select');

    // ── Notifications (tout le monde) ─────────────────────
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');

    // ── ML Chat (tout le monde) ───────────────────────────
    Route::post('/ml/chat', [App\Http\Controllers\MLChatController::class, 'chat']);

    // ─────────────────────────────────────────────────────
    // OVERVIEW — Manager + Audit Chief + Admin
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:overview.view')->group(function () {
        Route::get('overview', [App\Http\Controllers\OverviewController::class, 'index'])->name('overview.index');
    });

// ─────────────────────────────────────────────────────
// AUDIT UNIVERSE — business-units / macro-processes / processes
// ─────────────────────────────────────────────────────

// ── Business Units ────────────────────────────────────
Route::get('business-units/export', [App\Http\Controllers\BusinessUnitController::class, 'export'])
    ->middleware('permission:business-units.view')
    ->name('business-units.export');

Route::get('business-units/create', [App\Http\Controllers\BusinessUnitController::class, 'create'])
    ->middleware('permission:business-units.create')
    ->name('business-units.create');

Route::post('business-units', [App\Http\Controllers\BusinessUnitController::class, 'store'])
    ->middleware('permission:business-units.create')
    ->name('business-units.store');

Route::get('business-units', [App\Http\Controllers\BusinessUnitController::class, 'index'])
    ->middleware('permission:business-units.view')
    ->name('business-units.index');

Route::get('business-units/{business_unit}', [App\Http\Controllers\BusinessUnitController::class, 'show'])
    ->middleware('permission:business-units.view')
    ->name('business-units.show');

Route::get('business-units/{business_unit}/edit', [App\Http\Controllers\BusinessUnitController::class, 'edit'])
    ->middleware('permission:business-units.edit')
    ->name('business-units.edit');

Route::put('business-units/{business_unit}', [App\Http\Controllers\BusinessUnitController::class, 'update'])
    ->middleware('permission:business-units.edit')
    ->name('business-units.update');

Route::patch('business-units/{business_unit}', [App\Http\Controllers\BusinessUnitController::class, 'update'])
    ->middleware('permission:business-units.edit');

Route::delete('business-units/{business_unit}', [App\Http\Controllers\BusinessUnitController::class, 'destroy'])
    ->middleware('permission:business-units.delete')
    ->name('business-units.destroy');

// ── Macro Processes ───────────────────────────────────
Route::get('macro-processes/export', [App\Http\Controllers\MacroProcessController::class, 'export'])
    ->middleware('permission:business-units.view')
    ->name('macro-processes.export');

Route::get('macro-processes/create', [App\Http\Controllers\MacroProcessController::class, 'create'])
    ->middleware('permission:business-units.create')
    ->name('macro-processes.create');

Route::post('macro-processes', [App\Http\Controllers\MacroProcessController::class, 'store'])
    ->middleware('permission:business-units.create')
    ->name('macro-processes.store');

Route::get('macro-processes', [App\Http\Controllers\MacroProcessController::class, 'index'])
    ->middleware('permission:business-units.view')
    ->name('macro-processes.index');

Route::get('macro-processes/{macro_process}', [App\Http\Controllers\MacroProcessController::class, 'show'])
    ->middleware('permission:business-units.view')
    ->name('macro-processes.show');

Route::get('macro-processes/{macro_process}/edit', [App\Http\Controllers\MacroProcessController::class, 'edit'])
    ->middleware('permission:business-units.edit')
    ->name('macro-processes.edit');

Route::put('macro-processes/{macro_process}', [App\Http\Controllers\MacroProcessController::class, 'update'])
    ->middleware('permission:business-units.edit')
    ->name('macro-processes.update');

Route::patch('macro-processes/{macro_process}', [App\Http\Controllers\MacroProcessController::class, 'update'])
    ->middleware('permission:business-units.edit');

Route::delete('macro-processes/{macro_process}', [App\Http\Controllers\MacroProcessController::class, 'destroy'])
    ->middleware('permission:business-units.delete')
    ->name('macro-processes.destroy');

// ── Processes ─────────────────────────────────────────
Route::get('processes/export', [App\Http\Controllers\ProcessController::class, 'export'])
    ->middleware('permission:business-units.view')
    ->name('processes.export');

Route::get('processes/create', [App\Http\Controllers\ProcessController::class, 'create'])
    ->middleware('permission:business-units.create')
    ->name('processes.create');

Route::post('processes', [App\Http\Controllers\ProcessController::class, 'store'])
    ->middleware('permission:business-units.create')
    ->name('processes.store');

Route::get('processes', [App\Http\Controllers\ProcessController::class, 'index'])
    ->middleware('permission:business-units.view')
    ->name('processes.index');

Route::get('processes/{process}', [App\Http\Controllers\ProcessController::class, 'show'])
    ->middleware('permission:business-units.view')
    ->name('processes.show');

Route::get('processes/{process}/edit', [App\Http\Controllers\ProcessController::class, 'edit'])
    ->middleware('permission:business-units.edit')
    ->name('processes.edit');

Route::put('processes/{process}', [App\Http\Controllers\ProcessController::class, 'update'])
    ->middleware('permission:business-units.edit')
    ->name('processes.update');

Route::patch('processes/{process}', [App\Http\Controllers\ProcessController::class, 'update'])
    ->middleware('permission:business-units.edit');

Route::delete('processes/{process}', [App\Http\Controllers\ProcessController::class, 'destroy'])
    ->middleware('permission:business-units.delete')
    ->name('processes.destroy');
   // ─────────────────────────────────────────────────────
// FRAMEWORKS
// ─────────────────────────────────────────────────────
Route::get('frameworks/export', [FrameworkController::class, 'export'])
    ->middleware('permission:frameworks.view')
    ->name('frameworks.export');

Route::get('frameworks/create', [FrameworkController::class, 'create'])
    ->middleware('permission:frameworks.create')
    ->name('frameworks.create');

Route::post('frameworks', [FrameworkController::class, 'store'])
    ->middleware('permission:frameworks.create')
    ->name('frameworks.store');

Route::get('frameworks', [FrameworkController::class, 'index'])
    ->middleware('permission:frameworks.view')
    ->name('frameworks.index');

Route::get('frameworks/{framework}/documents/{document}/download', [FrameworkController::class, 'downloadDocument'])
    ->middleware('permission:frameworks.view')
    ->name('frameworks.documents.download');

Route::get('frameworks/{framework}/edit', [FrameworkController::class, 'edit'])
    ->middleware('permission:frameworks.update')
    ->name('frameworks.edit');

Route::put('frameworks/{framework}', [FrameworkController::class, 'update'])
    ->middleware('permission:frameworks.update')
    ->name('frameworks.update');

Route::get('frameworks/{framework}', [FrameworkController::class, 'show'])
    ->middleware('permission:frameworks.view');

Route::delete('frameworks/{framework}/documents/{document}', [FrameworkController::class, 'destroyDocument'])
    ->middleware('permission:frameworks.delete')
    ->name('frameworks.documents.destroy');

Route::delete('frameworks/{framework}', [FrameworkController::class, 'destroy'])
    ->middleware('permission:frameworks.delete')
    ->name('frameworks.destroy');

Route::middleware('permission:frameworks.create')->group(function () {
    Route::resource('jurisdictions', JurisdictionController::class)->only(['index', 'create', 'store', 'update', 'destroy']);
    Route::resource('tags', TagController::class)->only(['index', 'create', 'store', 'update', 'destroy']);
});

// ─────────────────────────────────────────────────────
// REQUIREMENTS
// ─────────────────────────────────────────────────────
Route::get('requirements/export', [RequirementController::class, 'export'])
    ->middleware('permission:requirements.view')
    ->name('requirements.export');

Route::get('requirements/frameworks/{framework}/processes', [RequirementController::class, 'getProcessesByFramework'])
    ->middleware('permission:requirements.view')
    ->name('requirements.processes-by-framework');

Route::get('req-testing', [RequirementController::class, 'getRequirementsForTesting'])
    ->middleware('permission:requirements.view')
    ->name('req-testing.index');

Route::get('requirements/create', [RequirementController::class, 'create'])
    ->middleware('permission:requirements.create')
    ->name('requirements.create');

Route::post('requirements', [RequirementController::class, 'store'])
    ->middleware('permission:requirements.create')
    ->name('requirements.store');

Route::get('requirements', [RequirementController::class, 'index'])
    ->middleware('permission:requirements.view')
    ->name('requirements.index');

Route::get('requirements/{requirement}/documents/{document}/download', [RequirementController::class, 'downloadDocument'])
    ->middleware('permission:requirements.view')
    ->name('requirements.documents.download');

Route::get('requirements/{requirement}/gap-questions', [RequirementController::class, 'getGapQuestions'])
    ->middleware('permission:requirements.view')
    ->name('requirements.gap-questions');

Route::get('requirements/{requirement}', [RequirementController::class, 'show'])
    ->middleware('permission:requirements.view')
    ->name('requirements.show');

Route::get('requirements/{requirement}/edit', [RequirementController::class, 'edit'])
    ->middleware('permission:requirements.update')
    ->name('requirements.edit');

Route::put('requirements/{requirement}', [RequirementController::class, 'update'])
    ->middleware('permission:requirements.update')
    ->name('requirements.update');

Route::delete('requirements/{requirement}/documents/{document}', [RequirementController::class, 'destroyDocument'])
    ->middleware('permission:requirements.delete')
    ->name('requirements.documents.destroy');

Route::delete('requirements/{requirement}', [RequirementController::class, 'destroy'])
    ->middleware('permission:requirements.delete')
    ->name('requirements.destroy');

Route::middleware('permission:requirements.create')->group(function () {
    Route::post('/domains', [DomainController::class, 'store'])
        ->name('domains.store');

    Route::post('/ai/analyze-document', [DocumentAnalysisController::class, 'analyze'])
        ->name('ai.analyze-document');

    Route::post('/ai/import-requirements', [DocumentAnalysisController::class, 'import'])
        ->name('ai.import-requirements');
});

Route::put('/domains/{domain}', [DomainController::class, 'update'])
    ->middleware('permission:requirements.update')
    ->name('domains.update');

Route::delete('/domains/{domain}', [DomainController::class, 'destroy'])
    ->middleware('permission:requirements.delete')
    ->name('domains.destroy');

    // ─────────────────────────────────────────────────────
    // TESTS
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:tests.view')->group(function () {
        Route::get('requirement-tests/export', [RequirementTestController::class, 'export'])->name('requirement-tests.export');
        Route::get('requirement-tests/validation', [RequirementTestController::class, 'validation'])->name('requirement-tests.validation');
        Route::resource('requirement-tests', RequirementTestController::class)->only(['index', 'show']);
        Route::get('requirement-tests/{requirementTest}', [RequirementTestController::class, 'show'])->name('requirement-tests.show');
    });

    Route::middleware('permission:tests.create')->group(function () {
        Route::get('requirements/{requirement}/test/create', [RequirementTestController::class, 'createForRequirement'])->name('requirements.test.create');
        Route::post('requirements/{requirement}/test', [RequirementTestController::class, 'storeForRequirement'])->name('requirements.test.store');
        Route::post('test-results', [TestResultController::class, 'store'])->name('test-results.store');
        Route::post('/requirement-test-reservations', [RequirementTestReservationController::class, 'store'])->name('requirement-test-reservations.store');
        Route::delete('/requirement-test-reservations', [RequirementTestReservationController::class, 'destroy'])->name('requirement-test-reservations.destroy');
    });

    Route::middleware('permission:tests.edit')->group(function () {
        Route::resource('requirement-tests', RequirementTestController::class)->only(['edit', 'update']);
    });

    Route::middleware('permission:tests.review')->group(function () {
        Route::patch('requirement-tests/{requirementTest}/accept', [RequirementTestController::class, 'accept'])->name('requirement-tests.accept');
        Route::patch('requirement-tests/{requirementTest}/reject', [RequirementTestController::class, 'reject'])->name('requirement-tests.reject');
    });

    Route::middleware('permission:tests.delete')->group(function () {
        Route::resource('requirement-tests', RequirementTestController::class)->only(['destroy']);
    });

    // ─────────────────────────────────────────────────────
    // GAP ASSESSMENTS
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:gap-assessments.view')->group(function () {
        Route::get('/gap-assessments/export', [GapAssessmentController::class, 'export'])->name('gap-assessments.export');
        Route::get('/gap-assessment', [GapAssessmentController::class, 'index'])->name('gap-assessment.index');
        Route::get('/gap-assessment/frameworks', [GapAssessmentController::class, 'getFrameworks'])->name('gap-assessment.frameworks');
        Route::get('/gap-assessments/{assessment}', [GapAssessmentController::class, 'show'])->name('gap-assessment.show');
        Route::get('/requirements/{id}/assessments', [GapAssessmentController::class, 'byRequirement'])->name('gap-assessment.by-requirement');
    });

    Route::middleware('permission:gap-assessments.create')->group(function () {
        Route::get('/gap-assessment/create', [GapAssessmentController::class, 'create'])->name('gap-assessment.create');
        Route::post('/gap-assessments', [GapAssessmentController::class, 'store'])->name('gap-assessment.store');
        Route::get('/gap-assessment/questions/{requirement}', [GapAssessmentController::class, 'getQuestions'])->name('gap-assessment.questions');
        Route::post('/gap-assessment/questions/{requirement}', [GapAssessmentController::class, 'storeQuestion'])->name('gap-assessment.questions.store');
        Route::get('/gap-assessments/{assessment}/answer', [GapAssessmentController::class, 'answerQuestions'])->name('gap-assessment.answer');
        Route::post('/gap-assessments/{assessment}/answers', [GapAssessmentController::class, 'storeAnswers'])->name('gap-assessment.answers.store');
        Route::post('/gap-assessments/{assessment}/ai-feedback', [GapAssessmentController::class, 'generateAiFeedback'])->name('gap-assessment.ai-feedback');
        Route::post('/ai/gap-analysis', [GapAssessmentController::class, 'generateAiAnalysis']);
        Route::post('/api/ml/predict', [GapAssessmentController::class, 'mlPredict']);
        Route::post('/api/ml/analyze', [GapAssessmentController::class, 'mlAnalyze']);
    });

    Route::middleware('permission:gap-assessments.update')->group(function () {
        Route::get('/gap-assessments/{assessment}/edit', [GapAssessmentController::class, 'edit'])->name('gap-assessment.edit');
        Route::put('/gap-assessments/{assessment}', [GapAssessmentController::class, 'update'])->name('gap-assessment.update');
        Route::put('/gap-assessment/questions/{question}', [GapAssessmentController::class, 'updateQuestion'])->name('gap-assessment.questions.update');
    });

    Route::middleware('permission:gap-assessments.delete')->group(function () {
        Route::delete('/gap-assessments/{assessment}', [GapAssessmentController::class, 'destroy'])->name('gap-assessment.destroy');
        Route::delete('/gap-assessment/questions/{question}', [GapAssessmentController::class, 'destroyQuestion'])->name('gap-assessment.questions.destroy');
    });

    // ─────────────────────────────────────────────────────
    // GAP RESULTS
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:gap-results.view')->group(function () {
        Route::get('/gap-assessments/{assessment}/results', [GapAssessmentController::class, 'resultsPage'])->name('gap-assessments.results');
    });

    // ─────────────────────────────────────────────────────
    // ACTION PLANS
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:action-plans.view')->group(function () {
        Route::get('/action-plans', [ActionPlanController::class, 'index'])->name('action-plans.index');
        Route::get('/action-plans/{actionPlan}/logs', [ActionPlanController::class, 'logs']);
        Route::get('/gap-assessments/{gapAssessment}/action-plans', [ActionPlanController::class, 'getByAssessment'])->name('action-plans.by-assessment');
    });

    Route::middleware('permission:action-plans.update')->group(function () {
        Route::patch('/action-plans/{actionPlan}', [ActionPlanController::class, 'update'])->name('action-plans.update');
    });

    // ─────────────────────────────────────────────────────
    // DOCUMENTS
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:documents.view')->group(function () {
        Route::get('documents/{document}/download', [App\Http\Controllers\DocumentController::class, 'download'])->name('documents.download');
    });

    Route::middleware('permission:documents.delete')->group(function () {
        Route::delete('documents/{document}', [App\Http\Controllers\DocumentController::class, 'destroy'])->name('documents.destroy');
    });

    // ─────────────────────────────────────────────────────
    // RISKS — Admin + Audit Chief + Manager (view)
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:risks.view')->group(function () {
        Route::get('risks/export', [App\Http\Controllers\RiskController::class, 'export'])->name('risks.export');
        Route::get('risks/matrix', [App\Http\Controllers\RiskController::class, 'matrix'])->name('risks.matrix');
        Route::get('risks/{risk}/history', [App\Http\Controllers\RiskController::class, 'RiskHistory'])->name('risks.history');
        Route::get('/risks/{risk}/kris', [App\Http\Controllers\KriController::class, 'KriByRisk'])->name('risks.kris');
        Route::resource('risks', App\Http\Controllers\RiskController::class)->only(['index', 'show']);
        Route::get('risk-categories/export', [App\Http\Controllers\RiskCategoryController::class, 'export'])->name('risk-categories.export');
        Route::get('risk-categories/tree', [App\Http\Controllers\RiskCategoryController::class, 'tree'])->name('risk-categories.tree');
        Route::resource('risk-categories', App\Http\Controllers\RiskCategoryController::class)->only(['index', 'show']);
        Route::get('risk-configurations', [App\Http\Controllers\RiskConfigurationController::class, 'index'])->name('risk-configurations.index');
        Route::get('risk-configurations/{riskConfiguration}', [App\Http\Controllers\RiskConfigurationController::class, 'show'])->name('risk-configurations.show');
    });

    Route::middleware('permission:risks.create')->group(function () {
        Route::resource('risks', App\Http\Controllers\RiskController::class)->only(['create', 'store']);
        Route::post('/kri-measures', [App\Http\Controllers\KriController::class, 'store'])->name('risks.kris.store');
        Route::resource('risk-categories', App\Http\Controllers\RiskCategoryController::class)->only(['create', 'store']);
        Route::get('risk-configurations/create', [App\Http\Controllers\RiskConfigurationController::class, 'create'])->name('risk-configurations.create');
        Route::post('risk-configurations', [App\Http\Controllers\RiskConfigurationController::class, 'store'])->name('risk-configurations.store');
    });

    Route::middleware('permission:risks.edit')->group(function () {
        Route::resource('risks', App\Http\Controllers\RiskController::class)->only(['edit', 'update']);
        Route::put('risk/{id}', [App\Http\Controllers\RiskController::class, 'update'])->name('risk.update');
        Route::resource('risk-categories', App\Http\Controllers\RiskCategoryController::class)->only(['edit', 'update']);
        Route::get('risk-configurations/{riskConfiguration}/edit', [App\Http\Controllers\RiskConfigurationController::class, 'edit'])->name('risk-configurations.edit');
        Route::put('risk-configurations/{riskConfiguration}', [App\Http\Controllers\RiskConfigurationController::class, 'update'])->name('risk-configurations.update');
        Route::post('risk-configurations/calculate-risk-score', [App\Http\Controllers\RiskConfigurationController::class, 'calculateRiskScore'])->name('risk-configurations.calculate-risk-score');
    });

    Route::middleware('permission:risks.delete')->group(function () {
        Route::resource('risks', App\Http\Controllers\RiskController::class)->only(['destroy']);
        Route::resource('risk-categories', App\Http\Controllers\RiskCategoryController::class)->only(['destroy']);
        Route::delete('risk-configurations/{riskConfiguration}', [App\Http\Controllers\RiskConfigurationController::class, 'destroy'])->name('risk-configurations.destroy');
    });

    // ─────────────────────────────────────────────────────
    // CONTROLS
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:controls.view')->group(function () {
        Route::get('controls/export', [ControleController::class, 'export'])->name('controls.export');
        Route::get('controls', [ControleController::class, 'index'])->name('controls.index');
        Route::get('controls/{control}', [ControleController::class, 'show'])->name('controls.show');
        Route::get('controls/settings', [App\Http\Controllers\ControlSettingsController::class, 'index'])->name('controls.settings.index');
    });

    Route::middleware('permission:controls.create')->group(function () {
        Route::get('controls/create', [ControleController::class, 'create'])->name('controls.create');
        Route::post('controls', [ControleController::class, 'store'])->name('controls.store');
        Route::post('controls/settings/store', [App\Http\Controllers\ControlSettingsController::class, 'store'])->name('controls.settings.store');
    });

    Route::middleware('permission:controls.edit')->group(function () {
        Route::get('controls/{control}/edit', [ControleController::class, 'edit'])->name('controls.edit');
        Route::put('controls/{control}', [ControleController::class, 'update'])->name('controls.update');
    });

    Route::middleware('permission:controls.delete')->group(function () {
        Route::delete('controls/{control}', [ControleController::class, 'destroy'])->name('controls.destroy');
    });

    // ─────────────────────────────────────────────────────
    // PLANNINGS
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:plannings.view')->group(function () {
        Route::get('plannings', [App\Http\Controllers\PlannigController::class, 'index'])->name('plannings.index');
        Route::get('planning/{planning}', [App\Http\Controllers\PlannigController::class, 'show'])->name('planning.show');
        Route::get('plan/export', [App\Http\Controllers\PlannigController::class, 'export'])->name('planning.export');
    });

    Route::middleware('permission:plannings.create')->group(function () {
        Route::get('planning/create', [App\Http\Controllers\PlannigController::class, 'create'])->name('planning.create');
        Route::post('planning', [App\Http\Controllers\PlannigController::class, 'store'])->name('planning.store');
    });

    Route::middleware('permission:plannings.edit')->group(function () {
        Route::get('planning/{planning}/edit', [App\Http\Controllers\PlannigController::class, 'edit'])->name('planning.edit');
        Route::put('planning/{planning}', [App\Http\Controllers\PlannigController::class, 'update'])->name('planning.update');
    });

    Route::middleware('permission:plannings.delete')->group(function () {
        Route::delete('planning/{planning}', [App\Http\Controllers\PlannigController::class, 'destroy'])->name('planning.destroy');
    });

    // ─────────────────────────────────────────────────────
    // PREDEFINED TESTS
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:tests.view')->group(function () {
        Route::get('predefined-tests', [App\Http\Controllers\PredefindTestController::class, 'index'])->name('PredefindTest.index');
        Route::get('predefined/export', [App\Http\Controllers\PredefindTestController::class, 'export'])->name('predefined-tests.export');
        Route::get('predefined-tests/export', [PredefinedTestRequirmentController::class, 'export'])->name('predefinedTestReq.export');
        Route::get('predefined-tests/requirement', [PredefinedTestRequirmentController::class, 'index'])->name('predefinedTestReq.index');
        Route::get('requirements/{requirement}/predefined-tests/requirement', [PredefinedTestRequirmentController::class, 'forRequirement'])->name('predefinedTestReq.forRequirement');
        Route::get('predefined-tests/{predefined_test}', [App\Http\Controllers\PredefindTestController::class, 'show'])->name('predefined-tests.show');
    });

    Route::middleware('permission:tests.create')->group(function () {
        Route::get('predefined-tests/create', [App\Http\Controllers\PredefindTestController::class, 'create'])->name('predefined-tests.create');
        Route::post('predefined-tests', [App\Http\Controllers\PredefindTestController::class, 'store'])->name('predefined-tests.store');
        Route::get('predefined-tests/requirement/create', [PredefinedTestRequirmentController::class, 'create'])->name('predefinedTestReq.create');
        Route::post('predefined-tests/requirement', [PredefinedTestRequirmentController::class, 'store'])->name('predefinedTestReq.store');
    });

    Route::middleware('permission:tests.edit')->group(function () {
        Route::get('predefined-tests/{predefined_test}/edit', [App\Http\Controllers\PredefindTestController::class, 'edit'])->name('predefined-tests.edit');
        Route::put('predefined-tests/{predefined_test}', [App\Http\Controllers\PredefindTestController::class, 'update'])->name('predefined-tests.update');
        Route::get('predefined-tests/requirement/{predefinedTest}/edit', [PredefinedTestRequirmentController::class, 'edit'])->name('predefinedTestReq.edit');
        Route::put('predefined-tests/requirement/{predefinedTest}', [PredefinedTestRequirmentController::class, 'update'])->name('predefinedTestReq.update');
    });

    Route::middleware('permission:tests.delete')->group(function () {
        Route::delete('predefined-tests/{predefined_test}', [App\Http\Controllers\PredefindTestController::class, 'destroy'])->name('predefined-tests.destroy');
        Route::delete('predefined-tests/requirement/{predefinedTest}', [PredefinedTestRequirmentController::class, 'destroy'])->name('predefinedTestReq.destroy');
    });

    // ─────────────────────────────────────────────────────
    // USERS — Admin only
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:users.view')->group(function () {
        Route::get('users/export', [App\Http\Controllers\UserController::class, 'export'])->name('users.export');
        Route::resource('users', App\Http\Controllers\UserController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:users.create')->group(function () {
        Route::resource('users', App\Http\Controllers\UserController::class)->only(['create', 'store']);
    });

    Route::middleware('permission:users.edit')->group(function () {
        Route::resource('users', App\Http\Controllers\UserController::class)->only(['edit', 'update']);
    });

    Route::middleware('permission:users.delete')->group(function () {
        Route::resource('users', App\Http\Controllers\UserController::class)->only(['destroy']);
    });

    Route::middleware('permission:users.assign-roles')->group(function () {
        Route::post('organizations/{organization}/users', [App\Http\Controllers\OrganizationController::class, 'addUser'])->name('organizations.users.add');
        Route::delete('organizations/{organization}/users/{user}', [App\Http\Controllers\OrganizationController::class, 'removeUser'])->name('organizations.users.remove');
        Route::patch('organizations/{organization}/users/{user}/role', [App\Http\Controllers\OrganizationController::class, 'updateUserRole'])->name('organizations.users.update-role');
    });

    // ─────────────────────────────────────────────────────
    // ORGANIZATIONS — Admin only
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:organizations.view')->group(function () {
        Route::get('organizations/export', [App\Http\Controllers\OrganizationController::class, 'export'])->name('organizations.export');
        Route::resource('organizations', App\Http\Controllers\OrganizationController::class)->only(['index', 'show']);
    });

    Route::middleware('permission:organizations.edit')->group(function () {
        Route::resource('organizations', App\Http\Controllers\OrganizationController::class)->only(['edit', 'update', 'create', 'store', 'destroy']);
    });

    // ─────────────────────────────────────────────────────
    // ROLES & PERMISSIONS — Admin only
    // ─────────────────────────────────────────────────────
    Route::middleware('permission:roles.view')->group(function () {
        Route::resource('roles', App\Http\Controllers\RoleController::class)->only(['index', 'show']);
        Route::resource('permissions', App\Http\Controllers\PermissionController::class)->only(['index']);
    });

    Route::middleware('permission:roles.create')->group(function () {
        Route::resource('roles', App\Http\Controllers\RoleController::class)->only(['create', 'store']);
        Route::resource('permissions', App\Http\Controllers\PermissionController::class)->only(['create', 'store']);
    });

    Route::middleware('permission:roles.edit')->group(function () {
        Route::resource('roles', App\Http\Controllers\RoleController::class)->only(['edit', 'update']);
    });

    Route::middleware('permission:roles.delete')->group(function () {
        Route::resource('roles', App\Http\Controllers\RoleController::class)->only(['destroy']);
        Route::resource('permissions', App\Http\Controllers\PermissionController::class)->only(['destroy']);
    });

    // ─────────────────────────────────────────────────────
    // ADMIN SETTINGS — Admin only
    // ─────────────────────────────────────────────────────
    Route::middleware('role:Admin')->group(function () {
        Route::prefix('admin-settings')->name('admin-settings.')->group(function () {
            Route::get('/', function () {
                return Inertia::render('admin-settings-general/index');
            })->name('index');
        });
    });

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/bpmn.php';