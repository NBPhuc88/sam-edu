<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('class_sessions', function (Blueprint $table) {
            $table->string('status', 30)->default('scheduled')->change();
        });

        // Backfill: Any past session without attendance that was 'scheduled' is marked 'unattended'
        $today       = now()->toDateString();
        $currentTime = now()->toTimeString();

        DB::table('class_sessions')
            ->where('status', 'scheduled')
            ->where(function ($query) use ($today, $currentTime) {
                $query->where('session_date', '<', $today)
                    ->orWhere(function ($q) use ($today, $currentTime) {
                        $q->where('session_date', '=', $today)
                            ->where('end_time', '<', $currentTime);
                    });
            })
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('attendances')
                    ->whereColumn('attendances.session_id', 'class_sessions.id');
            })
            ->update(['status' => 'unattended']);

        // Any past session WITH attendance that was not marked completed
        DB::table('class_sessions')
            ->whereIn('status', ['scheduled', 'unattended'])
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('attendances')
                    ->whereColumn('attendances.session_id', 'class_sessions.id');
            })
            ->update(['status' => 'completed']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('class_sessions')
            ->where('status', 'unattended')
            ->update(['status' => 'scheduled']);

        DB::table('class_sessions')
            ->where('status', 'in_progress')
            ->update(['status' => 'scheduled']);

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'rescheduled'])->default('scheduled')->change();
        });
    }
};
