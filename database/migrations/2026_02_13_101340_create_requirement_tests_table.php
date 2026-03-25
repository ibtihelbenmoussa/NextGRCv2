<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('requirement_tests', function (Blueprint $table) {
            $table->id();

            $table->string('test_code', 50)->unique()->nullable();
            $table->string('name')->nullable();
            $table->text('objective')->nullable();
            $table->text('procedure')->nullable();
            $table->enum('result', ['compliant', 'non_compliant'])->nullable();
            $table->enum('efficacy', ['effective', 'partially_effective', 'ineffective'])->nullable();
            $table->date('effective_date')->nullable();
            $table->date('test_date')->nullable();
            $table->date('tested_at')->nullable();
            $table->text('failure_reason')->nullable();

            // Relations
            $table->foreignId('requirement_id')->constrained()->onDelete('cascade');
            $table->foreignId('framework_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->constrained()->onDelete('restrict');

            // Statut
            $table->enum('status', [
                'pending',
                'in_progress',
                'completed',
                'compliant',
                'non_compliant',
                'partial',
                'na'
            ])->default('pending');

            $table->text('comment')->nullable();
            $table->json('evidence')->nullable();

            // Validation
            $table->enum('validation_status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->text('validation_comment')->nullable();
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requirement_tests');
    }
};