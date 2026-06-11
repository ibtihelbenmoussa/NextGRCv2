<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('gap_assessments', 'requirement_id')) {
            Schema::table('gap_assessments', function (Blueprint $table) {
                $table->unsignedBigInteger('requirement_id')->nullable()->change();
            });
        }
        // sinon : colonne absente, rien à faire
    }

    public function down(): void
    {
        if (Schema::hasColumn('gap_assessments', 'requirement_id')) {
            Schema::table('gap_assessments', function (Blueprint $table) {
                $table->unsignedBigInteger('requirement_id')->nullable(false)->change();
            });
        }
    }
};