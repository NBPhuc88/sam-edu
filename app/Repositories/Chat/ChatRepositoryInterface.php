<?php

namespace App\Repositories\Chat;

use App\Enums\Constant;
use App\Models\ClassChatMessage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ChatRepositoryInterface
{
    public function getLastReadMessageId(int $classId, int $userType, int $userId): ?int;

    public function markMessagesRead(int $classId, int $userType, int $userId, int $messageId): void;

    /**
     * @param  int                               $classId
     * @param  int                               $limit
     * @param  ?int                              $sinceMessageId
     * @return Collection<int, ClassChatMessage>
     */
    public function getRecentMessages(int $classId, int $limit = 50, ?int $sinceMessageId = null): Collection;

    public function getPinnedMessage(int $classId): ?ClassChatMessage;

    /**
     * @param array<string, mixed> $data
     */
    public function createMessage(array $data): ClassChatMessage;

    public function togglePinMessage(int $classId, int $messageId, string $pinnedByName): ?ClassChatMessage;

    /**
     * @param  int                              $classId
     * @param  int                              $messageId
     * @param  array<string, mixed>             $senderInfo
     * @param  string                           $emoji
     * @return array<int, array<string, mixed>>
     */
    public function toggleReaction(int $classId, int $messageId, array $senderInfo, string $emoji): array;

    /**
     * @param  int                              $messageId
     * @return array<int, array<string, mixed>>
     */
    public function getGroupedReactions(int $messageId): array;

    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?int                 $teacherId
     * @param  ?int                 $studentId
     * @param  ?int                 $userType
     * @param  ?int                 $userId
     * @return LengthAwarePaginator
     */
    public function getPaginatedClassChatGroups(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        ?int $teacherId = null,
        ?int $studentId = null,
        ?int $userType = null,
        ?int $userId = null
    ): LengthAwarePaginator;

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
    ): Collection;
}
