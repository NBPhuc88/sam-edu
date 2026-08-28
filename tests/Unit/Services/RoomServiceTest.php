<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Room;
use App\Services\Room\RoomService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(RoomService::class);
    $this->center  = Center::create([
        'code'        => 'CTR' . random_int(1000000, 9999999),
        'name'        => 'Center Test RoomService',
        'status'      => Constant::STATUS_ACTIVE,
        'max_classes' => 10,
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_room_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin Room',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
});

test('createRoom auto-generates room code R0000001 when code is empty', function () {
    $data = [
        'name'      => 'Phong 101',
        'center_id' => $this->center->id,
        'capacity'  => 30,
    ];

    $room = $this->service->createRoom($data, $this->superAdmin);

    expect($room)->toBeInstanceOf(Room::class)
        ->and($room->code)->toBe('R0000001')
        ->and($room->name)->toBe('Phong 101')
        ->and($room->capacity)->toBe(30);
});

test('createRoom throws exception when max_classes limit is exceeded for room count', function () {
    $limitedCenter = Center::create([
        'code'        => 'CTR' . random_int(1000000, 9999999),
        'name'        => 'Limited Center Room',
        'status'      => Constant::STATUS_ACTIVE,
        'max_classes' => 1,
    ]);

    Room::create([
        'center_id' => $limitedCenter->id,
        'name'      => 'Phong Cu',
        'code'      => 'R' . random_int(1000000, 9999999),
        'status'    => Constant::ROOM_STATUS_ACTIVE,
    ]);

    $data = [
        'name'      => 'Phong 102',
        'center_id' => $limitedCenter->id,
        'status'    => Constant::ROOM_STATUS_ACTIVE,
    ];

    expect(fn () => $this->service->createRoom($data, $this->superAdmin))
        ->toThrow(\InvalidArgumentException::class, 'đã đạt tối đa');
});

test('updateRoom updates capacity and location', function () {
    $room = Room::create([
        'center_id' => $this->center->id,
        'name'      => 'Phong 201',
        'code'      => 'R' . random_int(1000000, 9999999),
    ]);

    $updated = $this->service->updateRoom($room->id, [
        'capacity' => 45,
        'location' => 'Tang 2',
    ], $this->superAdmin);

    expect($updated->capacity)->toBe(45)
        ->and($updated->location)->toBe('Tang 2');
});

test('deleteRoom soft deletes room successfully', function () {
    $room = Room::create([
        'center_id' => $this->center->id,
        'name'      => 'Phong To Del',
        'code'      => 'R' . random_int(1000000, 9999999),
    ]);

    $result = $this->service->deleteRoom($room->id, $this->superAdmin);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('rooms', ['id' => $room->id]);
});
