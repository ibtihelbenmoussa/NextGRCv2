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
        Schema::create('risk_configurations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('name')->comment('Configuration name like "Default Risk Config"');
            $table->unsignedTinyInteger('impact_scale_max')->comment('Max number of impact levels (2-10)');
            $table->unsignedTinyInteger('probability_scale_max')->comment('Max number of probability levels (2-10)');
            $table->enum('calculation_method', ['avg', 'max'])->default('avg')->comment('How risk score is calculated');
            $table->boolean('use_criterias')->default(false)->comment('Whether criteria are used');
            $table->timestamps();

            // Indexes
            $table->index(['organization_id', 'name']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('risk_configurations');
    }
};
