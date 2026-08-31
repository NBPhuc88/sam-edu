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
        Schema::table('class_subjects', function (Blueprint $table) {
            if (! Schema::hasColumn('class_subjects', 'discount_type')) {
                $table->unsignedTinyInteger('discount_type')->nullable()->after('tuition_fee');
            }

            if (! Schema::hasColumn('class_subjects', 'discount_value')) {
                $table->decimal('discount_value', 12, 2)->nullable()->default(0)->after('discount_type');
            }
        });

        Schema::table('student_tuitions', function (Blueprint $table) {
            if (! Schema::hasColumn('student_tuitions', 'discount_type')) {
                $table->unsignedTinyInteger('discount_type')->nullable()->after('total_amount');
            }

            if (! Schema::hasColumn('student_tuitions', 'discount_value')) {
                $table->decimal('discount_value', 12, 2)->nullable()->default(0)->after('discount_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_subjects', function (Blueprint $table) {
            if (Schema::hasColumn('class_subjects', 'discount_value')) {
                $table->dropColumn('discount_value');
            }

            if (Schema::hasColumn('class_subjects', 'discount_type')) {
                $table->dropColumn('discount_type');
            }
        });

        Schema::table('student_tuitions', function (Blueprint $table) {
            if (Schema::hasColumn('student_tuitions', 'discount_value')) {
                $table->dropColumn('discount_value');
            }

            if (Schema::hasColumn('student_tuitions', 'discount_type')) {
                $table->dropColumn('discount_type');
            }
        });
    }
};
