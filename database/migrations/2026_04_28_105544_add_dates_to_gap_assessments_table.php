<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gap_assessments', function (Blueprint $table) {
            if (!Schema::hasColumn('gap_assessments', 'start_date')) {
                $table->date('start_date')->nullable();
            }
            if (!Schema::hasColumn('gap_assessments', 'end_date')) {
                $table->date('end_date')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('gap_assessments', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'end_date']);
        });
    }
};