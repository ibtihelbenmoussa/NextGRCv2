<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Table pivot domain ↔ framework
        Schema::create('domain_framework', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->cascadeOnDelete();
            $table->foreignId('framework_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['domain_id', 'framework_id']);
        });

        // Supprimer l'ancienne colonne domain_id de frameworks
        Schema::table('frameworks', function (Blueprint $table) {
            $table->dropForeign(['domain_id']);
            $table->dropColumn('domain_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_framework');
        Schema::table('frameworks', function (Blueprint $table) {
            $table->foreignId('domain_id')->nullable()->constrained()->nullOnDelete();
        });
    }
};