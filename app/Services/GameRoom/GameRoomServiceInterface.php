<?php

namespace App\Services\GameRoom;

use App\Models\{Admin, Teacher, Student, GameRoom};

interface GameRoomServiceInterface
{
    public function authorizeCenter(int $centerId, Admin|Teacher|Student $user): void;
    public function isHost(GameRoom $room, Admin|Teacher|Student $user): bool;
    public function authorizeAccess(GameRoom $room, Admin|Teacher|Student $user): void;
    public function authorizeHost(GameRoom $room, Admin|Teacher|Student $user): void;
    public function indexData(Admin|Teacher|Student $user, array $filters = []): array;
    public function createData(Admin|Teacher|Student $user): array;
    public function create(array $data, Admin|Teacher|Student $user): GameRoom;
    public function join(string $pin, Admin|Teacher|Student $user): GameRoom;
    public function start(GameRoom $room, Admin|Teacher|Student $user): void;
    public function cancel(GameRoom $room, Admin|Teacher|Student $user): void;
    public function sync(GameRoom $room, Admin|Teacher|Student $user): array;
    public function answer(GameRoom $room, array $data, Admin|Teacher|Student $user): void;
    public function isCorrect(array $question, mixed $answer): bool;
    public function react(GameRoom $room, string $emoji, Admin|Teacher|Student $user): void;
}
