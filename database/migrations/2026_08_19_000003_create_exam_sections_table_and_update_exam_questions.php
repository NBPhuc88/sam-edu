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
        // 1. Tạo bảng exam_sections
        if (! Schema::hasTable('exam_sections')) {
            Schema::create('exam_sections', function (Blueprint $table) {
                $table->id();
                $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
                $table->string('title', 255);
                $table->text('description')->nullable();
                $table->string('skill', 50)->default('reading');
                $table->integer('order_index')->default(0);
                $table->timestamps();

                $table->index(['exam_id', 'order_index']);
            });
        }

        // 2. Thêm cột section_id vào exam_questions
        if (Schema::hasTable('exam_questions')) {
            Schema::table('exam_questions', function (Blueprint $table) {
                if (! Schema::hasColumn('exam_questions', 'section_id')) {
                    $table->foreignId('section_id')
                        ->nullable()
                        ->after('exam_id')
                        ->constrained('exam_sections')
                        ->nullOnDelete();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('exam_questions')) {
            Schema::table('exam_questions', function (Blueprint $table) {
                if (Schema::hasColumn('exam_questions', 'section_id')) {
                    $table->dropConstrainedForeignId('section_id');
                }
            });
        }

        Schema::dropIfExists('exam_sections');
    }
};
