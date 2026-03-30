<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('framework_process', function (Blueprint $table) {
            $table->id();
            $table->foreignId('framework_id')->constrained('frameworks')->cascadeOnDelete();
            $table->foreignId('process_id')->constrained('processes')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['framework_id', 'process_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('framework_process');
    }
};