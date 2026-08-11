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
        Schema::table('students', function (Blueprint $table) {
            $table->index('phone', 'idx_students_phone');
            $table->index('email', 'idx_students_email');
            $table->index('full_name', 'idx_students_full_name');
            $table->fullText(['address', 'note'], 'ft_students_longtext');
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->index('phone', 'idx_teachers_phone');
            $table->index('email', 'idx_teachers_email');
            $table->index('full_name', 'idx_teachers_full_name');
            $table->index('specialization', 'idx_teachers_specialization');
            $table->fullText('note', 'ft_teachers_note');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex('idx_students_phone');
            $table->dropIndex('idx_students_email');
            $table->dropIndex('idx_students_full_name');
            $table->dropFullText('ft_students_longtext');
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropIndex('idx_teachers_phone');
            $table->dropIndex('idx_teachers_email');
            $table->dropIndex('idx_teachers_full_name');
            $table->dropIndex('idx_teachers_specialization');
            $table->dropFullText('ft_teachers_note');
        });
    }
};
