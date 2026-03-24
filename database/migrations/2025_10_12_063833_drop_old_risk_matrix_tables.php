<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop old risk matrix tables in correct order (foreign keys first)
        Schema::dropIfExists('risk_levels');
        Schema::dropIfExists('risk_matrix_configurations');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the old tables if needed (for rollback)
        Schema::create('risk_matrix_configurations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('name')->default('Risk Matrix Configuration');
            $table->unsignedTinyInteger('rows')->comment('Number of likelihood levels (2-10)');
            $table->unsignedTinyInteger('columns')->comment('Number of consequence levels (2-10)');
            $table->unsignedSmallInteger('max_score')->comment('Maximum possible risk score (rows * columns)');
            $table->unsignedTinyInteger('number_of_levels')->comment('Number of risk levels (2-10)');
            $table->boolean('is_active')->default(false)->comment('Whether this is the active configuration');
            $table->boolean('is_custom')->default(false)->comment('Whether this uses custom level definitions');
            $table->string('preset_used')->nullable()->comment('Preset identifier if using preset configuration');
            $table->json('metadata')->nullable()->comment('Additional configuration metadata');
            $table->timestamps();

            // Ensure only one active configuration per organization
            $table->unique(['organization_id', 'is_active'], 'unique_active_config');

            // Add constraints
            $table->index(['organization_id', 'is_active']);
            $table->index('created_at');
        });

        Schema::create('risk_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('risk_matrix_configuration_id')->constrained()->onDelete('cascade');
            $table->string('name')->comment('Risk level name (e.g., Low, Medium, High)');
            $table->string('color', 7)->comment('Hex color code for visual representation');
            $table->unsignedSmallInteger('min_score')->comment('Minimum score for this risk level');
            $table->unsignedSmallInteger('max_score')->comment('Maximum score for this risk level');
            $table->unsignedTinyInteger('order')->comment('Display order of the risk level');
            $table->timestamps();

            // Ensure unique ordering within each configuration
            $table->unique(['risk_matrix_configuration_id', 'order'], 'unique_level_order');

            // Ensure no overlapping score ranges within the same configuration
            $table->index(['risk_matrix_configuration_id', 'min_score', 'max_score'], 'risk_levels_config_scores_idx');
            $table->index(['risk_matrix_configuration_id', 'order'], 'risk_levels_config_order_idx');
        });
    }
};
