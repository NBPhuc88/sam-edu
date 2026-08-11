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
            if (! Schema::hasColumn('centers', 'username')) {
                $table->string('username', 100)->unique()->nullable()->after('name');
            }

            if (! Schema::hasColumn('centers', 'password')) {
                $table->string('password', 255)->nullable()->after('username');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('centers', function (Blueprint $table) {
            if (Schema::hasColumn('centers', 'username')) {
                $table->dropColumn('username');
            }

            if (Schema::hasColumn('centers', 'password')) {
                $table->dropColumn('password');
            }
        });
    }
};
