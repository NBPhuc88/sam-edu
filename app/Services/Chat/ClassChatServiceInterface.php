<?php

namespace App\Services\Chat;

interface ClassChatServiceInterface
{
    /**
     * @return array<int, array<string, mixed>>
     * @param  int                              $classId
     */
    public function getRecentMessages(int $classId): array;

    /**
     * @return array<string, mixed>|null
     * @param  int                       $classId
     */
    public function getPinnedMessage(int $classId): ?array;

    /**
     * @param  array<string, mixed> $senderInfo
     * @param  int                  $classId
     * @param  string               $message
     * @return array<string, mixed>
     */
    public function sendMessage(int $classId, array $senderInfo, string $message): array;

    /**
     * @return array<string, mixed>|null
     * @param  int                       $classId
     * @param  int                       $messageId
     * @param  string                    $pinnedByName
     */
    public function togglePinMessage(int $classId, int $messageId, string $pinnedByName): ?array;
}
