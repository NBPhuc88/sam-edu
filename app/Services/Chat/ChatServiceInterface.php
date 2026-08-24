<?php

namespace App\Services\Chat;

use App\Models\SchoolClass;

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
     * @param  ?int                 $replyToId
     * @return array<string, mixed>
     */
    public function sendMessage(int $classId, array $senderInfo, string $message, ?int $replyToId = null): array;

    /**
     * @param  int                       $classId
     * @param  int                       $messageId
     * @param  string                    $pinnedByName
     * @return array<string, mixed>|null
     */
    public function togglePinMessage(int $classId, int $messageId, string $pinnedByName): ?array;

    /**
     * @param  int                              $classId
     * @param  int                              $messageId
     * @param  array<string, mixed>             $senderInfo
     * @param  string                           $emoji
     * @return array<int, array<string, mixed>>
     */
    public function toggleReaction(int $classId, int $messageId, array $senderInfo, string $emoji): array;

    public function getClassWithCenter(int $classId, mixed $user = null): SchoolClass;

    public function authorizeAccess(int $classId, mixed $user = null): SchoolClass;

    /**
     * @param  ?string                                               $search
     * @param  ?int                                                  $centerId
     * @param  ?int                                                  $classId
     * @param  ?string                                               $status
     * @param  int                                                   $perPage
     * @param  int                                                   $page
     * @param  mixed                                                 $user
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getPaginatedChatGroups(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        mixed $user = null
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    /**
     * @param  mixed                $user
     * @return array<string, mixed>
     */
    public function getChatGroupFormData(mixed $user = null): array;
}
