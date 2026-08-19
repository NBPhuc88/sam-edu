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
        Schema::table('exam_questions', function (Blueprint $table) {
            if (! Schema::hasColumn('exam_questions', 'skill')) {
                $table->string('skill', 50)->default('reading')->after('question_type');
                $table->index(['exam_id', 'skill']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exam_questions', function (Blueprint $table) {
            if (Schema::hasColumn('exam_questions', 'skill')) {
                $table->dropIndex(['exam_id', 'skill']);
                $table->dropColumn('skill');
            }
        });
    }
};
