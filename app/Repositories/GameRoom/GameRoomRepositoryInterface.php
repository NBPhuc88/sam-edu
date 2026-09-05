<?php

namespace App\Repositories\GameRoom;

use App\Models\GameRoom;
use Illuminate\Database\Eloquent\Builder;

interface GameRoomRepositoryInterface
{
    /**
     * @return Builder<GameRoom>
     */
    public function query(): Builder;
    public function lock(int $id): GameRoom;
    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): GameRoom;
}
