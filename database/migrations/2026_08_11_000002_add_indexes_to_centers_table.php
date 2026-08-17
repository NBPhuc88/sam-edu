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
        $existing = array_column(Schema::getIndexes('centers'), 'name');

        Schema::table('centers', function (Blueprint $table) use ($existing) {
            if (! in_array('idx_centers_phone', $existing, true)) {
                $table->index('phone', 'idx_centers_phone');
            }

            if (! in_array('idx_centers_email', $existing, true)) {
                $table->index('email', 'idx_centers_email');
            }

            if (! in_array('idx_centers_name', $existing, true)) {
                $table->index('name', 'idx_centers_name');
            }

            if (! in_array('ft_centers_address', $existing, true) && \Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
                $table->fullText('address', 'ft_centers_address');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $existing = array_column(Schema::getIndexes('centers'), 'name');

        Schema::table('centers', function (Blueprint $table) use ($existing) {
            if (in_array('idx_centers_phone', $existing, true)) {
                $table->dropIndex('idx_centers_phone');
            }

            if (in_array('idx_centers_email', $existing, true)) {
                $table->dropIndex('idx_centers_email');
            }

            if (in_array('idx_centers_name', $existing, true)) {
                $table->dropIndex('idx_centers_name');
            }

            if (in_array('ft_centers_address', $existing, true)) {
                $table->dropFullText('ft_centers_address');
            }
        });
    }
};
