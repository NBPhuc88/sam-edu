<?php

namespace App\Services\Media;

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

        // Standardize clean slug parts for filename
        $cleanObject = Str::slug($objectType, '_');
        $cleanId     = $objectId ? Str::slug((string) $objectId, '_') : 'gen';
        $cleanSub    = $subId ? '_' . Str::slug($subId, '_') : '';
        $timestamp   = time();
        $randomHex   = Str::random(4);

        // Format: [object_type]_[object_id]_[sub_id]_[timestamp]_[rand].[ext]
        $fileName = "{$cleanObject}_{$cleanId}{$cleanSub}_{$timestamp}_{$randomHex}.{$extension}";

        // Store to public disk
        $path = $file->storeAs($folder, $fileName, 'public');

        // URL generator
        $publicUrl = Storage::disk('public')->url($path);

        return [
            'success'   => true,
            'url'       => $publicUrl,
            'file_name' => $fileName,
            'file_path' => $path,
        ];
    }
}
