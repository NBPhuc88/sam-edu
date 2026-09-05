<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('game_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('host_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->foreignId('host_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->string('code')->nullable()->unique();
            $table->string('pin', 6)->unique();
            $table->string('name');
            $table->unsignedTinyInteger('question_time_limit')->default(20);
            $table->unsignedTinyInteger('countdown_seconds')->default(5);
            $table->json('scoring_rules');
            $table->json('questions');
            $table->unsignedTinyInteger('status')->default(1)->index();
            $table->unsignedInteger('question_index')->default(0);
            $table->timestamp('question_started_at', 6)->nullable();
            $table->timestamp('expires_at', 6)->nullable();
            $table->timestamps();
            $table->index(['center_id', 'status']);
        });
        Schema::create('game_room_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('total_score')->default(0);
            $table->unsignedInteger('streak_count')->default(0);
            $table->timestamps();
            $table->unique(['game_room_id', 'student_id']);
            $table->index(['game_room_id', 'total_score']);
        });
        Schema::create('game_room_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_room_participant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('question_index');
            $table->json('answer')->nullable();
            $table->decimal('response_seconds', 8, 3);
            $table->boolean('is_correct');
            $table->unsignedInteger('points');
            $table->timestamps();
            $table->unique(['game_room_participant_id', 'question_index'], 'game_answer_unique');
            $table->index(['game_room_id', 'question_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_room_answers');
        Schema::dropIfExists('game_room_participants');
        Schema::dropIfExists('game_rooms');
    }
};
