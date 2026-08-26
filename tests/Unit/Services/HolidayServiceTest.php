<?php

use App\Jobs\SyncAffectedSchedulesAfterHolidayChangeJob;
use App\Models\Holiday;
use App\Services\Holiday\HolidayService;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake();
    $this->service = app(HolidayService::class);
});

test('createHoliday creates holiday record and dispatches sync job', function () {
    $data = [
        'name' => 'Ngay Quoc Khanh',
        'date' => '2026-09-02',
    ];

    $holiday = $this->service->createHoliday($data);

    expect($holiday)->toBeInstanceOf(Holiday::class)
        ->and($holiday->year)->toBe(2026)
        ->and($holiday->name)->toBe('Ngay Quoc Khanh');

    Queue::assertPushed(SyncAffectedSchedulesAfterHolidayChangeJob::class);
});

test('seedDefaultHolidaysForYear seeds default Vietnam holidays and dispatches job', function () {
    $insertedCount = $this->service->seedDefaultHolidaysForYear(2026);

    expect($insertedCount)->toBeGreaterThan(0);
    $this->assertDatabaseHas('holidays', ['year' => 2026]);

    Queue::assertPushed(SyncAffectedSchedulesAfterHolidayChangeJob::class);
});
