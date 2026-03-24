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
        Schema::create('tags_framework', function (Blueprint $table) {
            $table->id();
              $table->foreignId('framework_id')
                  ->constrained()
                  ->onDelete('cascade');

            $table->foreignId('tag_id')
                  ->constrained()
                  ->onDelete('cascade');
            $table->timestamps();
                        $table->unique(['framework_id', 'tag_id']);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tags_framework');
    }
};
