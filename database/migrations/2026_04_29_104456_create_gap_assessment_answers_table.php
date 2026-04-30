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
    Schema::create('gap_assessment_answers', function (Blueprint $table) {
        $table->id();
        $table->foreignId('gap_assessment_id')->constrained('gap_assessments')->cascadeOnDelete();
        $table->foreignId('gap_question_id')->constrained('gap_questions')->cascadeOnDelete();
       $table->tinyInteger('answer')->unsigned(); // 0,1,2,3,4

        $table->text('note')->nullable();
        $table->float('score')->default(0); // 0, 0.5, ou 1.0
        $table->integer('maturity_level')->default(1); // 1-5
        $table->timestamp('answered_at')->useCurrent();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('gap_assessment_answers');
}};
