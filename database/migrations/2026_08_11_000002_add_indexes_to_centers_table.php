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
        Schema::table('centers', function (Blueprint $table) {
            $table->index('phone', 'idx_centers_phone');
            $table->index('email', 'idx_centers_email');
            $table->index('name', 'idx_centers_name');
            $table->fullText('address', 'ft_centers_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('centers', function (Blueprint $table) {
            $table->dropIndex('idx_centers_phone');
            $table->dropIndex('idx_centers_email');
            $table->dropIndex('idx_centers_name');
            $table->dropFullText('ft_centers_address');
        });
    }
};
