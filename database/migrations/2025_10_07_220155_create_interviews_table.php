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
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audit_mission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('interviewee_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('purpose')->nullable();
            $table->dateTime('scheduled_at')->nullable();
            $table->dateTime('conducted_at')->nullable();
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('scheduled'); // scheduled, conducted, cancelled
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
