<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('username', 100)->unique();
            $table->string('email', 255)->unique()->nullable();
            $table->string('password', 255);
            $table->enum('status', ['active', 'inactive', 'locked'])->default('active');
            $table->dateTime('last_login_at')->nullable();
            $table->string('admin_code', 50)->unique();
            $table->string('full_name', 255);
            $table->string('phone', 30)->nullable();
            $table->string('avatar', 500)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admins');
    }
};
