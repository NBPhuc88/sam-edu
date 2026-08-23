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

        // Store file temporarily in private local disk
        $tempPath = $file->storeAs('temp/uploads', $fileName, 'local');

        // Dispatch background job to transfer file to /home/phuc/sam (disk 'sam')
        ProcessImageUploadJob::dispatch(
            tempRelativePath: $tempPath,
            destinationFolder: $targetFolder,
            fileName: $fileName,
            targetDisk: 'sam'
        );

        $destinationRelativePath = trim($targetFolder, '/') . '/' . $fileName;

        // URL generator referencing disk 'sam' -> /sam-storage/...
        $samUrl = Storage::disk('sam')->url($destinationRelativePath);

        return [
            'success'   => true,
            'url'       => $samUrl,
            'file_name' => $fileName,
            'file_path' => $destinationRelativePath,
        ];
    }
}
