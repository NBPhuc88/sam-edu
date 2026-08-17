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
        Schema::create('student_tuitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('center_id')->constrained('centers')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('remaining_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'partial', 'completed', 'overdue'])->default('pending');
            $table->date('due_date')->nullable();
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['center_id', 'status']);
            $table->index(['student_id', 'class_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_tuitions');
    }
};
