<?php

use App\Jobs\ProcessImageUploadJob;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Queue::fake();
    Storage::fake('local');
    Storage::fake('asset');
    $this->service = app(MediaUploadService::class);
});

test('upload dispatches ProcessImageUploadJob and returns asset URL', function () {
    $file = UploadedFile::fake()->image('test_question.png');

    $result = $this->service->upload($file, 'exam_question', 10, 'q1');

    expect($result['success'])->toBeTrue()
        ->and($result['url'])->toContain('asset/exams/10/')
        ->and($result['file_path'])->toContain('exams/10/q1_');

    Queue::assertPushed(ProcessImageUploadJob::class);
});

test('deleteExamMedia deletes exam directory from storage disks', function () {
    $disk = Storage::fake('asset');
    $disk->put('exams/10/sample.jpg', 'content');

    $this->service->deleteExamMedia(10);

    expect($disk->exists('exams/10/sample.jpg'))->toBeFalse();
});
