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
        Schema::create('risk_probabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('risk_configuration_id')->constrained()->onDelete('cascade');
            $table->string('label')->comment('Probability level label e.g. "Rare", "Likely", "Almost Certain"');
            $table->decimal('score', 5, 2)->comment('Numeric value for probability');
            $table->unsignedTinyInteger('order')->comment('Display order');
            $table->timestamps();

            // Indexes
            $table->index(['risk_configuration_id', 'order']);
            $table->index(['risk_configuration_id', 'score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('risk_probabilities');
    }
};
