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
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained('centers')->cascadeOnDelete();
            $table->foreignId('center_subscription_id')->nullable()->constrained('center_subscriptions')->nullOnDelete();
            $table->string('app_trans_id', 100)->unique();
            $table->enum('payment_method', ['zalopay', 'bank_transfer', 'cash', 'other'])->default('zalopay');
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending', 'success', 'failed', 'refunded'])->default('pending');
            $table->string('zp_trans_id', 255)->nullable();
            $table->json('payload')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();

            $table->index(['center_id', 'status']);
            $table->index('app_trans_id');
            $table->index('zp_trans_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
