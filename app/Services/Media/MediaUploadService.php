<?php

namespace App\Services\Media;

use App\Jobs\ProcessImageUploadJob;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaUploadService implements MediaUploadServiceInterface
{
    /**
     * {@inheritdoc}
     */
    public function upload(
        UploadedFile $file,
        string $objectType = 'media',
        string|int|null $objectId = null,
        ?string $subId = null,
        string $folder = 'exams/media'
    ): array {
        $extension = strtolower($file->getClientOriginalExtension());

        if (empty($extension)) {
            $extension = $file->guessExtension() ?? 'bin';
        }

        // Clean slug components
        $cleanObject = Str::slug($objectType, '_');
        $cleanId     = $objectId ? Str::slug((string) $objectId, '_') : 'gen';
        $timestamp   = time();
        $randomHex   = Str::random(4);

        // Standardized folder structure: exams/{exam_id} or custom folder
        $targetFolder = $folder;

        if ($objectType === 'exam' || $objectType === 'exam_question') {
            if ($objectId && $objectId !== 'general') {
                $targetFolder = "exams/{$cleanId}";
            } else {
                $targetFolder = 'exams/general';
            }
        }

        // Filename format: e.g. phan1_cau2_timestamp_rand.ext or sec_1_q_2_rand.ext
        if ($subId) {
            $cleanSub = Str::slug($subId, '_');
            $fileName = "{$cleanSub}_{$timestamp}_{$randomHex}.{$extension}";
        } else {
            $fileName = "{$cleanObject}_{$cleanId}_{$timestamp}_{$randomHex}.{$extension}";
        }

        $destinationRelativePath = trim($targetFolder, '/') . '/' . $fileName;

        // Store to temporary disk for background queue processing
        $tempRelativePath = $file->store('temp_uploads', 'local');

        // Dispatch background queue job to process and move file to public/asset
        ProcessImageUploadJob::dispatch($tempRelativePath, $targetFolder, $fileName, 'asset');

        // URL generator referencing full asset URL -> http://domain/asset/...
        $assetUrl = url('asset/' . $destinationRelativePath);

        return [
            'success'   => true,
            'url'       => $assetUrl,
            'file_name' => $fileName,
            'file_path' => $destinationRelativePath,
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function deleteExamMedia(int $examId, array $extraFilePaths = []): void
    {
        $samDisk    = Storage::disk('sam');
        $publicDisk = Storage::disk('public');
        $assetDisk  = Storage::disk('asset');

        // 1. Xóa toàn bộ thư mục exams/{examId}
        $examFolder = "exams/{$examId}";

        if ($samDisk->exists($examFolder)) {
            $samDisk->deleteDirectory($examFolder);
        }

        if ($publicDisk->exists($examFolder)) {
            $publicDisk->deleteDirectory($examFolder);
        }

        if ($assetDisk->exists($examFolder)) {
            $assetDisk->deleteDirectory($examFolder);
        }

        // 2. Xóa các file media riêng lẻ được truyền vào (nếu có lưu ở ngoài folder exams/{examId})
        foreach ($extraFilePaths as $path) {
            if (empty($path) || ! is_string($path)) {
                continue;
            }

            $cleanPath = $this->normalizeStoragePath($path);

            if (! empty($cleanPath)) {
                if ($samDisk->exists($cleanPath)) {
                    $samDisk->delete($cleanPath);
                }

                if ($publicDisk->exists($cleanPath)) {
                    $publicDisk->delete($cleanPath);
                }

                if ($assetDisk->exists($cleanPath)) {
                    $assetDisk->delete($cleanPath);
                }
            }
        }
    }

    /**
     * Chuẩn hóa URL/đường dẫn về đường dẫn tương đối trong storage.
     * @param string $path
     */
    protected function normalizeStoragePath(string $path): string
    {
        // Loại bỏ domain nếu là full URL (ví dụ: http://localhost/asset/exams/1/abc.png)
        $parsed = parse_url($path, PHP_URL_PATH);
        $path   = $parsed ? ltrim($parsed, '/') : ltrim($path, '/');

        // Loại bỏ tiền tố asset/, sam-storage/ hoặc storage/
        if (str_starts_with($path, 'asset/')) {
            $path = substr($path, strlen('asset/'));
        } elseif (str_starts_with($path, 'sam-storage/')) {
            $path = substr($path, strlen('sam-storage/'));
        } elseif (str_starts_with($path, 'storage/')) {
            $path = substr($path, strlen('storage/'));
        }

        return trim($path, '/');
    }
}
