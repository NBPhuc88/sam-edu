<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update status in classes table: change enum to integer (0 = inactive, 1 = active, 2 = completed)
        Schema::table('classes', function (Blueprint $table) {
            $table->tinyInteger('status_num')->default(1)->after('status');
        });

        DB::table('classes')->where('status', 'active')->update(['status_num' => 1]);
        DB::table('classes')->where('status', 'completed')->update(['status_num' => 2]);
        DB::table('classes')->whereIn('status', ['planned', 'cancelled', 'inactive'])->update(['status_num' => 0]);

        Schema::table('classes', function (Blueprint $table) {
            $table->dropIndex('classes_center_id_status_index');
            $table->dropIndex('classes_center_status_idx');
            $table->dropColumn('status');
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->tinyInteger('status')->default(1)->after('end_date');
            $table->index(['center_id', 'status'], 'classes_center_status_idx');
        });

        DB::table('classes')->update([
            'status' => DB::raw('status_num'),
        ]);

        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn('status_num');
        });

        // 2. Update status in students table: change enum to integer (0 = inactive, 1 = active, 2 = completed)
        Schema::table('students', function (Blueprint $table) {
            $table->tinyInteger('status_num')->default(1)->after('status');
        });

        DB::table('students')->where('status', 'active')->update(['status_num' => 1]);
        DB::table('students')->where('status', 'graduated')->update(['status_num' => 2]);
        DB::table('students')->whereIn('status', ['inactive', 'locked', 'suspended'])->update(['status_num' => 0]);

        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex('students_center_status_idx');
            $table->dropColumn('status');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->tinyInteger('status')->default(1)->after('password');
            $table->index(['center_id', 'status'], 'students_center_status_idx');
        });

        DB::table('students')->update([
            'status' => DB::raw('status_num'),
        ]);

        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('status_num');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse if needed
    }
};
