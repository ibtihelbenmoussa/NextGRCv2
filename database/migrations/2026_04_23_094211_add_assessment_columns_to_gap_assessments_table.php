<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gap_assessments', function (Blueprint $table) {
            if (!Schema::hasColumn('gap_assessments', 'maturity_level')) {
                $table->integer('maturity_level')->default(1)->after('score');
            }
            if (!Schema::hasColumn('gap_assessments', 'answers')) {
                $table->json('answers')->nullable()->after('maturity_level');
            }
            if (!Schema::hasColumn('gap_assessments', 'ai_feedback')) {
                $table->text('ai_feedback')->nullable()->after('answers');
            }
        });
    }

    public function down(): void
    {
        Schema::table('gap_assessments', function (Blueprint $table) {
            $table->dropColumn(['maturity_level', 'answers', 'ai_feedback']);
        });
    }
};