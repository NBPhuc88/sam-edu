<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CleanOldLogsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:clean-old {--days=30 : Số ngày giữ lại log, mặc định 30 ngày (1 tháng)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động dọn dẹp các tệp và thư mục log cũ hơn 1 tháng trong storage/logs';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days               = (int) ($this->option('days') ?: 30);
        $thresholdDate      = Carbon::now()->subDays($days);
        $thresholdTimestamp = $thresholdDate->timestamp;

        $this->info("Bắt đầu quét và xóa log cũ hơn {$days} ngày (trước ngày {$thresholdDate->format('d/m/Y H:i:s')})...");

        $logsDir = storage_path('logs');

        if (! File::isDirectory($logsDir)) {
            $this->warn("Thư mục {$logsDir} không tồn tại.");

            return self::SUCCESS;
        }

        $deletedFilesCount = 0;
        $deletedDirsCount  = 0;
        $bytesFreed        = 0;

        // 1. Quét đệ quy tất cả các file .log trong storage/logs
        $files = File::allFiles($logsDir);

        foreach ($files as $file) {
            $filePath  = $file->getRealPath();
            $fileMtime = $file->getMTime();
            $fileSize  = $file->getSize();

            // Kiểm tra nếu file là .gitignore thì bỏ qua
            if ($file->getFilename() === '.gitignore') {
                continue;
            }

            $isOld = false;

            // Kiểm tra mtime của file
            if ($fileMtime < $thresholdTimestamp) {
                $isOld = true;
            } else {
                // Kiểm tra nếu đường dẫn có dạng /YYYY-MM/D.log
                $relativePath = str_replace($logsDir . DIRECTORY_SEPARATOR, '', $filePath);
                $parts        = explode(DIRECTORY_SEPARATOR, $relativePath);

                if (count($parts) >= 2) {
                    $yearMonth = $parts[count($parts) - 2];
                    $fileName  = $parts[count($parts) - 1];
                    $day       = pathinfo($fileName, PATHINFO_FILENAME);

                    if (preg_match('/^\d{4}-\d{2}$/', $yearMonth) && is_numeric($day)) {
                        try {
                            $fileDate = Carbon::createFromFormat('Y-m-j', "{$yearMonth}-{$day}")->endOfDay();

                            if ($fileDate->timestamp < $thresholdTimestamp) {
                                $isOld = true;
                            }
                        } catch (\Throwable) {
                            // Bỏ qua nếu parse thất bại, dựa vào fileMtime
                        }
                    }
                }
            }

            if ($isOld) {
                if (@unlink($filePath)) {
                    $deletedFilesCount++;
                    $bytesFreed += $fileSize;
                }
            }
        }

        // 2. Dọn dẹp các thư mục rỗng trong storage/logs
        $directories = File::directories($logsDir);

        foreach ($directories as $categoryDir) {
            $subDirs = File::directories($categoryDir);

            foreach ($subDirs as $subDir) {
                if (count(File::allFiles($subDir)) === 0 && count(File::directories($subDir)) === 0) {
                    if (@rmdir($subDir)) {
                        $deletedDirsCount++;
                    }
                }
            }

            // Nếu thư mục category cũng rỗng
            if (count(File::allFiles($categoryDir)) === 0 && count(File::directories($categoryDir)) === 0) {
                if (@rmdir($categoryDir)) {
                    $deletedDirsCount++;
                }
            }
        }

        $formattedBytes = $this->formatBytes($bytesFreed);

        $this->info('✓ Đã hoàn tất dọn dẹp log:');
        $this->line("  - Số tệp log đã xóa: <comment>{$deletedFilesCount}</comment>");
        $this->line("  - Số thư mục rỗng đã xóa: <comment>{$deletedDirsCount}</comment>");
        $this->line("  - Dung lượng giải phóng: <comment>{$formattedBytes}</comment>");

        return self::SUCCESS;
    }

    /**
     * Format dung lượng bytes thành đơn vị dễ đọc (KB, MB, GB).
     * @param int $bytes
     */
    protected function formatBytes(int $bytes): string
    {
        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $i     = (int) floor(log($bytes, 1024));

        return round($bytes / pow(1024, $i), 2) . ' ' . ($units[$i] ?? 'B');
    }
}
