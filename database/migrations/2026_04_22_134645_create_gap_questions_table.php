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
     Schema::create('gap_questions', function (Blueprint $table) {
    $table->id();

    $table->foreignId('requirement_id')
          ->constrained()
          ->onDelete('cascade');

    $table->text('text');
    $table->string('dimension'); 
    $table->float('weight')->default(0.1);
    $table->integer('order')->default(1);

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gap_questions');
    }
};
