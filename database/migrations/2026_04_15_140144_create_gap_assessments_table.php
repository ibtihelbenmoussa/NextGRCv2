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

    $table->foreignId('requirement_id')
        ->constrained()
        ->onDelete('cascade');

    $table->float('score')->default(0); // 0 → 100
    $table->integer('maturity_level')->default(1); // 1 → 5

    $table->json('answers')->nullable(); 
    // example: {question_id: score}

    $table->text('ai_feedback')->nullable(); 
    // AI analysis later

    $table->timestamps();
});}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gap_assessments');
    }
};
