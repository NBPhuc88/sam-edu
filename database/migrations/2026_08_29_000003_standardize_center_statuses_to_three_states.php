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

        $type = strtolower((string) Schema::getColumnType('centers', 'status'));
        $isNumeric = in_array($type, ['integer', 'tinyint', 'smallint', 'bigint', 'int'], true);

        if ($isNumeric) {
            // Map old 3 (pending_payment) to 2 (Paused) first before 4 is mapped to 3
            DB::table('centers')->where('status', 3)->update(['status' => Constant::CENTER_STATUS_PAUSED]);

            // Map old 4 (expired) to 3 (Expired)
            DB::table('centers')->where('status', 4)->update(['status' => Constant::CENTER_STATUS_EXPIRED]);

            // Map old 0 (locked / inactive) to 2 (Paused)
            DB::table('centers')->where('status', 0)->update(['status' => Constant::CENTER_STATUS_PAUSED]);

            // Ensure active centers are 1
            DB::table('centers')->where('status', 1)->update(['status' => Constant::CENTER_STATUS_ACTIVE]);
        } else {
            // In case the column is still string/varchar/enum
            DB::table('centers')->whereIn('status', ['3', 'pending_payment'])->update(['status' => Constant::CENTER_STATUS_PAUSED]);
            DB::table('centers')->whereIn('status', ['4', 'expired'])->update(['status' => Constant::CENTER_STATUS_EXPIRED]);
            DB::table('centers')->whereIn('status', ['0', 'locked', 'inactive', 'suspended'])->update(['status' => Constant::CENTER_STATUS_PAUSED]);
            DB::table('centers')->whereIn('status', ['1', 'active'])->update(['status' => Constant::CENTER_STATUS_ACTIVE]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversible mapping if needed
    }
};
