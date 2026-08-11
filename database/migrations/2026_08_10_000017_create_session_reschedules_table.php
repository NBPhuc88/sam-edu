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
        Schema::create('session_reschedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('class_sessions')->cascadeOnDelete();
            $table->date('old_date');
            $table->time('old_start_time');
            $table->time('old_end_time');
            $table->foreignId('old_room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->date('new_date');
            $table->time('new_start_time');
            $table->time('new_end_time');
            $table->foreignId('new_room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->text('reason')->nullable();
            $table->foreignId('changed_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->foreignId('changed_by_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->dateTime('changed_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_reschedules');
    }
};
