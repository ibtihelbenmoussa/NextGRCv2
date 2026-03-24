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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();

            // Polymorphic relationship columns
            $table->morphs('documentable'); // Creates documentable_id and documentable_type

            // Document metadata
            $table->string('name'); // Original filename
            $table->string('file_path'); // Path where file is stored
            $table->string('file_name'); // Unique stored filename
            $table->string('mime_type'); // File MIME type (e.g., application/pdf)
            $table->unsignedBigInteger('file_size'); // File size in bytes
            $table->string('disk')->default('local'); // Storage disk (local, s3, etc.)

            // Optional categorization
            $table->string('category')->nullable(); // e.g., 'policy', 'procedure', 'evidence'
            $table->text('description')->nullable();

            // Audit fields
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Index for better query performance on category
            // Note: morphs() already creates index on (documentable_type, documentable_id)
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
