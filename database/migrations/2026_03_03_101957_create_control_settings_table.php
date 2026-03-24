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
        Schema::create('control_settings', function (Blueprint $table) {
            $table->id();

            $table->string('risk_level');
            $table->string('effectiveness');

            $table->integer('impact')->default(0);
            $table->integer('probability')->default(0);
            $table->integer('score')->default(0);

         
            $table->foreignId('organization_id')
                  ->constrained()
                  ->onDelete('cascade');

            $table->timestamps();
            $table->softDeletes();

            
            $table->unique([
                'organization_id',
                'risk_level',
                'effectiveness'
            ], 'control_settings_unique');
           
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('control_settings');
    }
};
