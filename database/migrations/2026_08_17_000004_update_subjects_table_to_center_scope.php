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
        // 1. Cập nhật bảng class_subjects để trỏ trực tiếp sang subjects
        if (Schema::hasTable('class_subjects')) {
            Schema::table('class_subjects', function (Blueprint $table) {
                if (Schema::hasColumn('class_subjects', 'center_subject_id')) {
                    $table->dropForeign(['center_subject_id']);
                    $table->dropColumn('center_subject_id');
                }

                if (! Schema::hasColumn('class_subjects', 'subject_id')) {
                    $table->foreignId('subject_id')->after('class_id')->constrained('subjects')->cascadeOnDelete();
                    $table->unique(['class_id', 'subject_id']);
                }
            });
        }

        // 2. Xóa bảng center_subjects trung gian nếu tồn tại
        Schema::dropIfExists('center_subjects');

        // 3. Cập nhật bảng subjects thành bảng môn học trực thuộc từng trung tâm
        Schema::table('subjects', function (Blueprint $table) {
            if (! Schema::hasColumn('subjects', 'center_id')) {
                $table->foreignId('center_id')->after('id')->constrained('centers')->cascadeOnDelete();
            }

            if (! Schema::hasColumn('subjects', 'total_sessions')) {
                $table->integer('total_sessions')->nullable()->after('description');
            }

            if (! Schema::hasColumn('subjects', 'duration_minutes')) {
                $table->integer('duration_minutes')->nullable()->after('total_sessions');
            }

            if (! Schema::hasColumn('subjects', 'tuition_fee')) {
                $table->decimal('tuition_fee', 12, 2)->nullable()->after('duration_minutes');
            }

            // Đổi unique code toàn cục thành unique theo từng trung tâm
            $table->dropUnique(['code']);
            $table->unique(['center_id', 'code']);
            $table->index(['center_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropUnique(['center_id', 'code']);
            $table->unique(['code']);
            $table->dropConstrainedForeignId('center_id');
            $table->dropColumn(['total_sessions', 'duration_minutes', 'tuition_fee']);
        });
    }
};
