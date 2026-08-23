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
        Schema::table('centers', function (Blueprint $table) {
            if (! Schema::hasColumn('centers', 'plan_type')) {
                $table->enum('plan_type', ['trial', 'basic', 'advanced'])->default('trial')->after('subscription_plan');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('centers', function (Blueprint $table) {
            if (Schema::hasColumn('centers', 'plan_type')) {
                $table->dropColumn('plan_type');
            }
        });
    }
};
