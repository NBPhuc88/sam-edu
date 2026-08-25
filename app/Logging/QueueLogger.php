<?php

namespace App\Logging;

use Monolog\Logger;

class QueueLogger
{
    /**
     * Khởi tạo Monolog Logger instance chuyên dụng cho Queue và Mail jobs.
     * Tự động lưu theo cấu trúc: storage/logs/queue/YYYY-MM/D.log
     *
     * @param  array<string, mixed> $config
     * @return Logger
     */
    public function __invoke(array $config): Logger
    {
        $config['folder']       = $config['folder'] ?? 'queue';
        $config['channel_name'] = $config['channel_name'] ?? 'queue';

        return (new DailyDirectoryLogger())->__invoke($config);
    }
}
