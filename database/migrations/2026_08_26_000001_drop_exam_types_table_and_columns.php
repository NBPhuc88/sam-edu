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
        Schema::table('exams', function (Blueprint $table) {
            if (Schema::hasColumn('exams', 'exam_type_id')) {
                $table->dropForeign(['exam_type_id']);
                $table->dropColumn('exam_type_id');
            }
        });

        Schema::dropIfExists('exam_types');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('exam_types')) {
            Schema::create('exam_types', function (Blueprint $table) {
                $table->id();
                $table->foreignId('center_id')->constrained('centers')->cascadeOnDelete();
                $table->string('code', 50);
                $table->string('name', 255);
                $table->text('description')->nullable();
                $table->string('status', 20)->default('active');
                $table->timestamps();
                $table->softDeletes();

                $table->unique(['center_id', 'code', 'deleted_at']);
            });
        }

        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'exam_type_id')) {
                $table->foreignId('exam_type_id')->nullable()->after('name')->constrained('exam_types')->nullOnDelete();
            }
        });
    }
};
