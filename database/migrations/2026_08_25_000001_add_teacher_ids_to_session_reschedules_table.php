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
        Schema::table('session_reschedules', function (Blueprint $table) {
            $table->foreignId('old_teacher_id')->nullable()->after('old_room_id')->constrained('teachers')->nullOnDelete();
            $table->foreignId('new_teacher_id')->nullable()->after('new_room_id')->constrained('teachers')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('session_reschedules', function (Blueprint $table) {
            $table->dropForeign(['old_teacher_id']);
            $table->dropForeign(['new_teacher_id']);
            $table->dropColumn(['old_teacher_id', 'new_teacher_id']);
        });
    }
};
