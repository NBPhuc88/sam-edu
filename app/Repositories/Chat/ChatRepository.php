<?php

namespace App\Repositories\Chat;

use App\Models\ClassChatMessage;
use Illuminate\Database\Eloquent\Collection;

class ChatRepository implements ChatRepositoryInterface
{
    /**
     * @param  int                               $classId
     * @param  int                               $limit
     * @return Collection<int, ClassChatMessage>
     */
    public function getRecentMessages(int $classId, int $limit = 50): Collection
    {
        /** @var Collection<int, ClassChatMessage> $messages */
        $messages = ClassChatMessage::query()
            ->select(
                'id',
                'class_id',
                'sender_type',
                'sender_id',
                'sender_name',
                'message',
                'is_pinned',
                'pinned_at',
                'pinned_by_name',
                'created_at'
            )
            ->where('class_id', $classId)
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();

        return $messages;
    }

    public function getPinnedMessage(int $classId): ?ClassChatMessage
    {
        /** @var ClassChatMessage|null $message */
        $message = ClassChatMessage::query()
            ->select(
                'id',
                'class_id',
                'sender_type',
                'sender_id',
                'sender_name',
                'message',
                'is_pinned',
                'pinned_at',
                'pinned_by_name',
                'created_at'
            )
            ->where('class_id', $classId)
            ->where('is_pinned', true)
            ->orderBy('pinned_at', 'desc')
            ->first();

        return $message;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createMessage(array $data): ClassChatMessage
    {
        /** @var ClassChatMessage $message */
        $message = ClassChatMessage::create($data);

        return $message;
    }

    public function togglePinMessage(int $classId, int $messageId, string $pinnedByName): ?ClassChatMessage
    {
        /** @var ClassChatMessage|null $targetMessage */
        $targetMessage = ClassChatMessage::where('class_id', $classId)->find($messageId);

        if (! $targetMessage) {
            return null;
        }

        $newPinnedState = ! $targetMessage->is_pinned;

        if ($newPinnedState) {
            ClassChatMessage::where('class_id', $classId)->update([
                'is_pinned'      => false,
                'pinned_at'      => null,
                'pinned_by_name' => null,
            ]);

            $targetMessage->update([
                'is_pinned'      => true,
                'pinned_at'      => now(),
                'pinned_by_name' => $pinnedByName,
            ]);
        } else {
            $targetMessage->update([
                'is_pinned'      => false,
                'pinned_at'      => null,
                'pinned_by_name' => null,
            ]);
        }

        return $targetMessage->fresh();
    }

    /**
     * @param  ?string                                               $search
     * @param  array<int>|int|null                                   $centerIds
     * @param  ?int                                                  $classId
     * @param  ?string                                               $status
     * @param  int                                                   $perPage
     * @param  int                                                   $page
     * @param  ?int                                                  $teacherId
     * @param  ?int                                                  $studentId
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getPaginatedClassChatGroups(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?int $teacherId = null,
        ?int $studentId = null
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
        $query = \App\Models\SchoolClass::query()
            ->select(
                'id',
                'center_id',
                'name',
                'code',
                'description',
                'max_students',
                'start_date',
                'end_date',
                'status',
                'created_at',
                'updated_at'
            )
            ->with([
                'center:id,name,code',
                'classSubjects:id,class_id,subject_id,teacher_id,status',
                'classSubjects.subject:id,name,code',
                'classSubjects.teacher:id,full_name,teacher_code',
                'latestChatMessage',
            ])
            ->withCount('students')
            ->withCount('chatMessages');

        if ($classId !== null) {
            $query->where('id', $classId);
        }

        if ($studentId !== null) {
            $query->whereHas('students', function ($q) use ($studentId) {
                $q->where('students.id', $studentId);
            });
        }

        if ($teacherId !== null) {
            $query->where(function ($q) use ($teacherId) {
                $q->whereHas('classSubjects', function ($sq) use ($teacherId) {
                    $sq->where('teacher_id', $teacherId);
                });
            });
        }

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if ($status === null || $status === '') {
            $query->where('status', 1);
        } elseif ($status !== 'all') {
            if (is_numeric($status)) {
                $query->where('status', (int) $status);
            } else {
                $statusMap = [
                    'inactive'  => 0,
                    'active'    => 1,
                    'completed' => 2,
                ];

                if (isset($statusMap[$status])) {
                    $query->where('status', $statusMap[$status]);
                }
            }
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('code', 'like', "%{$term}%")
                    ->orWhereHas('center', function ($cq) use ($term) {
                        $cq->where('name', 'like', "%{$term}%")
                            ->orWhere('code', 'like', "%{$term}%");
                    })
                    ->orWhereHas('classSubjects.subject', function ($sq) use ($term) {
                        $sq->where('name', 'like', "%{$term}%")
                            ->orWhere('code', 'like', "%{$term}%");
                    })
                    ->orWhereHas('classSubjects.teacher', function ($tq) use ($term) {
                        $tq->where('full_name', 'like', "%{$term}%")
                            ->orWhere('teacher_code', 'like', "%{$term}%");
                    });
            });
        }

        return $query->orderBy('status', 'asc')
            ->orderBy('id', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  array<int>|int|null                                                    $centerIds
     * @param  ?int                                                                   $teacherId
     * @param  ?int                                                                   $studentId
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\SchoolClass>
     */
    public function getAccessibleClassesList(
        array|int|null $centerIds = null,
        ?int $teacherId = null,
        ?int $studentId = null
    ): Collection {
        $query = \App\Models\SchoolClass::query()
            ->select('id', 'name', 'code', 'center_id', 'status')
            ->where('status', 1);

        if ($studentId !== null) {
            $query->whereHas('students', function ($q) use ($studentId) {
                $q->where('students.id', $studentId);
            });
        }

        if ($teacherId !== null) {
            $query->whereHas('classSubjects', function ($q) use ($teacherId) {
                $q->where('teacher_id', $teacherId);
            });
        }

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        /** @var Collection<int, \App\Models\SchoolClass> $classes */
        $classes = $query->orderBy('name', 'asc')->get();

        return $classes;
    }
}
