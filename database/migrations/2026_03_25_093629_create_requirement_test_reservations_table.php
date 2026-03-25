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
    Schema::create('requirement_test_reservations', function (Blueprint $table) {
        $table->id();
        $table->foreignId('requirement_id')->constrained()->cascadeOnDelete();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->date('date');
        $table->timestamps();

        $table->unique(['requirement_id', 'date']); // 1 seul claim par jour
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requirement_test_reservations');
    }
};
