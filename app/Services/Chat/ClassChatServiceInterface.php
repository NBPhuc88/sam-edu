<?php

namespace App\Services\Chat;

interface ClassChatServiceInterface
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function getRecentMessages(int $classId): array;

    /**
     * @return array<string, mixed>|null
     */
    public function getPinnedMessage(int $classId): ?array;

    /**
     * @param  array<string, mixed>  $senderInfo
     * @return array<string, mixed>
     */
    public function sendMessage(int $classId, array $senderInfo, string $message): array;

    /**
     * @return array<string, mixed>|null
     */
    public function togglePinMessage(int $classId, int $messageId, string $pinnedByName): ?array;
}
