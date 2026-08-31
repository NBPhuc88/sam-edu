<?php

namespace App\Services\Chat;

use App\Enums\Constant;
use App\Events\ClassChatMessagePinned;
use App\Events\ClassChatMessageReacted;
use App\Events\ClassChatMessageSent;
use App\Models\Admin;
use App\Models\ClassChatMessage;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Chat\ChatRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redis;

class ChatService implements ChatServiceInterface
{
    public function __construct(
        protected ChatRepositoryInterface $chatRepository,
        protected SchoolClassRepositoryInterface $schoolClassRepository,
        protected CenterRepositoryInterface $centerRepository
    ) {
    }

    public function authorizeAccess(int $classId, mixed $user = null): SchoolClass
    {
        $schoolClass = $this->schoolClassRepository->findWithCenter($classId);

        if (! $user) {
            $user = Auth::guard('admin')->user()
                ?? Auth::guard('teacher')->user()
                ?? Auth::guard('student')->user();
        }

        if (! $user) {
            abort(403, 'Bạn chưa đăng nhập hoặc không có quyền truy cập nhóm chat này.');
        }

        if ($user instanceof Admin) {
            if ($user->isSuperAdmin()) {
                return $schoolClass;
            }

            $hasCenter = $user->centers()->where('centers.id', $schoolClass->center_id)->exists();

            if (! $hasCenter) {
                abort(403, 'Bạn không có quyền truy cập nhóm chat của lớp học thuộc trung tâm khác.');
            }

            return $schoolClass;
        }

        if ($user instanceof Teacher) {
            $isAssigned = ($user->center_id === $schoolClass->center_id)
                || $schoolClass->classSubjects()->where('teacher_id', $user->id)->exists()
                || $schoolClass->classSessions()->where('teacher_id', $user->id)->exists();

            if (! $isAssigned) {
                abort(403, 'Bạn không có quyền truy cập nhóm chat của lớp học này.');
            }

            return $schoolClass;
        }

        if ($user instanceof Student) {
            $studentStatusInt = is_object($user->status) ? $user->status->value : (int) $user->status;

            if ($studentStatusInt !== 1) {
                abort(403, 'Tài khoản học sinh không ở trạng thái hoạt động.');
            }

            $isEnrolled = ($user->center_id === $schoolClass->center_id)
                && $schoolClass->students()->where('students.id', $user->id)->exists();

            if (! $isEnrolled) {
                abort(403, 'Bạn không phải là học sinh của lớp học này.');
            }

            return $schoolClass;
        }

        abort(403, 'Không có quyền truy cập.');
    }

    public function getClassWithCenter(int $classId, mixed $user = null): SchoolClass
    {
        return $this->authorizeAccess($classId, $user);
    }

    /**
     * @param  int                              $classId
     * @return array<int, array<string, mixed>>
     */
    public function getRecentMessages(int $classId): array
    {
        $redisKey = "chat:class:{$classId}:messages";

        try {
            /** @var array<int, string> $cached */
            $cached = Redis::lrange($redisKey, 0, -1);

            if (! empty($cached)) {
                $messages = [];

                foreach ($cached as $jsonString) {
                    $decoded = json_decode($jsonString, true);

                    if (is_array($decoded)) {
                        /** @var array<string, mixed> $decoded */
                        $messages[] = $decoded;
                    }
                }

                if (! empty($messages)) {
                    return $messages;
                }
            }
        } catch (\Throwable $e) {
            // Redis error fallback to DB
        }

        $dbMessages = $this->chatRepository->getRecentMessages($classId);
        $formatted  = [];

        foreach ($dbMessages as $msg) {
            $formatted[] = $this->formatMessageArray($msg);
        }

        try {
            Redis::del($redisKey);

            foreach ($formatted as $msgArray) {
                Redis::rpush($redisKey, json_encode($msgArray));
            }
            Redis::expire($redisKey, 86400);
        } catch (\Throwable $e) {
            // Fallback
        }

        return $formatted;
    }

    /**
     * @param  int                       $classId
     * @return array<string, mixed>|null
     */
    public function getPinnedMessage(int $classId): ?array
    {
        $redisKey = "chat:class:{$classId}:pinned";

        try {
            /** @var string|null $cached */
            $cached = Redis::get($redisKey);

            if ($cached) {
                $decoded = json_decode($cached, true);

                if (is_array($decoded)) {
                    /** @var array<string, mixed> $decoded */
                    return $decoded;
                }
            }
        } catch (\Throwable $e) {
            // Fallback
        }

        $pinnedMsg = $this->chatRepository->getPinnedMessage($classId);

        if (! $pinnedMsg) {
            return null;
        }

        $formatted = $this->formatMessageArray($pinnedMsg);

        try {
            Redis::setex($redisKey, 86400, json_encode($formatted));
        } catch (\Throwable $e) {
            // Fallback
        }

        return $formatted;
    }

