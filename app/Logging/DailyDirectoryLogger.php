<?php

namespace App\Logging;

use Monolog\Formatter\LineFormatter;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\Processor\PsrLogMessageProcessor;

class DailyDirectoryLogger
{
    /**
     * Khởi tạo Monolog Logger instance tự động lưu log theo ngày trong thư mục theo tháng:
     * Cấu trúc: storage/logs/{channel}/YYYY-MM/D.log (Ví dụ: storage/logs/laravel/2026-08/25.log)
     *
     * @param  array<string, mixed> $config
     * @return Logger
     */
    public function __invoke(array $config): Logger
    {
        $channelName = $config['channel_name'] ?? $config['name'] ?? 'laravel';
        $folder      = $config['folder'] ?? $channelName;
        $yearMonth   = date('Y-m');
        $day         = (int) date('j');

        $dir = storage_path("logs/{$folder}/{$yearMonth}");

        if (! is_dir($dir)) {
            @mkdir($dir, 0777, true);
            @chmod($dir, 0777);
        }

        $logPath = "{$dir}/{$day}.log";

        $filePermission = $config['permission'] ?? 0666;

        $handler = new StreamHandler(
            $logPath,
            $config['level'] ?? Logger::DEBUG,
            true,
            $filePermission
        );

        $formatter = new LineFormatter(
            "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n",
            'Y-m-d H:i:s',
            true,
            true
        );

        $handler->setFormatter($formatter);

        $logger = new Logger($channelName);
        $logger->pushHandler($handler);
        $logger->pushProcessor(new PsrLogMessageProcessor());

        return $logger;
    }
}
