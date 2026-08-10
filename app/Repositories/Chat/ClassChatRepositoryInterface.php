<?php

namespace App\Repositories\Chat;

use App\Models\ClassChatMessage;
use Illuminate\Database\Eloquent\Collection;

interface ClassChatRepositoryInterface
{
    /**
     * @return Collection<int, ClassChatMessage>
     */
    public function getRecentMessages(int $classId, int $limit = 50): Collection;

    public function getPinnedMessage(int $classId): ?ClassChatMessage;

    /**
     * @param  array<string, mixed>  $data
     */
    public function createMessage(array $data): ClassChatMessage;

    public function togglePinMessage(int $classId, int $messageId, string $pinnedByName): ?ClassChatMessage;
}
