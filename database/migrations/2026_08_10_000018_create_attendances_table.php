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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('class_sessions')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->enum('status', ['present', 'absent', 'late', 'excused', 'leave']);
            $table->dateTime('check_in_at')->nullable();
            $table->dateTime('check_out_at')->nullable();
            $table->text('note')->nullable();
            $table->foreignId('marked_by_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->foreignId('marked_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->dateTime('marked_at')->nullable();
            $table->timestamps();

            $table->unique(['session_id', 'student_id']);
            $table->index(['student_id', 'status']);
            $table->index(['session_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
