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
        Schema::table('class_exam_submissions', function (Blueprint $table) {
            if (! Schema::hasColumn('class_exam_submissions', 'is_graded')) {
                $table->boolean('is_graded')->default(false)->after('status')->index();
            }

            if (! Schema::hasColumn('class_exam_submissions', 'requires_manual_grading')) {
                $table->boolean('requires_manual_grading')->default(false)->after('is_graded')->index();
            }

            if (! Schema::hasColumn('class_exam_submissions', 'graded_at')) {
                $table->dateTime('graded_at')->nullable()->after('requires_manual_grading');
            }

            if (! Schema::hasColumn('class_exam_submissions', 'graded_by_teacher_id')) {
                $table->foreignId('graded_by_teacher_id')->nullable()->after('graded_at')->constrained('teachers')->nullOnDelete();
            }

            if (! Schema::hasColumn('class_exam_submissions', 'graded_by_admin_id')) {
                $table->foreignId('graded_by_admin_id')->nullable()->after('graded_by_teacher_id')->constrained('admins')->nullOnDelete();
            }

            if (! Schema::hasColumn('class_exam_submissions', 'teacher_feedback')) {
                $table->text('teacher_feedback')->nullable()->after('graded_by_admin_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_exam_submissions', function (Blueprint $table) {
            if (Schema::hasColumn('class_exam_submissions', 'teacher_feedback')) {
                $table->dropColumn('teacher_feedback');
            }

            if (Schema::hasColumn('class_exam_submissions', 'graded_by_admin_id')) {
                $table->dropConstrainedForeignId('graded_by_admin_id');
            }

            if (Schema::hasColumn('class_exam_submissions', 'graded_by_teacher_id')) {
                $table->dropConstrainedForeignId('graded_by_teacher_id');
            }

            if (Schema::hasColumn('class_exam_submissions', 'graded_at')) {
                $table->dropColumn('graded_at');
            }

            if (Schema::hasColumn('class_exam_submissions', 'requires_manual_grading')) {
                $table->dropColumn('requires_manual_grading');
            }

            if (Schema::hasColumn('class_exam_submissions', 'is_graded')) {
                $table->dropColumn('is_graded');
            }
        });
    }
};
