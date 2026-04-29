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
    Schema::table('gap_questions', function (Blueprint $table) {
        $table->string('dimension')->default('general')->after('text');
        $table->float('weight')->default(0.2)->after('dimension');
        $table->integer('order')->default(1)->after('weight');
    });
}

public function down(): void
{
    Schema::table('gap_questions', function (Blueprint $table) {
        $table->dropColumn(['dimension', 'weight', 'order']);
    });
}};