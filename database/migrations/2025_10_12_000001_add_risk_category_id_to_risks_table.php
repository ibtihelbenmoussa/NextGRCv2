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
        Schema::table('risks', function (Blueprint $table) {
            // Add risk_category_id column
            $table->foreignId('risk_category_id')->nullable()->after('organization_id')->constrained('risk_categories')->nullOnDelete();
            
            // Keep the old category column for backward compatibility during migration
            // You can remove it later after migrating data
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('risks', function (Blueprint $table) {
            $table->dropForeign(['risk_category_id']);
            $table->dropColumn('risk_category_id');
        });
    }
};
