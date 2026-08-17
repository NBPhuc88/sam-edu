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
        Schema::table('centers', function (Blueprint $table) {
            if (Schema::hasColumn('centers', 'username')) {
                // Drop unique index if exists
                try {
                    $table->dropUnique(['username']);
                } catch (\Throwable $e) {
                    // Ignore if unique index was already dropped or has different name
                }
                $table->dropColumn('username');
            }

            if (Schema::hasColumn('centers', 'password')) {
                $table->dropColumn('password');
            }
        });

        // Update password_reset_otps account_type enum if table exists
        if (Schema::hasTable('password_reset_otps')) {
            try {
                DB::statement("ALTER TABLE password_reset_otps MODIFY COLUMN account_type ENUM('admin', 'teacher', 'student') NOT NULL");
            } catch (\Throwable $e) {
                // Ignore if DB connection is SQLite during tests
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('centers', function (Blueprint $table) {
            if (! Schema::hasColumn('centers', 'username')) {
                $table->string('username', 100)->unique()->nullable()->after('name');
            }

            if (! Schema::hasColumn('centers', 'password')) {
                $table->string('password', 255)->nullable()->after('username');
            }
        });

        if (Schema::hasTable('password_reset_otps')) {
            try {
                DB::statement("ALTER TABLE password_reset_otps MODIFY COLUMN account_type ENUM('admin', 'center', 'teacher', 'student') NOT NULL");
            } catch (\Throwable $e) {
                // Ignore if SQLite
            }
        }
    }
};
