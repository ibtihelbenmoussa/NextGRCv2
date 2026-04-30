<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Modifier gap_assessments — seulement les colonnes qui n'existent pas
        Schema::table('gap_assessments', function (Blueprint $table) {
            if (!Schema::hasColumn('gap_assessments', 'organization_id')) {
                $table->unsignedBigInteger('organization_id')->after('id')->nullable();
                $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            }
            if (!Schema::hasColumn('gap_assessments', 'framework_id')) {
                $table->unsignedBigInteger('framework_id')->after('organization_id')->nullable();
                $table->foreign('framework_id')->references('id')->on('frameworks')->onDelete('set null');
            }
            if (!Schema::hasColumn('gap_assessments', 'code')) {
                $table->string('code', 100)->nullable();
            }
            if (!Schema::hasColumn('gap_assessments', 'name')) {
                $table->string('name', 255)->nullable();
            }
            if (!Schema::hasColumn('gap_assessments', 'description')) {
                $table->text('description')->nullable();
            }
            if (!Schema::hasColumn('gap_assessments', 'start_date')) {
                $table->date('start_date')->nullable();
            }
            if (!Schema::hasColumn('gap_assessments', 'end_date')) {
                $table->date('end_date')->nullable();
            }
            if (!Schema::hasColumn('gap_assessments', 'is_deleted')) {
                $table->tinyInteger('is_deleted')->default(0);
            }
             if (!Schema::hasColumn('gap_assessments', 'score')) {
        $table->unsignedSmallInteger('score')->nullable()->after('end_date');
    }
    if (!Schema::hasColumn('gap_assessments', 'maturity_level')) {
        $table->unsignedTinyInteger('maturity_level')->nullable()->after('score');
    }
        });

        // 2. Table pivot gap_assessment_requirements
        if (!Schema::hasTable('gap_assessment_requirements')) {
            Schema::create('gap_assessment_requirements', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('gap_assessment_id');
                $table->unsignedBigInteger('requirement_id');
                $table->timestamps();

                $table->foreign('gap_assessment_id')->references('id')->on('gap_assessments')->onDelete('cascade');
                $table->foreign('requirement_id')->references('id')->on('requirements')->onDelete('cascade');
                $table->unique(['gap_assessment_id', 'requirement_id']);
            });
        }

        // 3. Table historique des réponses
        if (!Schema::hasTable('gap_answers')) {
            Schema::create('gap_answers', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('gap_assessment_id');
                $table->unsignedBigInteger('gap_question_id');
                $table->enum('answer', ['YES', 'PARTIAL', 'NO']);
                $table->text('note')->nullable();
                $table->unsignedSmallInteger('score')->default(0);
                $table->unsignedTinyInteger('maturity_level')->default(1);
                $table->timestamps();

                $table->foreign('gap_assessment_id')->references('id')->on('gap_assessments')->onDelete('cascade');
                $table->foreign('gap_question_id')->references('id')->on('gap_questions')->onDelete('cascade');
                $table->index(['gap_assessment_id', 'gap_question_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('gap_answers');
        Schema::dropIfExists('gap_assessment_requirements');

        Schema::table('gap_assessments', function (Blueprint $table) {
            // Drop foreign keys first
            try { $table->dropForeign(['organization_id']); } catch (\Exception $e) {}
            try { $table->dropForeign(['framework_id']); } catch (\Exception $e) {}

            $cols = ['organization_id', 'framework_id', 'code', 'name', 'description', 'start_date', 'end_date', 'is_deleted'];
            $existing = array_filter($cols, fn($c) => Schema::hasColumn('gap_assessments', $c));
            if ($existing) $table->dropColumn(array_values($existing));
        });
    }
};