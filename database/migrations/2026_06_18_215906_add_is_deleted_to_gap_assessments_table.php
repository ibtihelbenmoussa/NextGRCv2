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
        if (!Schema::hasColumn('gap_assessments', 'is_deleted')) {
            $table->tinyInteger('is_deleted')->default(0)->after('end_date');
        }
    });
}

public function down(): void
{
    Schema::table('gap_assessments', function (Blueprint $table) {
        if (Schema::hasColumn('gap_assessments', 'is_deleted')) {
            $table->dropColumn('is_deleted');
        }
    });
}
};
