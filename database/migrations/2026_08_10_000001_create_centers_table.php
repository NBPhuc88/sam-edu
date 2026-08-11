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
