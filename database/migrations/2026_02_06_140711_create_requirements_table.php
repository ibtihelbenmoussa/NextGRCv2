<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('requirements', function (Blueprint $table) {

            $table->bigIncrements('id');
            $table->bigInteger('organization_id');

            $table->string('code')->unique();
            $table->string('title');
            $table->text('description')->nullable();

            $table->enum('type', ['regulatory', 'internal', 'contractual'])->default('regulatory');
            $table->enum('status', ['active', 'inactive', 'draft', 'archived'])->default('active');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');

            $table->enum('frequency', [
                'one_time',
                'daily',
                'weekly',
                'monthly',
                'quarterly',
                'yearly',
                'continuous'
            ]);

            $table->unsignedBigInteger('framework_id');
            $table->unsignedBigInteger('process_id');
            $table->text('owner_id')->nullable();

       
            $table->date('effective_date')->nullable();
            $table->date('completion_date')->nullable();

            $table->enum('compliance_level', ['Mandatory', 'Optional', 'Recommended'])
                ->default('Mandatory');

            $table->text('attachments')->nullable();
            $table->integer('is_deleted')->default(0);
            $table->boolean('auto_validate')->default(false);


            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requirements');
    }
};
