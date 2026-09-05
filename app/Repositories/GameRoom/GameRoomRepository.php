<?php

namespace App\Repositories\GameRoom;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\GameRoom;
use App\Models\GameRoomAnswer;
use App\Models\GameRoomParticipant;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class GameRoomRepository implements GameRoomRepositoryInterface
{
    public function lock(int $id): GameRoom
    {
        return GameRoom::query()->lockForUpdate()->findOrFail($id);
    }

    public function create(array $data): GameRoom
    {
        return GameRoom::create($data);
    }

    public function pinExists(string $pin): bool
    {
        return GameRoom::query()->where('pin', $pin)->exists();
    }

    public function findByPin(string $pin, bool $lockForUpdate = false): ?GameRoom
    {
        $query = GameRoom::query()->where('pin', $pin);

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    protected function applyUserScope(Builder $query, Admin|Teacher|Student $user): Builder
    {
        if ($user instanceof Student) {
            return $query->where(function (Builder $q) use ($user) {
                $q->whereHas('participants', fn (Builder $sub) => $sub->where('student_id', $user->id))
                    ->orWhere(function (Builder $sub) use ($user) {
                        $sub->where('center_id', $user->center_id)
                            ->whereIn('status', [
                                Constant::GAME_ROOM_STATUS_WAITING,
                                Constant::GAME_ROOM_STATUS_PLAYING,
                                Constant::GAME_ROOM_STATUS_COUNTDOWN,
                            ]);
                    });
            });
        }

        if ($user instanceof Admin && ! $user->isSuperAdmin()) {
            return $query->whereIn('center_id', $user->centers()->select('centers.id'));
        }

        if ($user instanceof Teacher) {
            return $query->where('center_id', $user->center_id);
        }

        return $query;
    }

    public function getTabCounts(Admin|Teacher|Student $user): array
    {
        $statusCounts = $this->applyUserScope(GameRoom::query(), $user)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $waitingCount   = (int) ($statusCounts[Constant::GAME_ROOM_STATUS_WAITING] ?? 0);
        $liveCount      = (int) (($statusCounts[Constant::GAME_ROOM_STATUS_PLAYING] ?? 0) + ($statusCounts[Constant::GAME_ROOM_STATUS_COUNTDOWN] ?? 0));
        $completedCount = (int) (($statusCounts[Constant::GAME_ROOM_STATUS_COMPLETED] ?? 0) + ($statusCounts[Constant::GAME_ROOM_STATUS_CANCELLED] ?? 0));
        $allCount       = (int) $statusCounts->sum();

        return [
            'all'       => $allCount,
            'live'      => $liveCount,
            'waiting'   => $waitingCount,
            'completed' => $completedCount,
        ];
    }

    public function getActiveRoomsForUser(Admin|Teacher|Student $user): Collection
    {
        $activeStatuses = [
            Constant::GAME_ROOM_STATUS_WAITING,
            Constant::GAME_ROOM_STATUS_PLAYING,
            Constant::GAME_ROOM_STATUS_COUNTDOWN,
        ];

        $query = $this->applyUserScope(GameRoom::query(), $user)->whereIn('status', $activeStatuses);

        if ($user instanceof Student) {
            $query->whereHas('participants', fn (Builder $q) => $q->where('student_id', $user->id));
        } elseif ($user instanceof Teacher) {
            $query->where('host_teacher_id', $user->id);
        } elseif ($user instanceof Admin) {
            $query->where('host_admin_id', $user->id);
        }

        return $query->withCount('participants')
            ->with(['hostAdmin:id,full_name', 'hostTeacher:id,full_name'])
            ->latest('id')
            ->get(['id', 'center_id', 'code', 'pin', 'name', 'status', 'question_index', 'questions', 'host_admin_id', 'host_teacher_id', 'created_at']);
    }

    public function getParticipantRoomIds(int $studentId): array
    {
        return GameRoom::query()
            ->whereHas('participants', fn (Builder $q) => $q->where('student_id', $studentId))
            ->pluck('id')
            ->all();
    }

    public function getPaginatedRooms(Admin|Teacher|Student $user, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = $this->applyUserScope(GameRoom::query(), $user)->latest('id');

        $tab = $filters['tab'] ?? 'all';

        if ($tab === 'live') {
            $query->whereIn('status', [
                Constant::GAME_ROOM_STATUS_PLAYING,
                Constant::GAME_ROOM_STATUS_COUNTDOWN,
            ]);
        } elseif ($tab === 'waiting') {
            $query->where('status', Constant::GAME_ROOM_STATUS_WAITING);
        } elseif ($tab === 'completed') {
            $query->whereIn('status', [
                Constant::GAME_ROOM_STATUS_COMPLETED,
                Constant::GAME_ROOM_STATUS_CANCELLED,
            ]);
        }

        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('pin', 'like', "%{$search}%");
            });
        }

        return $query->withCount('participants')
            ->with(['hostAdmin:id,full_name', 'hostTeacher:id,full_name'])
            ->paginate($perPage, ['id', 'center_id', 'code', 'pin', 'name', 'status', 'question_index', 'questions', 'host_admin_id', 'host_teacher_id', 'created_at'])
            ->withQueryString();
    }

    public function findParticipant(GameRoom $room, int $studentId): ?GameRoomParticipant
    {
        return $room->participants()->where('student_id', $studentId)->first();
    }

    public function participantExists(GameRoom $room, int $studentId): bool
    {
        return $room->participants()->where('student_id', $studentId)->exists();
    }

    public function addParticipant(GameRoom $room, int $studentId): GameRoomParticipant
    {
        return $room->participants()->create([
            'student_id'   => $studentId,
            'total_score'  => 0,
            'streak_count' => 0,
        ]);
    }

    public function getLeaderboard(GameRoom $room): Collection
    {
        return $room->participants()
            ->with('student:id,full_name')
            ->orderByDesc('total_score')
            ->orderBy('id')
            ->get();
    }

    public function findAnswer(GameRoom $room, int $participantId, int $questionIndex): ?GameRoomAnswer
    {
        return $room->answers()
            ->where('game_room_participant_id', $participantId)
            ->where('question_index', $questionIndex)
            ->first();
    }

    public function answerExists(GameRoom $room, int $participantId, int $questionIndex): bool
    {
        return $room->answers()
            ->where('game_room_participant_id', $participantId)
            ->where('question_index', $questionIndex)
            ->exists();
    }

    public function createAnswer(GameRoom $room, array $data): GameRoomAnswer
    {
        return $room->answers()->create($data);
    }

    public function getAnswerCount(GameRoom $room, int $questionIndex): int
    {
        return $room->answers()->where('question_index', $questionIndex)->count();
    }

    public function resetStreakForUnanswered(GameRoom $room, array $endedQuestions): void
    {
        $participants = $room->participants();

        if (count($endedQuestions) === 1) {
            $answered = $room->answers()->where('question_index', $endedQuestions[0])->select('game_room_participant_id');
            $participants->whereNotIn('id', $answered);
        }

        $participants->update(['streak_count' => 0]);
    }
}
