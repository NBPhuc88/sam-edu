<?php

namespace App\Http\Controllers;

use App\Services\Media\MediaUploadServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaUploadController extends Controller
{
    public function __construct(
        protected MediaUploadServiceInterface $mediaUploadService
    ) {
    }

    /**
     * Upload an exam media file (image/audio) with standardized object-tied naming.
     * @param Request $request
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'max:20480', // max 20MB
                'mimes:jpg,jpeg,png,webp,svg,gif,mp3,wav,ogg,webm,m4a',
            ],
            'object_type' => ['nullable', 'string', 'max:50'],
            'object_id'   => ['nullable', 'string', 'max:50'],
            'sub_id'      => ['nullable', 'string', 'max:50'],
            'folder'      => ['nullable', 'string', 'max:100'],
        ]);

        $file       = $request->file('file');
        $objectType = $request->input('object_type', 'exam');
        $objectId   = $request->input('object_id', 'general');
        $subId      = $request->input('sub_id');
        $folder     = $request->input('folder', 'exams/media');

        $result = $this->mediaUploadService->upload(
            file: $file,
            objectType: $objectType,
            objectId: $objectId,
            subId: $subId,
            folder: $folder
        );

        return response()->json($result);
    }
}
