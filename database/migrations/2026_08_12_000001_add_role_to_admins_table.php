<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     *
     * Thêm cột role vào bảng admins theo kiến trúc AGENTS.md:
     * - KHÔNG dùng RBAC động (bảng roles, permissions, admin_roles...)
     * - Role được lưu trực tiếp vào cột admins.role
     * - Chỉ có 2 giá trị: super_admin (quyền cao nhất) | admin (quyền vừa)
     */
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->enum('role', ['super_admin', 'admin'])->default('admin')->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
