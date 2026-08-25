<?php

namespace App\Console\Commands;

use App\Services\Session\ClassSessionServiceInterface;
use Illuminate\Console\Command;

class UpdateClassSessionStatusCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:update-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động cập nhật trạng thái các ca học theo thời gian thực (Đang diễn ra, Đã hoàn thành, Chưa điểm danh)';

    public function __construct(
        protected ClassSessionServiceInterface $sessionService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Đang quét và cập nhật trạng thái các ca học...');

        $stats = $this->sessionService->autoUpdateSessionStatuses();

        $this->info("✓ Đã chuyển {$stats['in_progress']} ca học sang trạng thái Đang diễn ra (in_progress).");
        $this->info("✓ Đã chuyển {$stats['completed']} ca học sang trạng thái Đã hoàn thành (completed).");
        $this->info("✓ Đã chuyển {$stats['unattended']} ca học sang trạng thái Chưa điểm danh (unattended).");

        return self::SUCCESS;
    }
}
