<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing business unit managers
        DB::table('business_units')
            ->whereNotNull('manager_id')
            ->get()
            ->each(function ($businessUnit) {
                DB::table('business_unit_manager')->insert([
                    'business_unit_id' => $businessUnit->id,
                    'user_id' => $businessUnit->manager_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });

        // Migrate existing macro process owners to managers
        DB::table('macro_processes')
            ->whereNotNull('owner_id')
            ->get()
            ->each(function ($macroProcess) {
                DB::table('macro_process_manager')->insert([
                    'macro_process_id' => $macroProcess->id,
                    'user_id' => $macroProcess->owner_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });

        // Migrate existing process owners to managers
        DB::table('processes')
            ->whereNotNull('owner_id')
            ->get()
            ->each(function ($process) {
                DB::table('process_manager')->insert([
                    'process_id' => $process->id,
                    'user_id' => $process->owner_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });

        // Drop old columns
        Schema::table('business_units', function ($table) {
            $table->dropForeign(['manager_id']);
            $table->dropColumn('manager_id');
        });

        Schema::table('macro_processes', function ($table) {
            $table->dropForeign(['owner_id']);
            $table->dropColumn('owner_id');
        });

        Schema::table('processes', function ($table) {
            $table->dropForeign(['owner_id']);
            $table->dropColumn('owner_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add columns back
        Schema::table('business_units', function ($table) {
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('macro_processes', function ($table) {
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('processes', function ($table) {
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
        });

        // Migrate data back (take first manager only)
        DB::table('business_unit_manager')
            ->get()
            ->groupBy('business_unit_id')
            ->each(function ($managers, $businessUnitId) {
                $firstManager = $managers->first();
                DB::table('business_units')
                    ->where('id', $businessUnitId)
                    ->update(['manager_id' => $firstManager->user_id]);
            });

        DB::table('macro_process_manager')
            ->get()
            ->groupBy('macro_process_id')
            ->each(function ($managers, $macroProcessId) {
                $firstManager = $managers->first();
                DB::table('macro_processes')
                    ->where('id', $macroProcessId)
                    ->update(['owner_id' => $firstManager->user_id]);
            });

        DB::table('process_manager')
            ->get()
            ->groupBy('process_id')
            ->each(function ($managers, $processId) {
                $firstManager = $managers->first();
                DB::table('processes')
                    ->where('id', $processId)
                    ->update(['owner_id' => $firstManager->user_id]);
            });
    }
};