    /**
     * @param  int                  $classId
     * @param  array<string, mixed> $senderInfo
     * @param  string               $message
     * @param  ?int                 $replyToId
     * @return array<string, mixed>
     */
    public function sendMessage(int $classId, array $senderInfo, string $message, ?int $replyToId = null): array
    {
        $schoolClass    = $this->authorizeAccess($classId);
        $classStatusInt = is_object($schoolClass->status) ? $schoolClass->status->value : (int) $schoolClass->status;

        if ($classStatusInt !== Constant::CLASS_STATUS_ACTIVE) {
            abort(403, 'Lớp học đã tạm dừng, hoàn thành hoặc đã đóng. Không thể gửi thêm tin nhắn.');
        }

        $senderType = (int) ($senderInfo['sender_type'] ?? 0);

        if ($senderType === Constant::SENDER_TYPE_TEACHER) {
            $teacher = Auth::guard('teacher')->user();

            if ($teacher && (int) $teacher->status === Constant::TEACHER_STATUS_INACTIVE) {
                abort(403, 'Tài khoản giáo viên đang ở trạng thái Tạm nghỉ. Không thể gửi tin nhắn.');
            }
        }

        $created = $this->chatRepository->createMessage([
            'class_id'      => $classId,
            'reply_to_id'   => $replyToId,
            'sender_type'   => $senderInfo['sender_type'] ?? Constant::SENDER_TYPE_STUDENT,
            'sender_id'     => $senderInfo['sender_id'] ?? 0,
            'sender_name'   => $senderInfo['sender_name'] ?? 'Thành viên',
            'sender_avatar' => $senderInfo['sender_avatar'] ?? null,
            'message'       => $message,
            'is_pinned'     => false,
        ]);

        $formatted = $this->formatMessageArray($created);

        try {
            $redisKey = "chat:class:{$classId}:messages";
            Redis::rpush($redisKey, json_encode($formatted));
            Redis::ltrim($redisKey, -50, -1);
        } catch (\Throwable $e) {
            // Fallback
        }

        event(new ClassChatMessageSent($classId, $formatted));

        return $formatted;
    }

    /**
     * @param  int                       $classId
     * @param  int                       $messageId
     * @param  string                    $pinnedByName
     * @return array<string, mixed>|null
     */
    public function togglePinMessage(int $classId, int $messageId, string $pinnedByName): ?array
    {
        $updated        = $this->chatRepository->togglePinMessage($classId, $messageId, $pinnedByName);
        $redisPinnedKey = "chat:class:{$classId}:pinned";

        try {
            Redis::del("chat:class:{$classId}:messages");
        } catch (\Throwable $e) {
            // Fallback
        }

        if (! $updated || ! $updated->is_pinned) {
            try {
                Redis::del($redisPinnedKey);
            } catch (\Throwable $e) {
                // Fallback
            }

            event(new ClassChatMessagePinned($classId, null));

            return null;
        }

        $formatted = $this->formatMessageArray($updated);

        try {
            Redis::setex($redisPinnedKey, 86400, json_encode($formatted));
        } catch (\Throwable $e) {
            // Fallback
        }

        event(new ClassChatMessagePinned($classId, $formatted));

        return $formatted;
    }

    /**
     * @param  int                              $classId
     * @param  int                              $messageId
     * @param  array<string, mixed>             $senderInfo
     * @param  string                           $emoji
     * @return array<int, array<string, mixed>>
     */
    public function toggleReaction(int $classId, int $messageId, array $senderInfo, string $emoji): array
    {
        $this->authorizeAccess($classId);

        $reactions = $this->chatRepository->toggleReaction($classId, $messageId, $senderInfo, $emoji);

        // Xóa cache tin nhắn Redis để lần đọc sau cập nhật
        try {
            Redis::del("chat:class:{$classId}:messages");
        } catch (\Throwable $e) {
            // Fallback
        }

        event(new ClassChatMessageReacted($classId, $messageId, $reactions));

        return $reactions;
    }

