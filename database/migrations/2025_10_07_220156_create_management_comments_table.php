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
        Schema::create('management_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audit_mission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('test_id')->nullable()->constrained()->nullOnDelete();
            $table->text('finding')->nullable();
            $table->text('management_response')->nullable();
            $table->text('action_plan')->nullable();
            $table->foreignId('responsible_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('target_date')->nullable();
            $table->string('status')->default('pending'); // pending, agreed, disagreed, implemented
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('management_comments');
    }
};
