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
        Schema::table('class_subjects', function (Blueprint $table) {
            if (! Schema::hasColumn('class_subjects', 'tuition_fee')) {
                $table->decimal('tuition_fee', 12, 0)->nullable()->after('teacher_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_subjects', function (Blueprint $table) {
            if (Schema::hasColumn('class_subjects', 'tuition_fee')) {
                $table->dropColumn('tuition_fee');
            }
        });
    }
};
