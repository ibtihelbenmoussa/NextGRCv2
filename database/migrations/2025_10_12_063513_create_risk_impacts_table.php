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
        Schema::create('risk_impacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('risk_configuration_id')->constrained()->onDelete('cascade');
            $table->string('label')->comment('Impact level label e.g. "Minor", "Moderate", "Critical"');
            $table->decimal('score', 5, 2)->comment('Numerical value for impact (1.0, 2.5, etc.)');
            $table->string('color', 7)->nullable()->comment('Optional color code for UI (e.g., #FF0000)');
            $table->unsignedTinyInteger('order')->comment('Order of scale (1 = lowest, N = highest)');
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
        Schema::dropIfExists('risk_impacts');
    }
};
