<?php

namespace App\Services\Media;

use Illuminate\Http\UploadedFile;

interface MediaUploadServiceInterface
{
    /**
     * Upload a media file and generate a standardized name tied to the related entity.
     *
     * @param  UploadedFile                                                            $file
     * @param  string                                                                  $objectType e.g., 'exam', 'question', 'diagram', 'avatar'
     * @param  string|int|null                                                         $objectId   e.g., 'EX00000001', 'Q1'
     * @param  string|null                                                             $subId      e.g., 'IMG_A', 'loc_1'
     * @param  string                                                                  $folder     Storage subfolder within public disk
     * @return array{success: bool, url: string, file_name: string, file_path: string}
     */
    public function upload(
        UploadedFile $file,
        string $objectType = 'media',
        string|int|null $objectId = null,
        ?string $subId = null,
        string $folder = 'exams/media'
    ): array;

    /**
     * Xóa toàn bộ file media/ảnh của một bài thi trên storage (disk 'sam' và 'public').
     *
     * @param  int           $examId
     * @param  array<string> $extraFilePaths
     * @return void
     */
    public function deleteExamMedia(int $examId, array $extraFilePaths = []): void;
}
