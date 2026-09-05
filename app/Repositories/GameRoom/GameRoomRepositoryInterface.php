<?php

namespace App\Repositories\GameRoom;

use App\Models\Admin;
use App\Models\GameRoom;
use App\Models\GameRoomAnswer;
use App\Models\GameRoomParticipant;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface GameRoomRepositoryInterface
{
    public function lock(int $id): GameRoom;

    public function create(array $data): GameRoom;

    public function pinExists(string $pin): bool;

    public function findByPin(string $pin, bool $lockForUpdate = false): ?GameRoom;

    public function getPaginatedRooms(Admin|Teacher|Student $user, array $filters = [], int $perPage = 20): LengthAwarePaginator;

    public function getTabCounts(Admin|Teacher|Student $user): array;

    public function getActiveRoomsForUser(Admin|Teacher|Student $user): Collection;

    public function getParticipantRoomIds(int $studentId): array;

    public function findParticipant(GameRoom $room, int $studentId): ?GameRoomParticipant;

    public function participantExists(GameRoom $room, int $studentId): bool;

    public function addParticipant(GameRoom $room, int $studentId): GameRoomParticipant;

    public function getLeaderboard(GameRoom $room): Collection;

    public function findAnswer(GameRoom $room, int $participantId, int $questionIndex): ?GameRoomAnswer;

    public function answerExists(GameRoom $room, int $participantId, int $questionIndex): bool;

    public function createAnswer(GameRoom $room, array $data): GameRoomAnswer;

    public function getAnswerCount(GameRoom $room, int $questionIndex): int;

    public function resetStreakForUnanswered(GameRoom $room, array $endedQuestions): void;
}
