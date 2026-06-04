<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('gap_questions')) {
            Schema::create('gap_questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('requirement_id')->constrained()->onDelete('cascade');
                $table->text('text');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('gap_questions');
    }
};