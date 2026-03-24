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
        Schema::create('risk_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('risk_id');
            $table->unsignedBigInteger('control_id')->nullable();
            $table->double('inhImpact')->nullable();
            $table->double('inhProbability')->nullable();
            /* $table->double('inhCriteres')->nullable();*/
            $table->double('resImpact')->nullable();
            $table->double('resProbability')->nullable();
            $table->string('type');
            $table->double('score');
             $table->unsignedBigInteger('changed_by');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('risk_histories');
    }
};
