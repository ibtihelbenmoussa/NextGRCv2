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
        Schema::create('risk_score_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('risk_configuration_id')->constrained()->onDelete('cascade');
            $table->string('label')->comment('Score level label e.g. "Low", "Medium", "High"');
            $table->unsignedSmallInteger('min')->comment('Minimum score for this level');
            $table->unsignedSmallInteger('max')->comment('Maximum score for this level');
            $table->string('color', 7)->comment('Hex color code for visual representation');
            $table->unsignedTinyInteger('order')->comment('Display order of the score level');
            $table->timestamps();

            // Indexes
            $table->index(['risk_configuration_id', 'order']);
            $table->index(['risk_configuration_id', 'min', 'max']);
            
            // Ensure unique ordering within each configuration
            $table->unique(['risk_configuration_id', 'order'], 'unique_score_level_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('risk_score_levels');
    }
};
