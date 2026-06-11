<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('action_plan_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('action_plan_id')
                ->constrained('action_plans')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();

            // 'status_changed' | 'assigned_to_changed' | 'due_date_changed' | 'created'
            $table->string('event');

            $table->string('field')->nullable();   // colonne modifiée
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('action_plan_logs');
    }
};