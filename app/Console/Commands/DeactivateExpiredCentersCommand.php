<?php

namespace App\Console\Commands;

use App\Services\Center\CenterServiceInterface;
use Illuminate\Console\Command;

class DeactivateExpiredCentersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'centers:deactivate-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động chuyển trạng thái các trung tâm hết hạn (expires_at <= now) sang expired';

    public function __construct(
        protected CenterServiceInterface $centerService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Đang quét các trung tâm hết hạn gói dịch vụ...');

        $count = $this->centerService->deactivateExpiredCenters();

        if ($count > 0) {
            $this->info("✓ Đã chuyển {$count} trung tâm hết hạn sang trạng thái expired.");
        } else {
            $this->info('✓ Không có trung tâm nào cần cập nhật.');
        }

        return self::SUCCESS;
    }
}
