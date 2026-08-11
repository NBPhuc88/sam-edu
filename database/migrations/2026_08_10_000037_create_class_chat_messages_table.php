<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('class_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('sender_type'); // 'admin', 'teacher', 'student'
            $table->unsignedBigInteger('sender_id');
            $table->string('sender_name');
            $table->string('sender_avatar')->nullable();
            $table->text('message');
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('pinned_at')->nullable();
            $table->string('pinned_by_name')->nullable();
            $table->timestamps();

            $table->index(['class_id', 'created_at']);
            $table->index(['class_id', 'is_pinned']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_chat_messages');
    }
};
