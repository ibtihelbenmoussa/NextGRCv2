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
       Schema::create('gap_assessments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('requirement_id')->constrained()->onDelete('cascade');
    $table->text('current_state')->nullable();
    $table->text('expected_state')->nullable();
    $table->text('gap_description')->nullable();
    $table->enum('compliance_level', ['compliant', 'partial', 'non_compliant']);
    $table->integer('score')->nullable(); // %
    $table->text('recommendation')->nullable();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gap_assessments');
    }
};
