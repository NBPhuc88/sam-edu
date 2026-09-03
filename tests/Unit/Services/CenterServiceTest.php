<?php

use App\Enums\Constant;
use App\Mail\CenterUpdatedMail;
use App\Models\Center;
use App\Services\Center\CenterService;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Mail::fake();
    $this->service = app(CenterService::class);
});

test('createCenter auto-generates code CTR0000001 when code is empty', function () {
    $data = [
        'name'  => 'Trung Tam Anh Ngu Sam',
        'email' => 'contact@sam-edu.vn',
        'phone' => '0901234567',
    ];

    $center = $this->service->createCenter($data);

    expect($center)->toBeInstanceOf(Center::class)
        ->and($center->code)->toBe('CTR0000001')
        ->and($center->name)->toBe('Trung Tam Anh Ngu Sam');
});

test('updateCenter updates center details and queues notification email', function () {
    $center = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Old Name',
        'email'  => 'center.old@example.com',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);

    $updated = $this->service->updateCenter($center->id, [
        'name'  => 'Center New Name',
        'phone' => '0988776655',
    ]);

    expect($updated->name)->toBe('Center New Name')
        ->and($updated->phone)->toBe('0988776655');

    Mail::assertQueued(CenterUpdatedMail::class);
});

test('deleteCenter soft deletes center record', function () {
    $center = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center To Delete',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);

    $result = $this->service->deleteCenter($center->id);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('centers', ['id' => $center->id]);
});
