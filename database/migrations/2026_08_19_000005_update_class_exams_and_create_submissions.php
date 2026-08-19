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
        // 1. Cập nhật bảng class_exams
        Schema::table('class_exams', function (Blueprint $table) {
            if (! Schema::hasColumn('class_exams', 'code')) {
                $table->string('code', 50)->nullable()->after('id')->unique();
            }

            if (! Schema::hasColumn('class_exams', 'access_code')) {
                $table->string('access_code', 20)->nullable()->after('code')->index();
            }

            if (! Schema::hasColumn('class_exams', 'valid_from')) {
                $table->dateTime('valid_from')->nullable()->after('end_time');
            }

            if (! Schema::hasColumn('class_exams', 'valid_to')) {
                $table->dateTime('valid_to')->nullable()->after('valid_from');
            }
        });

        // 2. Tạo bảng class_exam_submissions
        if (! Schema::hasTable('class_exam_submissions')) {
            Schema::create('class_exam_submissions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('class_exam_id')->constrained('class_exams')->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->integer('attempt_number')->default(1);
                $table->dateTime('started_at')->nullable();
                $table->dateTime('submitted_at')->nullable();
                $table->integer('duration_seconds_used')->default(0);
                $table->decimal('score', 5, 2)->nullable();
                $table->integer('total_correct')->default(0);
                $table->integer('total_questions')->default(0);
                $table->enum('status', ['in_progress', 'submitted', 'timeout_submitted', 'missed'])->default('in_progress');
                $table->json('answers')->nullable();
                $table->json('grading_details')->nullable();
                $table->timestamps();

                $table->unique(['class_exam_id', 'student_id', 'attempt_number'], 'class_exam_student_attempt_unique');
                $table->index(['class_exam_id', 'status']);
                $table->index(['student_id', 'status']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_exam_submissions');

        Schema::table('class_exams', function (Blueprint $table) {
            if (Schema::hasColumn('class_exams', 'valid_to')) {
                $table->dropColumn('valid_to');
            }

            if (Schema::hasColumn('class_exams', 'valid_from')) {
                $table->dropColumn('valid_from');
            }

            if (Schema::hasColumn('class_exams', 'access_code')) {
                $table->dropColumn('access_code');
            }

            if (Schema::hasColumn('class_exams', 'code')) {
                $table->dropColumn('code');
            }
        });
    }
};
