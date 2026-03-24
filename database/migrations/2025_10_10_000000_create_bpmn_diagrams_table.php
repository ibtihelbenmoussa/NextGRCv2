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
        Schema::create('bpmn_diagrams', function (Blueprint $table) {
            $table->id();

            // Polymorphic relationship columns
            $table->morphs('diagramable'); // diagramable_id, diagramable_type

            // BPMN diagram metadata
            $table->string('name'); // Diagram name or title
            $table->longText('bpmn_xml'); // BPMN XML code stored directly in DB
            $table->text('description')->nullable(); // Optional description

            // Audit fields
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bpmn_diagrams');
    }
};
