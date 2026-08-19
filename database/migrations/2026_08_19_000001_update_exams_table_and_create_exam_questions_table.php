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
        // 1. Cập nhật bảng exams
        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'center_id')) {
                $table->foreignId('center_id')->nullable()->after('id')->constrained('centers')->cascadeOnDelete();
            }

            if (! Schema::hasColumn('exams', 'class_id')) {
                $table->foreignId('class_id')->nullable()->after('center_id')->constrained('classes')->nullOnDelete();
            }

            if (! Schema::hasColumn('exams', 'subject_id')) {
                $table->foreignId('subject_id')->nullable()->after('class_id')->constrained('subjects')->nullOnDelete();
            }

            if (! Schema::hasColumn('exams', 'code')) {
                $table->string('code', 50)->nullable()->after('subject_id');
            }

            if (! Schema::hasColumn('exams', 'exam_type')) {
                $table->string('exam_type', 50)->default('general')->after('name');
            }

            if (! Schema::hasColumn('exams', 'duration_minutes')) {
                $table->integer('duration_minutes')->nullable()->default(45)->after('exam_type');
            }

            if (! Schema::hasColumn('exams', 'pass_score')) {
                $table->decimal('pass_score', 5, 2)->nullable()->after('max_score');
            }

            if (! Schema::hasColumn('exams', 'shuffle_questions')) {
                $table->boolean('shuffle_questions')->default(false)->after('pass_score');
            }

            if (! Schema::hasColumn('exams', 'shuffle_options')) {
                $table->boolean('shuffle_options')->default(false)->after('shuffle_questions');
            }

            if (! Schema::hasColumn('exams', 'max_attempts')) {
                $table->integer('max_attempts')->default(1)->after('shuffle_options');
            }
        });

        // Thay đổi class_subject_id và exam_date thành nullable
        try {
            Schema::table('exams', function (Blueprint $table) {
                $table->unsignedBigInteger('class_subject_id')->nullable()->change();
                $table->date('exam_date')->nullable()->change();
            });
        } catch (\Throwable $e) {
            try {
                \Illuminate\Support\Facades\DB::statement('ALTER TABLE `exams` MODIFY `exam_date` DATE NULL;');
                \Illuminate\Support\Facades\DB::statement('ALTER TABLE `exams` MODIFY `class_subject_id` BIGINT UNSIGNED NULL;');
            } catch (\Throwable $e2) {
            }
        }

        // Tạo index cho bảng exams
        try {
            Schema::table('exams', function (Blueprint $table) {
                $table->index(['center_id', 'status']);
                $table->index(['center_id', 'code']);
            });
        } catch (\Throwable $e) {
        }

        // 2. Tạo bảng exam_questions
        if (! Schema::hasTable('exam_questions')) {
            Schema::create('exam_questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
                $table->string('code', 50)->nullable();
                $table->string('question_type', 50)->default('single_choice');
                $table->text('content');
                $table->string('image_url', 500)->nullable();
                $table->string('audio_url', 500)->nullable();
                $table->decimal('score', 5, 2)->default(1.00);
                $table->json('options')->nullable();
                $table->json('correct_answer')->nullable();
                $table->text('explanation')->nullable();
                $table->json('metadata')->nullable();
                $table->integer('order_index')->default(0);
                $table->timestamps();

                $table->index(['exam_id', 'order_index']);
                $table->index(['exam_id', 'question_type']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_questions');

        Schema::table('exams', function (Blueprint $table) {
            $table->dropIndex(['center_id', 'status']);
            $table->dropIndex(['center_id', 'code']);
            $table->dropConstrainedForeignId('center_id');
            $table->dropConstrainedForeignId('class_id');
            $table->dropConstrainedForeignId('subject_id');
            $table->dropColumn([
                'code',
                'exam_type',
                'duration_minutes',
                'pass_score',
                'shuffle_questions',
                'shuffle_options',
                'max_attempts',
            ]);
        });
    }
};
