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
         Schema::table('gap_assessments', function (Blueprint $table) {
        $table->json('ml_result')->nullable();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
  {
    Schema::table('gap_assessments', function (Blueprint $table) {
        $table->dropColumn('ml_result');
    });
}
};
