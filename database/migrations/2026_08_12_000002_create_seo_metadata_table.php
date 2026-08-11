<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     *
     * Bảng seo_metadata quản lý Meta Tags, Titles, Keywords, Descriptions
     * cho từng route/trang công khai trên hệ thống từ Quản trị viên.
     */
    public function up(): void
    {
        Schema::create('seo_metadata', function (Blueprint $table) {
            $table->id();
            $table->string('route_name', 100)->unique();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->text('keywords')->nullable();
            $table->string('og_image', 500)->nullable();
            $table->string('canonical_url', 500)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seo_metadata');
    }
};
