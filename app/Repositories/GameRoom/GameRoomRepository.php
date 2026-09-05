<?php

namespace App\Repositories\GameRoom;

use App\Models\GameRoom;
use Illuminate\Database\Eloquent\Builder;

class GameRoomRepository implements GameRoomRepositoryInterface
{
    public function query(): Builder
    {
        return GameRoom::query();
    }
    public function lock(int $id): GameRoom
    {
        return $this->query()->lockForUpdate()->findOrFail($id);
    }
    public function create(array $data): GameRoom
    {
        return $this->query()->create($data);
    }
}
