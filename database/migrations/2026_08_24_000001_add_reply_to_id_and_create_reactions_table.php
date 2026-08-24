<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        // 1. Thêm reply_to_id vào bảng class_chat_messages
        Schema::table('class_chat_messages', function (Blueprint $table) {
            $table->foreignId('reply_to_id')
                ->nullable()
                ->after('class_id')
                ->constrained('class_chat_messages')
                ->nullOnDelete();

            $table->index(['class_id', 'reply_to_id']);
        });

        // 2. Tạo bảng class_chat_message_reactions
        Schema::create('class_chat_message_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('class_chat_messages')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('sender_type'); // 'admin', 'teacher', 'student'
            $table->unsignedBigInteger('sender_id');
            $table->string('sender_name');
            $table->string('emoji', 32); // e.g. '❤️', '👍', '😂', '😮', '😢', '🎉'
            $table->timestamps();

            $table->unique(['message_id', 'sender_type', 'sender_id'], 'chat_msg_reaction_user_unique');
            $table->index(['message_id', 'emoji']);
            $table->index(['class_id', 'message_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_chat_message_reactions');

        Schema::table('class_chat_messages', function (Blueprint $table) {
            $table->dropForeign(['reply_to_id']);
            $table->dropColumn('reply_to_id');
        });
    }
};
