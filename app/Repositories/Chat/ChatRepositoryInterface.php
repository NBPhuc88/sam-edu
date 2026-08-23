<?php

namespace App\Repositories\Chat;

use App\Models\ClassChatMessage;
use Illuminate\Database\Eloquent\Collection;

interface ChatRepositoryInterface
{
    /**
     * @param  int                               $classId
     * @param  int                               $limit
     * @return Collection<int, ClassChatMessage>
     */
    public function getRecentMessages(int $classId, int $limit = 50): Collection;

    public function getPinnedMessage(int $classId): ?ClassChatMessage;

    /**
     * @param array<string, mixed> $data
     */
    public function createMessage(array $data): ClassChatMessage;

    public function togglePinMessage(int $classId, int $messageId, string $pinnedByName): ?ClassChatMessage;

    /**
     * @param  ?string                                               $search
     * @param  array<int>|int|null                                   $centerIds
     * @param  ?int                                                  $classId
     * @param  ?string                                               $status
     * @param  int                                                   $perPage
     * @param  int                                                   $page
     * @param  ?int                                                  $teacherId
     * @param  ?int                                                  $studentId
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getPaginatedClassChatGroups(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?int $teacherId = null,
        ?int $studentId = null
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

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
