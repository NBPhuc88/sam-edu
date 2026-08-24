<?php

namespace App\Repositories\Room;

use App\Enums\Constant;
use App\Models\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface RoomRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
    ): LengthAwarePaginator;

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Room|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Room;

    /**
     * @param  array<string, mixed> $data
     * @return Room
     */
    public function create(array $data): Room;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Room
     */
    public function update(int $id, array $data): Room;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * @param  int    $centerId
     * @param  string $code
     * @param  ?int   $ignoreId
     * @return bool
     */
    public function codeExists(int $centerId, string $code, ?int $ignoreId = null): bool;

    /**
     * @param  ?array<int, int>      $centerIds
     * @return Collection<int, Room>
     */
    public function getByCenterIds(?array $centerIds = null): Collection;

    /**
     * Get statistics counts for rooms.
     *
     * @param  array<int>|null                                                    $allowedCenterIds
     * @return array{total: int, active: int, inactive: int, total_capacity: int}
     */
    public function getStats(?array $allowedCenterIds = null): array;

    public function countByCenterId(int $centerId): int;

    /**
     * Đếm số phòng học đang hoạt động hoặc tạm dừng của trung tâm.
     *
     * @param  int  $centerId
     * @param  ?int $excludeId
     * @return int
     */
    public function countActiveAndPaused(int $centerId, ?int $excludeId = null): int;
}
