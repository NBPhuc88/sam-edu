<?php

namespace App\Console\Commands;

use App\Services\ClassExam\ClassExamServiceInterface;
use Illuminate\Console\Command;

class UpdateClassExamStatusCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'class-exams:update-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động cập nhật trạng thái các kỳ thi lớp (Đang diễn ra, Đã kết thúc) theo thời gian thực';

    public function __construct(
        protected ClassExamServiceInterface $classExamService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Đang quét và cập nhật trạng thái các kỳ thi lớp...');

        $stats = $this->classExamService->autoUpdateClassExamStatuses();

        $this->info("✓ Đã chuyển {$stats['ongoing']} kỳ thi sang trạng thái Đang diễn ra (ongoing).");
        $this->info("✓ Đã chuyển {$stats['completed']} kỳ thi sang trạng thái Đã kết thúc (completed).");

        return self::SUCCESS;
    }
}
