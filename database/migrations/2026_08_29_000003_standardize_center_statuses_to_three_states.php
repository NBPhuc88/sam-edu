<?php

use App\Enums\Constant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('centers') || ! Schema::hasColumn('centers', 'status')) {
            return;
        }

        // Map old 0 (locked / inactive) to 2 (Paused)
        DB::table('centers')->whereIn('status', [0, '0', 'locked', 'inactive', 'suspended'])->update(['status' => Constant::CENTER_STATUS_PAUSED]);

        // Map old 4 (expired) to 3 (Expired)
        DB::table('centers')->whereIn('status', [4, '4', 'expired'])->update(['status' => Constant::CENTER_STATUS_EXPIRED]);

        // Map old 3 (pending_payment) to 2 (Paused)
        DB::table('centers')->whereIn('status', [3, '3', 'pending_payment'])->update(['status' => Constant::CENTER_STATUS_PAUSED]);

        // Ensure active centers are 1
        DB::table('centers')->whereIn('status', [1, '1', 'active'])->update(['status' => Constant::CENTER_STATUS_ACTIVE]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversible mapping if needed
    }
};
