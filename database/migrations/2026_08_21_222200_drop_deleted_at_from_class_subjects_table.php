<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('class_subjects') && Schema::hasColumn('class_subjects', 'deleted_at')) {
            Schema::table('class_subjects', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('class_subjects') && ! Schema::hasColumn('class_subjects', 'deleted_at')) {
            Schema::table('class_subjects', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }
};
