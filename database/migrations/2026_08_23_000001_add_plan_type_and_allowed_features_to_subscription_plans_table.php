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
        Schema::table('subscription_plans', function (Blueprint $table) {
            if (! Schema::hasColumn('subscription_plans', 'plan_type')) {
                $table->enum('plan_type', ['trial', 'basic', 'advanced'])->default('basic')->after('name');
            }

            if (! Schema::hasColumn('subscription_plans', 'allowed_features')) {
                $table->json('allowed_features')->nullable()->after('features');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            if (Schema::hasColumn('subscription_plans', 'allowed_features')) {
                $table->dropColumn('allowed_features');
            }

            if (Schema::hasColumn('subscription_plans', 'plan_type')) {
                $table->dropColumn('plan_type');
            }
        });
    }
};
