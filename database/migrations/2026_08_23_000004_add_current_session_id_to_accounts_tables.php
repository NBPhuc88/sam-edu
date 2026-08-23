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
        if (Schema::hasTable('admins') && ! Schema::hasColumn('admins', 'current_session_id')) {
            Schema::table('admins', function (Blueprint $table) {
                $table->string('current_session_id', 255)->nullable()->after('last_login_at');
            });
        }

        if (Schema::hasTable('teachers') && ! Schema::hasColumn('teachers', 'current_session_id')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->string('current_session_id', 255)->nullable()->after('last_login_at');
            });
        }

        if (Schema::hasTable('students') && ! Schema::hasColumn('students', 'current_session_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('current_session_id', 255)->nullable()->after('last_login_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('admins') && Schema::hasColumn('admins', 'current_session_id')) {
            Schema::table('admins', function (Blueprint $table) {
                $table->dropColumn('current_session_id');
            });
        }

        if (Schema::hasTable('teachers') && Schema::hasColumn('teachers', 'current_session_id')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->dropColumn('current_session_id');
            });
        }

        if (Schema::hasTable('students') && Schema::hasColumn('students', 'current_session_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('current_session_id');
            });
        }
    }
};
