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
        Schema::create('tuition_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_tuition_id')->constrained('student_tuitions')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->date('payment_date');
            $table->enum('payment_method', ['cash', 'bank_transfer', 'momo', 'zalopay', 'credit_card', 'other'])->default('bank_transfer');
            $table->string('transaction_code')->nullable();
            $table->string('note')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['student_tuition_id', 'payment_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tuition_payments');
    }
};
