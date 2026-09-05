<?php

namespace App\Services\GameRoom;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Exam;
use App\Models\GameRoom;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\GameRoom\GameRoomRepositoryInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GameRoomService implements GameRoomServiceInterface
{
    public function __construct(protected GameRoomRepositoryInterface $rooms)
    {
    }

    public function authorizeCenter(int $centerId, Admin|Teacher|Student $user): void
    {
        $allowed = $user instanceof Admin
            ? ($user->isSuperAdmin() || $user->centers()->where('centers.id', $centerId)->exists())
            : (int) $user->center_id === $centerId;
        abort_unless($allowed, 403);
    }

    public function isHost(GameRoom $room, Admin|Teacher|Student $user): bool
    {
        return ($user instanceof Admin && (int) $room->host_admin_id === $user->id)
            || ($user instanceof Teacher && (int) $room->host_teacher_id === $user->id);
    }

    public function authorizeAccess(GameRoom $room, Admin|Teacher|Student $user): void
    {
        $this->authorizeCenter((int) $room->center_id, $user);

        if ($user instanceof Student) {
            abort_unless($room->participants()->where('student_id', $user->id)->exists(), 403);
        }
    }

    public function authorizeHost(GameRoom $room, Admin|Teacher|Student $user): void
    {
        $this->authorizeAccess($room, $user);
        abort_unless($this->isHost($room, $user), 403);
        $this->authorizeActiveHost($user);
    }

    private function authorizeActiveHost(Admin|Teacher|Student $user): void
    {
        abort_if($user instanceof Student, 403);
        abort_if($user instanceof Teacher && $user->status === Constant::TEACHER_STATUS_INACTIVE, 403);
    }

    public function indexData(Admin|Teacher|Student $user): array
    {
        $query = $this->rooms->query()->latest('id');

        if ($user instanceof Student) {
            $query->where(function ($q) use ($user) {
                $q->whereHas('participants', fn ($sub) => $sub->where('student_id', $user->id))
                    ->orWhere(function ($sub) use ($user) {
                        $sub->where('center_id', $user->center_id)
                            ->whereIn('status', [
                                Constant::GAME_ROOM_STATUS_WAITING,
                                Constant::GAME_ROOM_STATUS_PLAYING,
                                Constant::GAME_ROOM_STATUS_COUNTDOWN,
                            ]);
                    });
            });
        } elseif ($user instanceof Admin && ! $user->isSuperAdmin()) {
            $query->whereIn('center_id', $user->centers()->select('centers.id'));
        } elseif ($user instanceof Teacher) {
            $query->where('center_id', $user->center_id);
        }

        $myParticipantRoomIds = $user instanceof Student
            ? $this->rooms->query()->whereHas('participants', fn ($q) => $q->where('student_id', $user->id))->pluck('id')->all()
            : [];

        $rooms = $query->withCount('participants')
            ->with(['hostAdmin:id,full_name', 'hostTeacher:id,full_name'])
            ->limit(50)
            ->get(['id', 'center_id', 'code', 'pin', 'name', 'status', 'question_index', 'questions', 'host_admin_id', 'host_teacher_id', 'created_at'])
            ->map(function ($room) use ($user, $myParticipantRoomIds) {
                $hostName       = $room->hostTeacher?->full_name ?? $room->hostAdmin?->full_name ?? 'Giáo viên';
                $isParticipant  = in_array($room->id, $myParticipantRoomIds, true);
                $isHost         = $this->isHost($room, $user);
                $totalQuestions = is_array($room->questions) ? count($room->questions) : 0;

                return [
                    'id'                 => $room->id,
                    'code'               => $room->code,
                    'pin'                => $room->pin,
                    'name'               => $room->name,
                    'status'             => $room->status,
                    'question_index'     => $room->question_index,
                    'total_questions'    => $totalQuestions,
                    'participants_count' => $room->participants_count,
                    'host_name'          => $hostName,
                    'is_host'            => $isHost,
                    'is_participant'     => $isParticipant,
                    'created_at'         => $room->created_at?->diffForHumans() ?? '',
                ];
            })->all();

        return [
            'rooms'     => $rooms,
            'isStudent' => $user instanceof Student,
        ];
    }

    public function createData(Admin|Teacher|Student $user): array
    {
        $this->authorizeActiveHost($user);
        $query = Exam::query()->whereNotNull('center_id');

        if ($user instanceof Teacher) {
            $query->where('center_id', $user->center_id);
        } elseif ($user instanceof Admin && ! $user->isSuperAdmin()) {
            $query->whereIn('center_id', $user->centers()->select('centers.id'));
        }
        $exams = $query->withCount('questions')->withCount([
            'questions as disallowed_count' => fn ($query) => $query->whereIn('question_type', Constant::GAME_ROOM_DISALLOWED_QUESTION_TYPES),
        ])->latest('id')->get(['id', 'name']);

        return ['exams' => $exams, 'scoringRules' => Constant::DEFAULT_GAME_ROOM_SCORING_RULES];
    }

    public function create(array $data, Admin|Teacher|Student $user): GameRoom
    {
        $this->authorizeActiveHost($user);
        $exam = Exam::with(['questions', 'sections'])->findOrFail($data['exam_id']);
        $this->authorizeCenter((int) $exam->center_id, $user);

        if ($exam->questions->isEmpty() || $exam->questions->contains(fn ($question) => in_array($question->question_type, Constant::GAME_ROOM_DISALLOWED_QUESTION_TYPES, true))) {
            throw ValidationException::withMessages(['exam_id' => 'Đề phải có câu hỏi và không chứa câu cần viết hoặc ghi âm.']);
        }
        $rules    = $data['scoring_rules'];
        $previous = 0;

        foreach ($rules as $rule) {
            if ($rule['seconds'] <= $previous) {
                throw ValidationException::withMessages(['scoring_rules' => 'Các mốc thời gian phải tăng dần.']);
            }
            $previous = $rule['seconds'];
        }

        if ($previous < $data['question_time_limit']) {
            throw ValidationException::withMessages(['scoring_rules' => 'Mốc cuối phải bao phủ thời gian trả lời.']);
        }

        return DB::transaction(function () use ($exam, $data, $user, $rules) {
            do {
                $pin = (string) random_int(100000, 999999);
            } while ($this->rooms->query()->where('pin', $pin)->exists());
            $questions = $exam->questions->map(function ($question) use ($exam) {
                $snapshot                        = $question->only(['id', 'title', 'content', 'question_type', 'options', 'correct_answer', 'image_url', 'audio_url']);
                $section                         = $exam->sections->firstWhere('id', $question->section_id);
                $snapshot['section_description'] = $section?->description;

                return $snapshot;
            })->values()->all();

            $room = $this->rooms->create([
                'center_id'           => $exam->center_id, 'exam_id' => $exam->id,
                'host_admin_id'       => $user instanceof Admin ? $user->id : null,
                'host_teacher_id'     => $user instanceof Teacher ? $user->id : null,
                'name'                => $exam->name, 'pin' => $pin, 'questions' => $questions,
                'question_time_limit' => $data['question_time_limit'], 'countdown_seconds' => 5,
                'scoring_rules'       => $rules, 'status' => Constant::GAME_ROOM_STATUS_WAITING, 'question_index' => 0,
            ]);
            $room->update(['code' => Constant::PREFIX_GAME_ROOM . str_pad((string) $room->id, 7, '0', STR_PAD_LEFT)]);

            return $room;
        });
    }

    public function join(string $pin, Admin|Teacher|Student $user): GameRoom
    {
        abort_unless($user instanceof Student, 403);

        return DB::transaction(function () use ($pin, $user) {
            $room = $this->rooms->query()->where('pin', $pin)->lockForUpdate()->first();

            if (! $room) {
                throw ValidationException::withMessages(['pin' => 'Mã PIN không hợp lệ.']);
            }
            $this->authorizeCenter((int) $room->center_id, $user);

            if ($room->participants()->where('student_id', $user->id)->exists()) {
                return $room;
            }

            if ($room->status !== Constant::GAME_ROOM_STATUS_WAITING) {
                throw ValidationException::withMessages(['pin' => 'Phòng đã bắt đầu hoặc đã kết thúc.']);
            }
            $room->participants()->create(['student_id' => $user->id, 'total_score' => 0, 'streak_count' => 0]);
            $this->emit($room, 'GameRoomParticipantJoined');

            return $room;
        });
    }

    public function start(GameRoom $room, Admin|Teacher|Student $user): void
    {
        $this->authorizeHost($room, $user);
        DB::transaction(function () use ($room) {
            $room = $this->rooms->lock($room->id);
            abort_unless($room->status === Constant::GAME_ROOM_STATUS_WAITING, 409);
            abort_unless($room->participants()->exists(), 422, 'Cần ít nhất một học sinh.');
            $room->update(['status' => Constant::GAME_ROOM_STATUS_PLAYING, 'question_started_at' => now(), 'expires_at' => now()->addSeconds($room->question_time_limit)]);
            $this->emit($room, 'GameRoomStarted');
            $this->emit($room, 'GameRoomQuestionStarted');
        });
    }

    public function cancel(GameRoom $room, Admin|Teacher|Student $user): void
    {
        $this->authorizeHost($room, $user);
        DB::transaction(function () use ($room) {
            $room = $this->rooms->lock($room->id);
            abort_if(in_array($room->status, [4, 5], true), 409);
            $room->update(['status' => Constant::GAME_ROOM_STATUS_CANCELLED, 'expires_at' => null]);
            $this->emit($room, 'GameRoomCompleted');
        });
    }

    private function advance(GameRoom $room): void
    {
        $endedQuestions = [];
        $events         = [];
        $currentTime    = now();

        while (in_array($room->status, [Constant::GAME_ROOM_STATUS_PLAYING, Constant::GAME_ROOM_STATUS_COUNTDOWN], true) && $room->expires_at->lessThanOrEqualTo($currentTime)) {
            $boundary = $room->expires_at;

            if ($room->status === Constant::GAME_ROOM_STATUS_PLAYING) {
                $endedQuestions[] = $room->question_index;
                $room->fill(['status' => Constant::GAME_ROOM_STATUS_COUNTDOWN, 'expires_at' => $boundary->addSeconds(5)]);
                $events[] = 'GameRoomQuestionEnded';
                $events[] = 'GameRoomLeaderboardUpdated';
            } elseif ($room->question_index + 1 >= count($room->questions)) {
                $room->fill(['status' => Constant::GAME_ROOM_STATUS_COMPLETED, 'expires_at' => null]);
                $events[] = 'GameRoomCompleted';
            } else {
                $room->fill(['status' => Constant::GAME_ROOM_STATUS_PLAYING, 'question_index' => $room->question_index + 1, 'question_started_at' => $boundary, 'expires_at' => $boundary->addSeconds($room->question_time_limit)]);
                $events[] = 'GameRoomQuestionStarted';
            }
        }

        if ($endedQuestions !== []) {
            $participants = $room->participants();

            if (count($endedQuestions) === 1) {
                $answered = $room->answers()->where('question_index', $endedQuestions[0])->select('game_room_participant_id');
                $participants->whereNotIn('id', $answered);
            }

            $participants->update(['streak_count' => 0]);
        }

        if ($room->isDirty()) {
            $room->save();
        }

        foreach (array_unique($events) as $event) {
            $this->emit($room, $event);
        }
    }

    public function sync(GameRoom $room, Admin|Teacher|Student $user): array
    {
        $this->authorizeAccess($room, $user);

        return DB::transaction(function () use ($room, $user) {
            $room = $this->rooms->lock($room->id);
            $this->advance($room);
            $participant = $user instanceof Student ? $room->participants()->where('student_id', $user->id)->first() : null;
            $answer      = $participant ? $room->answers()->where('game_room_participant_id', $participant->id)->where('question_index', $room->question_index)->first() : null;
            $question    = in_array($room->status, [2, 3], true) ? Arr::except($room->questions[$room->question_index], ['correct_answer']) : null;
            $leaderboard = $room->participants()->with('student:id,full_name')->orderByDesc('total_score')->orderBy('id')->get()->map(fn ($entry, $index) => [
                'id' => $entry->id, 'name' => $entry->student?->full_name ?? 'Học sinh', 'total_score' => $entry->total_score, 'streak_count' => $entry->streak_count, 'rank' => $index + 1,
            ])->all();

            return [
                'id'                  => $room->id, 'name' => $room->name, 'code' => $room->code, 'pin' => $room->pin,
                'status'              => $room->status, 'question_index' => $room->question_index, 'question_count' => count($room->questions),
                'question_time_limit' => $room->question_time_limit, 'question' => $question,
                'question_started_at' => $room->question_started_at?->toISOString(), 'expires_at' => $room->expires_at?->toISOString(),
                'server_time'         => now()->toISOString(), 'is_host' => $this->isHost($room, $user), 'is_student' => $user instanceof Student,
                'leaderboard'         => $leaderboard, 'participant_count' => count($leaderboard),
                'answer_count'        => $room->answers()->where('question_index', $room->question_index)->count(),
                'my_answer'           => $answer?->only(['answer', 'response_seconds', 'points', 'is_correct']),
            ];
        });
    }

    public function answer(GameRoom $room, array $data, Admin|Teacher|Student $user): void
    {
        abort_unless($user instanceof Student, 403);
        $this->authorizeAccess($room, $user);
        DB::transaction(function () use ($room, $data, $user) {
            $room = $this->rooms->lock($room->id);
            $this->advance($room);
            abort_unless($room->status === Constant::GAME_ROOM_STATUS_PLAYING && $room->question_index === $data['question_index'], 409, 'Câu hỏi đã hết giờ.');
            $participant = $room->participants()->where('student_id', $user->id)->firstOrFail();

            if ($room->answers()->where('game_room_participant_id', $participant->id)->where('question_index', $room->question_index)->exists()) {
                return;
            }
            $seconds = max(0, $room->question_started_at->diffInMilliseconds(now()) / 1000);
            $correct = $this->isCorrect($room->questions[$room->question_index], $data['answer']);
            $points  = 0;

            if ($correct) {
                foreach ($room->scoring_rules as $rule) {
                    if ($seconds < $rule['seconds']) {
                        $points = (int) $rule['points'];

                        break;
                    }
                }
            }
            $room->answers()->create([
                'game_room_participant_id' => $participant->id, 'question_index' => $room->question_index,
                'answer'                   => $data['answer'], 'response_seconds' => $seconds, 'is_correct' => $correct, 'points' => $points,
            ]);
            $participant->update(['total_score' => $participant->total_score + $points, 'streak_count' => $correct ? $participant->streak_count + 1 : 0]);
            $this->emit($room, 'GameRoomAnswerCountUpdated');
            $this->emit($room, 'GameRoomLeaderboardUpdated');
        });
    }

    public function isCorrect(array $question, mixed $answer): bool
    {
        $correct = $question['correct_answer'];

        if ($answer === null || $answer === '' || $answer === [] || $correct === null) {
            return false;
        }

        if (in_array($question['question_type'], [1, 3, 11], true)) {
            return is_scalar($answer) && is_scalar($correct) && mb_strtoupper(trim((string) $answer)) === mb_strtoupper(trim((string) $correct));
        }

        if (! is_array($answer) || ! is_array($correct) || count($answer) !== count($correct)) {
            return false;
        }

        foreach (array_merge(array_values($answer), array_values($correct)) as $value) {
            if (! is_scalar($value)) {
                return false;
            }
        }
        $answer  = array_map('strval', $answer);
        $correct = array_map('strval', $correct);

        if ($question['question_type'] === Constant::QUESTION_TYPE_MULTIPLE_CHOICE) {
            sort($answer);
            sort($correct);
        } elseif ($question['question_type'] !== Constant::QUESTION_TYPE_ORDERING) {
            ksort($answer);
            ksort($correct);
        }

        return $answer === $correct;
    }

    public function react(GameRoom $room, string $emoji, Admin|Teacher|Student $user): void
    {
        $this->authorizeAccess($room, $user);
        $this->emit($room, 'GameRoomReactionSent', ['emoji' => $emoji]);
    }

    private function emit(GameRoom $room, string $event, array $payload = []): void
    {
        $eventClass = 'App\\Events\\' . $event;
        $id         = $room->id;
        DB::afterCommit(static function () use ($eventClass, $id, $payload) {
            try {
                event(new $eventClass($id, $payload));
            } catch (\Throwable $exception) {
                report($exception);
            }
        });
    }
}
