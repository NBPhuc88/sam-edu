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
        Schema::create('class_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_subject_id')->constrained('class_subjects')->cascadeOnDelete();
            $table->foreignId('class_schedule_id')->nullable()->constrained('class_schedules')->nullOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->date('session_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
            $table->string('topic', 500)->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['class_subject_id', 'session_date']);
            $table->index(['teacher_id', 'session_date']);
            $table->index(['room_id', 'session_date']);
            $table->index(['status', 'session_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_sessions');
    }
};
