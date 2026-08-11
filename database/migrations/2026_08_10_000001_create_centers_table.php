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
        Schema::create('centers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->string('username', 100)->unique()->nullable();
            $table->string('password', 255)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 255)->nullable();
            $table->text('address')->nullable();
            $table->enum('status', ['active', 'inactive', 'expired', 'suspended'])->default('active');

            // SaaS Leasing & Subscriptions
            $table->string('subscription_plan', 100)->default('basic');
            $table->dateTime('expires_at')->nullable();
            $table->dateTime('trial_ends_at')->nullable();
            $table->integer('max_students')->nullable();
            $table->integer('max_classes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('phone', 'idx_centers_phone');
            $table->index('email', 'idx_centers_email');
            $table->index('name', 'idx_centers_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('centers');
    }
};
