<?php

namespace App\Services\Chat;

use App\Events\ClassChatMessagePinned;
use App\Events\ClassChatMessageSent;
use App\Models\ClassChatMessage;
use App\Repositories\Chat\ClassChatRepositoryInterface;
use Illuminate\Support\Facades\Redis;

class ClassChatService implements ClassChatServiceInterface
{
    public function __construct(
        protected ClassChatRepositoryInterface $classChatRepository
    ) {}

    /**
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

        $dbMessages = $this->classChatRepository->getRecentMessages($classId);
        $formatted = [];

        foreach ($dbMessages as $msg) {
            $formatted[] = $this->formatMessageArray($msg);
        }

        // Cache back to Redis
        try {
            Redis::del($redisKey);
            foreach ($formatted as $msgArray) {
                Redis::rpush($redisKey, json_encode($msgArray));
            }
            Redis::expire($redisKey, 86400); // 1 ngày
        } catch (\Throwable $e) {
            // Fallback
        }

        return $formatted;
    }

    /**
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

        $pinnedMsg = $this->classChatRepository->getPinnedMessage($classId);
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
     * @param  array<string, mixed>  $senderInfo
     * @return array<string, mixed>
     */
    public function sendMessage(int $classId, array $senderInfo, string $message): array
    {
        $created = $this->classChatRepository->createMessage([
            'class_id' => $classId,
            'sender_type' => $senderInfo['sender_type'] ?? 'student',
            'sender_id' => $senderInfo['sender_id'] ?? 0,
            'sender_name' => $senderInfo['sender_name'] ?? 'Thành viên',
            'sender_avatar' => $senderInfo['sender_avatar'] ?? null,
            'message' => $message,
            'is_pinned' => false,
        ]);

        $formatted = $this->formatMessageArray($created);

        // Lưu vào Redis List Cache
        try {
            $redisKey = "chat:class:{$classId}:messages";
            Redis::rpush($redisKey, json_encode($formatted));
            Redis::ltrim($redisKey, -50, -1); // Giữ tối đa 50 tin nhắn mới nhất
        } catch (\Throwable $e) {
            // Fallback
        }

        // Broadcast Event Reverb WebSockets
        event(new ClassChatMessageSent($classId, $formatted));

        return $formatted;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function togglePinMessage(int $classId, int $messageId, string $pinnedByName): ?array
    {
        $updated = $this->classChatRepository->togglePinMessage($classId, $messageId, $pinnedByName);
        $redisPinnedKey = "chat:class:{$classId}:pinned";

        if (! $updated || ! $updated->is_pinned) {
            // Unpinned
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
     * @return array<string, mixed>
     */
    protected function formatMessageArray(ClassChatMessage $msg): array
    {
        return [
            'id' => $msg->id,
            'class_id' => $msg->class_id,
            'sender_type' => $msg->sender_type,
            'sender_id' => $msg->sender_id,
            'sender_name' => $msg->sender_name,
            'sender_avatar' => $msg->sender_avatar,
            'message' => $msg->message,
            'is_pinned' => (bool) $msg->is_pinned,
            'pinned_at' => $msg->pinned_at ? (string) $msg->pinned_at : null,
            'pinned_by_name' => $msg->pinned_by_name,
            'created_at' => (string) ($msg->created_at ?? now()->toIso8601String()),
            'time_formatted' => (string) ($msg->created_at ?? date('H:i, d/m')),
        ];
    }
}
