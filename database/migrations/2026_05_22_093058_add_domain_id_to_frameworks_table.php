<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('frameworks', function (Blueprint $table) {
            $table->foreignId('domain_id')
                  ->nullable()
                  ->after('organization_id')
                  ->constrained('domains')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('frameworks', function (Blueprint $table) {
            $table->dropForeign(['domain_id']);
            $table->dropColumn('domain_id');
        });
    }
};