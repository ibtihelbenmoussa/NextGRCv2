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
        $table->integer('maturity_level')->default(1)->after('score');
        $table->json('answers')->nullable()->after('maturity_level');
        $table->text('ai_feedback')->nullable()->after('answers');
    });
}

    /**
     * Reverse the migrations.
     */
  public function down(): void
{
    Schema::table('gap_assessments', function (Blueprint $table) {
        $table->dropColumn(['maturity_level', 'answers', 'ai_feedback']);
    });
}
};
