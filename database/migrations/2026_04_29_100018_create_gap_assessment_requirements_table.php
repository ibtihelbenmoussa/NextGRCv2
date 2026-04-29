<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('gap_assessment_requirements', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('gap_assessment_id');
        $table->unsignedBigInteger('requirement_id');
        $table->timestamps();

        $table->foreign('gap_assessment_id')
              ->references('id')->on('gap_assessments')
              ->onDelete('cascade');

        $table->foreign('requirement_id')
              ->references('id')->on('requirements')
              ->onDelete('cascade');

        $table->unique(['gap_assessment_id', 'requirement_id'], 'gar_unique');
    });
}

    public function down(): void
    {
        Schema::dropIfExists('gap_assessment_requirements');
    }
};