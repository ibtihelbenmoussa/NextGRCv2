<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('action_plans', function (Blueprint $table) {
            $table->unsignedTinyInteger('step_level')->nullable()->after('gap_id');
            $table->unsignedSmallInteger('step_index')->nullable()->after('step_level');
        });
    }

    public function down(): void
    {
        Schema::table('action_plans', function (Blueprint $table) {
            $table->dropColumn(['step_level', 'step_index']);
        });
    }
};