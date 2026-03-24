<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('framework_jurisdiction', function (Blueprint $table) {

            $table->foreignId('framework_id')
                ->constrained('frameworks')
                ->cascadeOnDelete();

            $table->foreignId('jurisdiction_id')
                ->constrained('jurisdictions')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->primary(['framework_id', 'jurisdiction_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('framework_jurisdiction');
    }
};
