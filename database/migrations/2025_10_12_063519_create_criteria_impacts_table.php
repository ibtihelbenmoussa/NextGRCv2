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
        Schema::create('criteria_impacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('criteria_id')->constrained('risk_criterias')->onDelete('cascade');
            $table->string('impact_label')->comment('Impact label e.g. "Low", "Medium", "High"');
            $table->decimal('score', 5, 2)->comment('Numeric value for this criteria-impact');
            $table->unsignedTinyInteger('order')->comment('Display order');
            $table->timestamps();

            // Indexes
            $table->index(['criteria_id', 'order']);
            $table->index(['criteria_id', 'score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('criteria_impacts');
    }
};
