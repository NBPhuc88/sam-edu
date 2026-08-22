<?php

namespace App\Services\Chat;

use App\Events\ClassChatMessagePinned;
use App\Events\ClassChatMessageSent;
use App\Models\Admin;
use App\Models\ClassChatMessage;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\Chat\ChatRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redis;

class ChatService implements ChatServiceInterface
{
    public function __construct(
        protected ChatRepositoryInterface $chatRepository,
        protected SchoolClassRepositoryInterface $schoolClassRepository
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
     * @return array<string, mixed>
     */
    public function sendMessage(int $classId, array $senderInfo, string $message): array
    {
        $created = $this->chatRepository->createMessage([
            'class_id'      => $classId,
            'sender_type'   => $senderInfo['sender_type'] ?? 'student',
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
     * @param  ClassChatMessage     $msg
     * @return array<string, mixed>
     */
    protected function formatMessageArray(ClassChatMessage $msg): array
    {
        return [
            'id'             => $msg->id,
            'class_id'       => $msg->class_id,
            'sender_type'    => $msg->sender_type,
            'sender_id'      => $msg->sender_id,
            'sender_name'    => $msg->sender_name,
            'sender_avatar'  => $msg->sender_avatar,
            'message'        => $msg->message,
            'is_pinned'      => (bool) $msg->is_pinned,
            'pinned_at'      => $msg->pinned_at ? (string) $msg->pinned_at : null,
            'pinned_by_name' => $msg->pinned_by_name,
            'created_at'     => (string) ($msg->created_at ?? now()->toIso8601String()),
            'time_formatted' => (string) ($msg->created_at ?? date('H:i, d/m')),
        ];
    }
}
