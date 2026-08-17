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
            if (Schema::hasColumn('subscription_plans', 'duration_months') && ! Schema::hasColumn('subscription_plans', 'duration_days')) {
                $table->renameColumn('duration_months', 'duration_days');
            } elseif (! Schema::hasColumn('subscription_plans', 'duration_days')) {
                $table->integer('duration_days')->default(30)->after('price');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            if (Schema::hasColumn('subscription_plans', 'duration_days') && ! Schema::hasColumn('duration_months')) {
                $table->renameColumn('duration_days', 'duration_months');
            }
        });
    }
};
