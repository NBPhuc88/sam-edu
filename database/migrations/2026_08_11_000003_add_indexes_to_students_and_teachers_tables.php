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
        $existingStudents = array_column(Schema::getIndexes('students'), 'name');

        Schema::table('students', function (Blueprint $table) use ($existingStudents) {
            if (! in_array('idx_students_phone', $existingStudents, true)) {
                $table->index('phone', 'idx_students_phone');
            }

            if (! in_array('idx_students_email', $existingStudents, true)) {
                $table->index('email', 'idx_students_email');
            }

            if (! in_array('idx_students_full_name', $existingStudents, true)) {
                $table->index('full_name', 'idx_students_full_name');
            }

            if (! in_array('ft_students_longtext', $existingStudents, true) && \Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
                $table->fullText(['address', 'note'], 'ft_students_longtext');
            }
        });

        $existingTeachers = array_column(Schema::getIndexes('teachers'), 'name');

        Schema::table('teachers', function (Blueprint $table) use ($existingTeachers) {
            if (! in_array('idx_teachers_phone', $existingTeachers, true)) {
                $table->index('phone', 'idx_teachers_phone');
            }

            if (! in_array('idx_teachers_email', $existingTeachers, true)) {
                $table->index('email', 'idx_teachers_email');
            }

            if (! in_array('idx_teachers_full_name', $existingTeachers, true)) {
                $table->index('full_name', 'idx_teachers_full_name');
            }

            if (! in_array('idx_teachers_specialization', $existingTeachers, true)) {
                $table->index('specialization', 'idx_teachers_specialization');
            }

            if (! in_array('ft_teachers_note', $existingTeachers, true) && \Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
                $table->fullText('note', 'ft_teachers_note');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $existingStudents = array_column(Schema::getIndexes('students'), 'name');

        Schema::table('students', function (Blueprint $table) use ($existingStudents) {
            if (in_array('idx_students_phone', $existingStudents, true)) {
                $table->dropIndex('idx_students_phone');
            }

            if (in_array('idx_students_email', $existingStudents, true)) {
                $table->dropIndex('idx_students_email');
            }

            if (in_array('idx_students_full_name', $existingStudents, true)) {
                $table->dropIndex('idx_students_full_name');
            }

            if (in_array('ft_students_longtext', $existingStudents, true)) {
                $table->dropFullText('ft_students_longtext');
            }
        });

        $existingTeachers = array_column(Schema::getIndexes('teachers'), 'name');

        Schema::table('teachers', function (Blueprint $table) use ($existingTeachers) {
            if (in_array('idx_teachers_phone', $existingTeachers, true)) {
                $table->dropIndex('idx_teachers_phone');
            }

            if (in_array('idx_teachers_email', $existingTeachers, true)) {
                $table->dropIndex('idx_teachers_email');
            }

            if (in_array('idx_teachers_full_name', $existingTeachers, true)) {
                $table->dropIndex('idx_teachers_full_name');
            }

            if (in_array('idx_teachers_specialization', $existingTeachers, true)) {
                $table->dropIndex('idx_teachers_specialization');
            }

            if (in_array('ft_teachers_note', $existingTeachers, true)) {
                $table->dropFullText('ft_teachers_note');
            }
        });
    }
};
