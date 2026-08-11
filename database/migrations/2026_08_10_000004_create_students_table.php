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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('username', 100)->unique();
            $table->string('email', 255)->unique()->nullable();
            $table->string('password', 255);
            $table->enum('status', ['active', 'inactive', 'locked', 'graduated', 'suspended'])->default('active');
            $table->dateTime('last_login_at')->nullable();
            $table->string('student_code', 50);
            $table->foreignId('center_id')->constrained('centers')->cascadeOnDelete();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('full_name', 255);
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();
            $table->string('avatar', 500)->nullable();

            // Guardian / Parent contact info
            $table->string('parent_name', 255)->nullable();
            $table->string('parent_phone', 30)->nullable();
            $table->string('parent_relationship', 50)->nullable();

            $table->date('admission_date')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['center_id', 'student_code']);
            $table->index('phone', 'idx_students_phone');
            $table->index('email', 'idx_students_email');
            $table->index('full_name', 'idx_students_full_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