    /**
     * @param  ClassChatMessage     $msg
     * @return array<string, mixed>
     */
    protected function formatMessageArray(ClassChatMessage $msg): array
    {
        $replyToData = null;

        if ($msg->relationLoaded('replyTo') && $msg->replyTo) {
            $replyToData = [
                'id'          => $msg->replyTo->id,
                'class_id'    => $msg->replyTo->class_id,
                'sender_type' => $msg->replyTo->sender_type,
                'sender_id'   => $msg->replyTo->sender_id,
                'sender_name' => $msg->replyTo->sender_name,
                'message'     => \Illuminate\Support\Str::limit($msg->replyTo->message, 80),
            ];
        } elseif ($msg->reply_to_id) {
            $orig = ClassChatMessage::find($msg->reply_to_id);

            if ($orig) {
                $replyToData = [
                    'id'          => $orig->id,
                    'class_id'    => $orig->class_id,
                    'sender_type' => $orig->sender_type,
                    'sender_id'   => $orig->sender_id,
                    'sender_name' => $orig->sender_name,
                    'message'     => \Illuminate\Support\Str::limit($orig->message, 80),
                ];
            }
        }

        $reactionsData = [];

        if ($msg->relationLoaded('reactions') && $msg->reactions) {
            $grouped = [];

            foreach ($msg->reactions as $r) {
                if (! isset($grouped[$r->emoji])) {
                    $grouped[$r->emoji] = [
                        'emoji' => $r->emoji,
                        'count' => 0,
                        'users' => [],
                    ];
                }
                $grouped[$r->emoji]['count']++;
                $grouped[$r->emoji]['users'][] = [
                    'sender_type' => $r->sender_type,
                    'sender_id'   => $r->sender_id,
                    'sender_name' => $r->sender_name,
                ];
            }
            $reactionsData = array_values($grouped);
        } else {
            $reactionsData = $this->chatRepository->getGroupedReactions($msg->id);
        }

        return [
            'id'             => $msg->id,
            'class_id'       => $msg->class_id,
            'reply_to_id'    => $msg->reply_to_id,
            'reply_to'       => $replyToData,
            'reactions'      => $reactionsData,
            'sender_type'    => $msg->sender_type,
            'sender_id'      => $msg->sender_id,
            'sender_name'    => $msg->sender_name,
            'sender_avatar'  => $msg->sender_avatar,
            'message'        => $msg->message,
            'is_pinned'      => (bool) $msg->is_pinned,
            'pinned_at'      => $msg->pinned_at ? (string) $msg->pinned_at : null,
            'pinned_by_name' => $msg->pinned_by_name,
            'created_at'     => (string) ($msg->created_at ?? now()->toIso8601String()),
            'time_formatted' => (string) ($msg->created_at ? $msg->created_at->format('H:i, d/m') : date('H:i, d/m')),
        ];
    }

    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  mixed                $user
     * @return LengthAwarePaginator
     */
    public function getPaginatedChatGroups(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        mixed $user = null
    ): LengthAwarePaginator {
        if (! $user) {
            $user = Auth::guard('admin')->user()
                ?? Auth::guard('teacher')->user()
                ?? Auth::guard('student')->user();
        }

        $centerIds = null;
        $teacherId = null;
        $studentId = null;

        if ($user instanceof Admin) {
            if ($user->isSuperAdmin()) {
                $centerIds = $centerId;
            } else {
                $allowedCenterIds = $user->centers()->pluck('centers.id')->toArray();
                $centerIds        = empty($allowedCenterIds) ? [-1] : $allowedCenterIds;
            }
        } elseif ($user instanceof Teacher) {
            $teacherId = (int) $user->id;
            $centerIds = $user->center_id ? [(int) $user->center_id] : null;
        } elseif ($user instanceof Student) {
            $studentStatusInt = is_object($user->status) ? $user->status->value : (int) $user->status;

            if ($studentStatusInt !== Constant::STUDENT_STATUS_ACTIVE) {
                abort(403, 'Tài khoản học sinh không ở trạng thái hoạt động.');
            }
            $studentId = (int) $user->id;
            $centerIds = $user->center_id ? [(int) $user->center_id] : null;
        }

        return $this->chatRepository->getPaginatedClassChatGroups(
            $search,
            $centerIds,
            $classId,
            $status,
            $perPage,
            $page,
            $teacherId,
            $studentId
        );
    }

    /**
     * @param  mixed                $user
     * @return array<string, mixed>
     */
    public function getChatGroupFormData(mixed $user = null): array
    {
        if (! $user) {
            $user = Auth::guard('admin')->user()
                ?? Auth::guard('teacher')->user()
                ?? Auth::guard('student')->user();
        }

        $isSuperAdmin = $user instanceof Admin && $user->isSuperAdmin();
        $centers      = [];
        $centerIds    = null;
        $teacherId    = null;
        $studentId    = null;

        if ($user instanceof Admin) {
            if ($user->isSuperAdmin()) {
                $centers   = $this->centerRepository->getActiveCenters();
                $centerIds = null;
            } else {
                $allowedCenterIds = $user->centers()->pluck('centers.id')->toArray();
                $centerIds        = empty($allowedCenterIds) ? [-1] : $allowedCenterIds;
            }
        } elseif ($user instanceof Teacher) {
            $teacherId = (int) $user->id;
            $centerIds = $user->center_id ? [(int) $user->center_id] : null;
        } elseif ($user instanceof Student) {
            $studentId = (int) $user->id;
            $centerIds = $user->center_id ? [(int) $user->center_id] : null;
        }

        $accessibleClasses = $this->chatRepository->getAccessibleClassesList(
            $centerIds,
            $teacherId,
            $studentId
        );

        return [
            'centers'      => $centers,
            'classes'      => $accessibleClasses,
            'isSuperAdmin' => $isSuperAdmin,
        ];
    }
}
