<?php

namespace App\Services\Room;

use App\Models\Admin;
use App\Models\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RoomServiceInterface
{
    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedRooms(
        ?string $search,
        ?int $centerId,
        ?string $status,
        int $perPage,
        int $page,
        ?Admin $admin = null
    ): LengthAwarePaginator;

    /**
     * @param  int       $id
     * @param  ?Admin    $admin
     * @return Room|null
     */
    public function getRoomById(int $id, ?Admin $admin = null): ?Room;

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Room
     */
    public function createRoom(array $data, ?Admin $admin = null): Room;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Room
     */
    public function updateRoom(int $id, array $data, ?Admin $admin = null): Room;

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteRoom(int $id, ?Admin $admin = null): bool;

    /**
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null): array;

    /**
     * @param  ?Admin                                                             $admin
     * @return array{total: int, active: int, inactive: int, total_capacity: int}
     */
    public function getStats(?Admin $admin = null): array;
}
