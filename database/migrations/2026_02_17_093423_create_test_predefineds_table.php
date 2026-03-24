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
        Schema::create('test_predefineds', function (Blueprint $table) {
            $table->id();
            $table->longText('name');
            $table->string('code')->unique();
             $table->unsignedBigInteger('organization_id');
            $table->longText('test_objective');
            $table->longText('test_result');
            $table->longText('risk');
            $table->longText('echantillon');
                 $table->boolean('is_active')->default(true);
            $table->timestamps();
             $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_predefineds');
    }
};
