<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Supprimer la table pivot
        Schema::dropIfExists('domain_requirement');

        // 2. Ajouter domain_id sur requirements
        Schema::table('requirements', function (Blueprint $table) {
            $table->foreignId('domain_id')
                  ->nullable()
                  ->after('organization_id')
                  ->constrained('domains')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Rollback : supprimer domain_id
        Schema::table('requirements', function (Blueprint $table) {
            $table->dropForeign(['domain_id']);
            $table->dropColumn('domain_id');
        });

        // Rollback : recréer la table pivot
        Schema::create('domain_requirement', function (Blueprint $table) {
            $table->foreignId('domain_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requirement_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }
};