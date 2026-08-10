<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->decimal('score', 5, 2)->nullable();
            $table->string('grade', 20)->nullable();
            $table->text('comment')->nullable();
            $table->foreignId('entered_by_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->foreignId('entered_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->dateTime('entered_at')->nullable();
            $table->foreignId('updated_by_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->foreignId('updated_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamps();

            $table->unique(['exam_id', 'student_id']);
            $table->index('student_id');
            $table->index('exam_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_results');
    }
};
