<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'exam_type_id')) {
                $table->foreignId('exam_type_id')->nullable()->after('name')->constrained('exam_types')->nullOnDelete();
            }
        });

        // Migrate existing exam_type string to matching exam_types.id if exists
        if (Schema::hasColumn('exams', 'exam_type')) {
            $examTypes = DB::table('exam_types')->get();

            foreach ($examTypes as $type) {
                DB::table('exams')
                    ->where('exam_type', $type->code)
                    ->update(['exam_type_id' => $type->id]);
            }

            Schema::table('exams', function (Blueprint $table) {
                $table->dropColumn('exam_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (! Schema::hasColumn('exams', 'exam_type')) {
                $table->string('exam_type', 50)->default('general')->after('name');
            }

            if (Schema::hasColumn('exams', 'exam_type_id')) {
                $table->dropForeign(['exam_type_id']);
                $table->dropColumn('exam_type_id');
            }
        });
    }
};
