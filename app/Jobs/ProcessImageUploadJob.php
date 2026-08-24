<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessImageUploadJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 10;

    /**
     * Create a new job instance.
     * @param string $tempRelativePath
     * @param string $destinationFolder
     * @param string $fileName
     * @param string $targetDisk
     */
    public function __construct(
        public string $tempRelativePath,
        public string $destinationFolder,
        public string $fileName,
        public string $targetDisk = 'sam'
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $tempDisk = Storage::disk('local');

        if (! $tempDisk->exists($this->tempRelativePath)) {
            Log::warning("ProcessImageUploadJob: Temporary file not found: {$this->tempRelativePath}");

            return;
        }

        $fullTempPath = $tempDisk->path($this->tempRelativePath);
        $fileContent  = file_get_contents($fullTempPath);

        if ($fileContent === false) {
            Log::error("ProcessImageUploadJob: Could not read temporary file: {$fullTempPath}");

            return;
        }

        $destinationPath = trim($this->destinationFolder, '/') . '/' . $this->fileName;

        // Ensure root directory of disk exists
        $targetStorage = Storage::disk('asset');
        $rootPath      = config('filesystems.disks.asset.root', public_path('asset'));

        if (! is_dir($rootPath)) {
            @mkdir($rootPath, 0777, true);
        }

        $destDir = dirname($rootPath . '/' . $destinationPath);

        if (! is_dir($destDir)) {
            @mkdir($destDir, 0777, true);
        }

        $fullDestPath = $rootPath . '/' . $destinationPath;

        if (@copy($fullTempPath, $fullDestPath)) {
            $tempDisk->delete($this->tempRelativePath);
        } else {
            $targetStorage->put($destinationPath, $fileContent);
            $tempDisk->delete($this->tempRelativePath);
        }
    }
}
