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
        $isSqlite = DB::getDriverName() === 'sqlite';

        // 1. Hard-delete tất cả soft-deleted records trước
        DB::table('class_schedules')->whereNotNull('deleted_at')->delete();

        // 2. Drop foreign keys và indexes trước
        if ($isSqlite) {
            DB::statement('DROP INDEX IF EXISTS class_schedules_class_subject_id_weekday_index');
            DB::statement('DROP INDEX IF EXISTS class_schedules_effective_from_effective_to_index');
            DB::statement('DROP INDEX IF EXISTS class_schedules_room_id_weekday_index');
        } else {
            Schema::table('class_schedules', function (Blueprint $table) {
                $table->dropForeign(['class_subject_id']);
                $table->dropForeign(['room_id']);
                $table->dropIndex('class_schedules_class_subject_id_weekday_index');
                $table->dropIndex('class_schedules_effective_from_effective_to_index');
                $table->dropIndex('class_schedules_room_id_weekday_index');
            });

            DB::statement('DELETE cs1 FROM class_schedules cs1 INNER JOIN class_schedules cs2 WHERE cs1.class_subject_id = cs2.class_subject_id AND cs1.id > cs2.id');
        }

        // 5. Drop các cột không còn cần thiết
        Schema::table('class_schedules', function (Blueprint $table) {
            $table->dropColumn([
                'weekday',
                'start_time',
                'end_time',
                'effective_from',
                'effective_to',
                'deleted_at',
            ]);
        });

        // 6. Thêm các cột JSON mới và constraints
        Schema::table('class_schedules', function (Blueprint $table) {
            $table->json('weeks')->after('class_subject_id');
            $table->json('off_days')->nullable()->after('weeks');
            $table->json('extra_days')->nullable()->after('off_days');

            $table->foreign('class_subject_id')
                ->references('id')->on('class_subjects')
                ->cascadeOnDelete();

            $table->foreign('room_id')
                ->references('id')->on('rooms')
                ->nullOnDelete();

            $table->unique('class_subject_id');
            $table->index('room_id');
        });

        // Set default weeks value cho các bản ghi cũ nếu có
        DB::table('class_schedules')->update(['weeks' => json_encode(new \stdClass())]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_schedules', function (Blueprint $table) {
            $table->dropUnique(['class_subject_id']);
            $table->dropForeign(['class_subject_id']);
            $table->dropIndex(['room_id']);
            $table->dropColumn(['weeks', 'off_days', 'extra_days']);
        });

        Schema::table('class_schedules', function (Blueprint $table) {
            $table->tinyInteger('weekday')->after('class_subject_id');
            $table->time('start_time')->after('weekday');
            $table->time('end_time')->after('start_time');
            $table->date('effective_from')->after('room_id');
            $table->date('effective_to')->nullable()->after('effective_from');
            $table->softDeletes();

            $table->foreign('class_subject_id')
                ->references('id')->on('class_subjects')
                ->cascadeOnDelete();

            $table->index(['class_subject_id', 'weekday']);
            $table->index(['effective_from', 'effective_to']);
            $table->index(['room_id', 'weekday']);
        });
    }
};
