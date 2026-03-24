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
        Schema::create('risk_criterias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('risk_configuration_id')->constrained()->onDelete('cascade');
            $table->string('name')->comment('Criteria name e.g. "Financial", "Reputation", "Compliance"');
            $table->text('description')->nullable()->comment('Optional description');
            $table->unsignedTinyInteger('order')->comment('Display order');
            $table->timestamps();

            // Indexes
            $table->index(['risk_configuration_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('risk_criterias');
    }
};
