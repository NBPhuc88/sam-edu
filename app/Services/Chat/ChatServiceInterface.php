<?php

namespace App\Services\Chat;

interface ChatServiceInterface
{
    /**
     * @param  int                              $classId
     * @return array<int, array<string, mixed>>
     */
    public function getRecentMessages(int $classId): array;

    /**
     * @param  int                       $classId
     * @return array<string, mixed>|null
     */
    public function getPinnedMessage(int $classId): ?array;

    /**
     * @param  int                  $classId
     * @param  array<string, mixed> $senderInfo
     * @param  string               $message
     * @return array<string, mixed>
     */
    public function sendMessage(int $classId, array $senderInfo, string $message): array;

    /**
     * @param  int                       $classId
     * @param  int                       $messageId
     * @param  string                    $pinnedByName
     * @return array<string, mixed>|null
     */
    public function togglePinMessage(int $classId, int $messageId, string $pinnedByName): ?array;
}
