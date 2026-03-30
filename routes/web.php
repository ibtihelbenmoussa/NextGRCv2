<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\FrameworkController;
use App\Http\Controllers\JurisdictionController;
use App\Exports\FrameworksExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Http\Controllers\TagController;
use App\Http\Controllers\ControleController;
use App\Http\Controllers\RequirementTestController;
use App\Http\Controllers\RequirementController;
use App\Http\Controllers\TestResultController;
use App\Http\Controllers\PredefinedTestRequirmentController;
use App\Http\Controllers\RequirementTestReservationController;


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

    // Audit Universe
    Route::get('overview', [App\Http\Controllers\OverviewController::class, 'index'])->name('overview.index');
    Route::get('business-units/export', [App\Http\Controllers\BusinessUnitController::class, 'export'])->name('business-units.export');
    Route::resource('business-units', App\Http\Controllers\BusinessUnitController::class);
    Route::get('macro-processes/export', [App\Http\Controllers\MacroProcessController::class, 'export'])->name('macro-processes.export');
    Route::resource('macro-processes', App\Http\Controllers\MacroProcessController::class);
    Route::get('processes/export', [App\Http\Controllers\ProcessController::class, 'export'])->name('processes.export');
    Route::resource('processes', App\Http\Controllers\ProcessController::class);

    // Documents
    Route::get('documents/{document}/download', [App\Http\Controllers\DocumentController::class, 'download'])->name('documents.download');
    Route::delete('documents/{document}', [App\Http\Controllers\DocumentController::class, 'destroy'])->name('documents.destroy');

    // Risk Categories
    Route::get('risk-categories/export', [App\Http\Controllers\RiskCategoryController::class, 'export'])->name('risk-categories.export');
    Route::get('risk-categories/tree', [App\Http\Controllers\RiskCategoryController::class, 'tree'])->name('risk-categories.tree');
    Route::resource('risk-categories', App\Http\Controllers\RiskCategoryController::class);

    // Risks
    Route::get('risks/export', [App\Http\Controllers\RiskController::class, 'export'])->name('risks.export');
    Route::get('risks/matrix', [App\Http\Controllers\RiskController::class, 'matrix'])->name('risks.matrix');
    Route::get('risks/{risk}/history', [App\Http\Controllers\RiskController::class, 'RiskHistory'])->name('risks.history');
    Route::get('/risks/{risk}/kris', [App\Http\Controllers\KriController::class, 'KriByRisk'])->name('risks.kris');
    Route::post('/kri-measures', [App\Http\Controllers\KriController::class, 'store'])->name('risks.kris.store');
    Route::resource('risks', App\Http\Controllers\RiskController::class);
    Route::put('risk/{id}', [App\Http\Controllers\RiskController::class, 'update'])->name('risk.update');

    // Risk Configuration
    Route::prefix('risk-configurations')->name('risk-configurations.')->group(function () {
        Route::get('/', [App\Http\Controllers\RiskConfigurationController::class, 'index'])->name('index');
        Route::get('/create', [App\Http\Controllers\RiskConfigurationController::class, 'create'])->name('create');
        Route::post('/', [App\Http\Controllers\RiskConfigurationController::class, 'store'])->name('store');
        Route::get('/{riskConfiguration}', [App\Http\Controllers\RiskConfigurationController::class, 'show'])->name('show');
        Route::get('/{riskConfiguration}/edit', [App\Http\Controllers\RiskConfigurationController::class, 'edit'])->name('edit');
        Route::put('/{riskConfiguration}', [App\Http\Controllers\RiskConfigurationController::class, 'update'])->name('update');
        Route::delete('/{riskConfiguration}', [App\Http\Controllers\RiskConfigurationController::class, 'destroy'])->name('destroy');
        Route::post('/calculate-risk-score', [App\Http\Controllers\RiskConfigurationController::class, 'calculateRiskScore'])->name('calculate-risk-score');
        Route::get('/matrix-data', [App\Http\Controllers\RiskConfigurationController::class, 'getRiskMatrixData'])->name('matrix-data');
    });

    // Organizations
    Route::get('organizations/select', [App\Http\Controllers\OrganizationController::class, 'selectPage'])
        ->name('organizations.select.page')
        ->middleware('auth');
    Route::post('organizations/{organization}/select', [App\Http\Controllers\OrganizationController::class, 'select'])
        ->name('organizations.select')
        ->middleware('auth');



    // Organizations
    Route::get('organizations/export', [App\Http\Controllers\OrganizationController::class, 'export'])->name('organizations.export');
    Route::resource('organizations', App\Http\Controllers\OrganizationController::class);
    Route::post('organizations/{organization}/users', [App\Http\Controllers\OrganizationController::class, 'addUser'])->name('organizations.users.add');
    Route::delete('organizations/{organization}/users/{user}', [App\Http\Controllers\OrganizationController::class, 'removeUser'])->name('organizations.users.remove');
    Route::patch('organizations/{organization}/users/{user}/role', [App\Http\Controllers\OrganizationController::class, 'updateUserRole'])->name('organizations.users.update-role');

    // Users
    Route::get('users/export', [App\Http\Controllers\UserController::class, 'export'])->name('users.export');
    Route::resource('users', App\Http\Controllers\UserController::class);

    // Roles & Permissions
    Route::resource('roles', App\Http\Controllers\RoleController::class);
    Route::resource('permissions', App\Http\Controllers\PermissionController::class)->only(['index', 'create', 'store', 'destroy']);
    // ================= ADMIN SETTINGS GROUP =================

    Route::prefix('admin-settings')->name('admin-settings.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('admin-settings-general/index');
        })->name('index');
    });
    // ================= CONTROLS =================
    Route::get('controls/export', [ControleController::class, 'export'])->name('controls.export');
    Route::get('controls', [ControleController::class, 'index'])->name('controls.index');
    Route::get('controls/create', [ControleController::class, 'create'])->name('controls.create');
    Route::post('controls', [ControleController::class, 'store'])->name('controls.store');
    Route::get('controls/settings', [App\Http\Controllers\ControlSettingsController::class, 'index'])->name('controls.settings.index');
    Route::post('controls/settings/store', [App\Http\Controllers\ControlSettingsController::class, 'store'])->name('controls.settings.store');
    Route::get('controls/{control}', [ControleController::class, 'show'])->name('controls.show');
    Route::get('controls/{control}/edit', [ControleController::class, 'edit'])->name('controls.edit');
    Route::put('controls/{control}', [ControleController::class, 'update'])->name('controls.update');
    Route::delete('controls/{control}', [ControleController::class, 'destroy'])->name('controls.destroy');

    // ================= PREDEFINED TESTS (PredefindTestController) =================
    Route::get('predefined-tests', [App\Http\Controllers\PredefindTestController::class, 'index'])
        ->name('PredefindTest.index');
    Route::get('predefined-tests/create', [App\Http\Controllers\PredefindTestController::class, 'create'])
        ->name('predefined-tests.create');
    Route::post('predefined-tests', [App\Http\Controllers\PredefindTestController::class, 'store'])
        ->name('predefined-tests.store');
    Route::get('predefined/export', [App\Http\Controllers\PredefindTestController::class, 'export'])
        ->name('predefined-tests.export');

    // ================= PREDEFINED TEST REQUIREMENTS =================
    // ✅ Routes statiques EN PREMIER (avant tout {paramètre})
    Route::get('predefined-tests/export', [PredefinedTestRequirmentController::class, 'export'])
        ->name('predefinedTestReq.export');
    Route::get('predefined-tests/requirement', [PredefinedTestRequirmentController::class, 'index'])
        ->name('predefinedTestReq.index');
    Route::get('predefined-tests/requirement/create', [PredefinedTestRequirmentController::class, 'create'])
        ->name('predefinedTestReq.create');
    Route::post('predefined-tests/requirement', [PredefinedTestRequirmentController::class, 'store'])
        ->name('predefinedTestReq.store');
    Route::delete('predefined-tests/requirement/{predefinedTest}', [PredefinedTestRequirmentController::class, 'destroy'])
        ->name('predefinedTestReq.destroy');
    Route::get('predefined-tests/requirement/{predefinedTest}/edit', [PredefinedTestRequirmentController::class, 'edit'])
        ->name('predefinedTestReq.edit');
    Route::put('predefined-tests/requirement/{predefinedTest}', [PredefinedTestRequirmentController::class, 'update'])
        ->name('predefinedTestReq.update');
    Route::get('requirements/{requirement}/predefined-tests/requirement', [PredefinedTestRequirmentController::class, 'forRequirement'])
        ->name('predefinedTestReq.forRequirement');

    // ✅ Routes avec {predefined_test} EN DERNIER
    Route::get('predefined-tests/{predefined_test}', [App\Http\Controllers\PredefindTestController::class, 'show'])
        ->name('predefined-tests.show');
    Route::get('predefined-tests/{predefined_test}/edit', [App\Http\Controllers\PredefindTestController::class, 'edit'])
        ->name('predefined-tests.edit');
    Route::put('predefined-tests/{predefined_test}', [App\Http\Controllers\PredefindTestController::class, 'update'])
        ->name('predefined-tests.update');
    Route::delete('predefined-tests/{predefined_test}', [App\Http\Controllers\PredefindTestController::class, 'destroy'])
        ->name('predefined-tests.destroy');

    // ================= PLANNINGS =================
    Route::get('plannings', [App\Http\Controllers\PlannigController::class, 'index'])->name('plannings.index');
    Route::get('planning/create', [App\Http\Controllers\PlannigController::class, 'create'])->name('planning.create');
    Route::post('planning', [App\Http\Controllers\PlannigController::class, 'store'])->name('planning.store');
    Route::get('planning/{planning}', [App\Http\Controllers\PlannigController::class, 'show'])->name('planning.show');
    Route::get('planning/{planning}/edit', [App\Http\Controllers\PlannigController::class, 'edit'])->name('planning.edit');
    Route::put('planning/{planning}', [App\Http\Controllers\PlannigController::class, 'update'])->name('planning.update');
    Route::delete('planning/{planning}', [App\Http\Controllers\PlannigController::class, 'destroy'])->name('planning.destroy');
    Route::get('plan/export', [App\Http\Controllers\PlannigController::class, 'export'])->name('planning.export');

    // ================= FRAMEWORKS =================
    Route::get('frameworks/export', [FrameworkController::class, 'export'])->name('frameworks.export');

    Route::get('frameworks', [FrameworkController::class, 'index'])->name('frameworks.index');
    Route::get('frameworks/create', [FrameworkController::class, 'create'])->name('frameworks.create');
    Route::post('frameworks', [FrameworkController::class, 'store'])->name('frameworks.store');

    Route::get('frameworks/{framework}/edit', [FrameworkController::class, 'edit'])->name('frameworks.edit');
    Route::put('frameworks/{framework}', [FrameworkController::class, 'update'])->name('frameworks.update');
    Route::delete('frameworks/{framework}', [FrameworkController::class, 'destroy'])->name('frameworks.destroy');
    Route::get('frameworks/{framework}', [FrameworkController::class, 'show']);

    // ================= JURISDICTIONS & TAGS =================
    Route::resource('jurisdictions', JurisdictionController::class)
        ->only(['index', 'create', 'store', 'update', 'destroy']);
    Route::resource('tags', TagController::class)
        ->only(['index', 'create', 'store', 'update', 'destroy']);

    // ================= REQUIREMENTS =================
    Route::get('requirements/export', [RequirementController::class, 'export'])->name('requirements.export');
    Route::resource('requirements', RequirementController::class);
    Route::get('requirements/frameworks/{framework}/processes', 
        [RequirementController::class, 'getProcessesByFramework']
    )->name('requirements.processes-by-framework');

    // ================= REQUIREMENT TESTS =================
    Route::get('requirement-tests/validation', [RequirementTestController::class, 'validation'])
        ->name('requirement-tests.validation');
    Route::patch('requirement-tests/{requirementTest}/accept', [RequirementTestController::class, 'accept'])
        ->name('requirement-tests.accept');
    Route::patch('requirement-tests/{requirementTest}/reject', [RequirementTestController::class, 'reject'])
        ->name('requirement-tests.reject');
    Route::get('requirement-tests/export', [RequirementTestController::class, 'export'])
        ->name('requirement-tests.export');
    Route::get('req-testing', [RequirementController::class, 'getRequirementsForTesting'])
        ->name('req-testing.index');
    Route::get('requirements/{requirement}/test/create', [RequirementTestController::class, 'createForRequirement'])
        ->name('requirements.test.create');
    Route::post('requirements/{requirement}/test', [RequirementTestController::class, 'storeForRequirement'])
        ->name('requirements.test.store');
    Route::resource('requirement-tests', RequirementTestController::class)
        ->only(['index', 'edit', 'update', 'destroy']);
    Route::get('requirement-tests/{requirementTest}', [RequirementTestController::class, 'show'])
        ->name('requirement-tests.show');

    // ================= TEST RESULTS =================
    Route::post('test-results', [TestResultController::class, 'store'])
        ->name('test-results.store');


    Route::post('/requirement-test-reservations', [RequirementTestReservationController::class, 'store'])
        ->name('requirement-test-reservations.store');

    Route::delete('/requirement-test-reservations', [RequirementTestReservationController::class, 'destroy'])
        ->name('requirement-test-reservations.destroy');

});



require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/bpmn.php';