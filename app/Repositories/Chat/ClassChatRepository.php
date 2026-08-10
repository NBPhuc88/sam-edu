<?php

namespace App\Repositories\Chat;

use App\Models\ClassChatMessage;
use Illuminate\Database\Eloquent\Collection;

class ClassChatRepository implements ClassChatRepositoryInterface
{
    /**
     * @return Collection<int, ClassChatMessage>
     */
    public function getRecentMessages(int $classId, int $limit = 50): Collection
    {
        /** @var Collection<int, ClassChatMessage> $messages */
        $messages = ClassChatMessage::where('class_id', $classId)
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
        $message = ClassChatMessage::where('class_id', $classId)
            ->where('is_pinned', true)
            ->orderBy('pinned_at', 'desc')
            ->first();

        return $message;
    }

    /**
     * @param  array<string, mixed>  $data
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

        // Nếu ghim tin nhắn mới, hủy ghim tất cả các tin nhắn cũ trong lớp
        if ($newPinnedState) {
            ClassChatMessage::where('class_id', $classId)->update([
                'is_pinned' => false,
                'pinned_at' => null,
                'pinned_by_name' => null,
            ]);

            $targetMessage->update([
                'is_pinned' => true,
                'pinned_at' => now(),
                'pinned_by_name' => $pinnedByName,
            ]);
        } else {
            $targetMessage->update([
                'is_pinned' => false,
                'pinned_at' => null,
                'pinned_by_name' => null,
            ]);
        }

        return $targetMessage->fresh();
    }
}
