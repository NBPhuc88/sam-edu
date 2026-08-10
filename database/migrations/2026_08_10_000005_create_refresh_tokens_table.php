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
        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->id();
            $table->enum('tokenable_type', ['admin', 'teacher', 'student']);
            $table->unsignedBigInteger('tokenable_id');
            $table->string('token_hash', 255)->unique();
            $table->string('device_id', 255)->nullable();
            $table->string('device_name', 255)->nullable();
            $table->enum('device_type', ['web', 'ios', 'android', 'desktop', 'other'])->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->dateTime('expires_at');
            $table->dateTime('revoked_at')->nullable();
            $table->dateTime('last_used_at')->nullable();
            $table->foreignId('replaced_by_token_id')->nullable()->constrained('refresh_tokens')->nullOnDelete();
            $table->timestamps();

            $table->index(['tokenable_type', 'tokenable_id']);
            $table->index('device_id');
            $table->index('expires_at');
            $table->index('revoked_at');
            $table->index(['tokenable_type', 'tokenable_id', 'revoked_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refresh_tokens');
    }
};
