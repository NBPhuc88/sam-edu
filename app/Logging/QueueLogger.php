<?php

namespace App\Logging;

use Monolog\Formatter\LineFormatter;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\Processor\PsrLogMessageProcessor;

class QueueLogger
{
    /**
     * Khởi tạo Monolog Logger instance chuyên dụng cho Queue và Mail jobs.
     * Tự động lưu theo cấu trúc: storage/logs/queue/YYYY-MM/D.log (Ví dụ: storage/logs/queue/2026-08/1.log)
     *
     * @param  array<string, mixed> $config
     * @return Logger
     */
    public function __invoke(array $config): Logger
    {
        $yearMonth = date('Y-m');
        $day       = (int) date('j');

        $dir = storage_path("logs/queue/{$yearMonth}");

        if (! is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        $logPath = "{$dir}/{$day}.log";

        $handler = new StreamHandler(
            $logPath,
            $config['level'] ?? Logger::DEBUG,
            true,
            0664
        );

        $formatter = new LineFormatter(
            "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n",
            'Y-m-d H:i:s',
            true,
            true
        );

        $handler->setFormatter($formatter);

        $logger = new Logger('queue');
        $logger->pushHandler($handler);
        $logger->pushProcessor(new PsrLogMessageProcessor());

        return $logger;
    }
}
