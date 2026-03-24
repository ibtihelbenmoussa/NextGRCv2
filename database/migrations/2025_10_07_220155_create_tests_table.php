<?php

use App\Enums\TestResult;
use App\Enums\TestReviewStatus;
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
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audit_mission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('control_id')->constrained()->cascadeOnDelete();
            $table->foreignId('risk_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('objective')->nullable();
            $table->text('test_procedure')->nullable();
            $table->text('sample_description')->nullable(); // Échantillon
            $table->integer('sample_size')->nullable();
            $table->string('test_result')->nullable();
            $table->text('findings')->nullable();
            $table->text('recommendations')->nullable();
            $table->string('review_status')->default(TestReviewStatus::PENDING->value);
            $table->text('review_comments')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('test_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tests');
    }
};
