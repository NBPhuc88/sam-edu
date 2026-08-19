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
        if (! Schema::hasTable('class_exams')) {
            Schema::create('class_exams', function (Blueprint $table) {
                $table->id();
                $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
                $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
                $table->string('title', 255); // Ví dụ: "Bài thi giữa kỳ 1", "Kiểm tra 15 phút", "Final Exam"
                $table->date('exam_date');
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->integer('duration_minutes')->nullable();
                $table->decimal('max_score', 5, 2)->default(10.00);
                $table->decimal('pass_score', 5, 2)->nullable();
                $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
                $table->foreignId('created_by_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
                $table->foreignId('created_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['class_id', 'exam_date']);
                $table->index(['status', 'exam_date']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_exams');
    }
};
