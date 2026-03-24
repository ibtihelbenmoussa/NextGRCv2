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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audit_mission_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('report_type')->default('final'); // draft, preliminary, final
            $table->text('executive_summary')->nullable();
            $table->text('introduction')->nullable();
            $table->text('scope_and_methodology')->nullable();
            $table->text('findings')->nullable();
            $table->text('recommendations')->nullable();
            $table->text('conclusion')->nullable();
            $table->string('status')->default('draft'); // draft, under_review, approved, issued
            $table->foreignId('prepared_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('issue_date')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
