<?php

namespace App\Repositories\Room;

use App\Models\Room;
use App\Models\RoomEquipment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RoomRepository implements RoomRepositoryInterface
{
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator {
        $query = Room::query()
            ->select(
                'id',
                'center_id',
                'name',
                'code',
                'capacity',
                'location',
                'status',
                'created_at'
            )
            ->with([
                'center:id,name,code',
                'equipments:id,room_id,name,quantity,unit,status,note'
            ])
            ->orderBy('id', 'desc');

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if (! empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    public function find(int $id, ?array $allowedCenterIds = null): ?Room
    {
        $query = Room::query()
            ->select(
                'id',
                'center_id',
                'name',
                'code',
                'capacity',
                'location',
                'status',
                'created_at'
            )
            ->with([
                'center:id,name,code',
                'equipments:id,room_id,name,quantity,unit,status,note'
            ]);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->find($id);
    }

    public function create(array $data): Room
    {
        return DB::transaction(function () use ($data) {
            $equipments = $data['equipments'] ?? null;
            unset($data['equipments']);

            $room = Room::create($data);

            if (! empty($equipments) && is_array($equipments)) {
                foreach ($equipments as $item) {
                    if (! empty($item['name'])) {
                        $room->equipments()->create([
                            'name'     => $item['name'],
                            'quantity' => (int) ($item['quantity'] ?? 1),
                            'unit'     => $item['unit'] ?? null,
                            'status'   => $item['status'] ?? 'good',
                            'note'     => $item['note'] ?? null,
                        ]);
                    }
                }
            }

            return $room->fresh(['center', 'equipments']);
        });
    }

    public function update(int $id, array $data): Room
    {
        return DB::transaction(function () use ($id, $data) {
            $room       = Room::findOrFail($id);
            $equipments = $data['equipments'] ?? null;
            unset($data['equipments']);

            $room->update($data);

            if ($equipments !== null && is_array($equipments)) {
                $keptIds = [];

                foreach ($equipments as $item) {
                    if (empty($item['name'])) {
                        continue;
                    }

                    if (! empty($item['id'])) {
                        $existing = RoomEquipment::where('room_id', $room->id)->find($item['id']);

                        if ($existing) {
                            $existing->update([
                                'name'     => $item['name'],
                                'quantity' => (int) ($item['quantity'] ?? 1),
                                'unit'     => $item['unit'] ?? null,
                                'status'   => $item['status'] ?? 'good',
                                'note'     => $item['note'] ?? null,
                            ]);
                            $keptIds[] = $existing->id;
                        }
                    } else {
                        $newEquip = $room->equipments()->create([
                            'name'     => $item['name'],
                            'quantity' => (int) ($item['quantity'] ?? 1),
                            'unit'     => $item['unit'] ?? null,
                            'status'   => $item['status'] ?? 'good',
                            'note'     => $item['note'] ?? null,
                        ]);
                        $keptIds[] = $newEquip->id;
                    }
                }

                // Soft-delete items that were removed
                $room->equipments()->whereNotIn('id', $keptIds)->delete();
            }

            return $room->fresh(['center', 'equipments']);
        });
    }

    public function delete(int $id): bool
    {
        $room = Room::findOrFail($id);

        return (bool) $room->delete();
    }

    public function codeExists(int $centerId, string $code, ?int $ignoreId = null): bool
    {
        $query = Room::where('center_id', $centerId)
            ->where('code', $code);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    /**
     * @param  ?array<int, int>      $centerIds
     * @return Collection<int, Room>
     */
    public function getByCenterIds(?array $centerIds = null): Collection
    {
        $query = Room::select(
            'id',
            'center_id',
            'name',
            'code',
            'capacity',
            'location',
            'status'
        )
        ->where('status', 'active');

        if ($centerIds !== null) {
            $query->whereIn('center_id', $centerIds);
        }

        return $query->orderBy('name')->get();
    }

    public function getStats(?array $allowedCenterIds = null): array
    {
        $query = Room::query();

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        $total         = (clone $query)->count();
        $active        = (clone $query)->where('status', 'active')->count();
        $inactive      = (clone $query)->where('status', 'inactive')->count();
        $totalCapacity = (int) ((clone $query)->where('status', 'active')->sum('capacity') ?? 0);

        return [
            'total'          => $total,
            'active'         => $active,
            'inactive'       => $inactive,
            'total_capacity' => $totalCapacity,
        ];
    }

    public function countByCenterId(int $centerId): int
    {
        return Room::where('center_id', $centerId)->count();
    }
}
