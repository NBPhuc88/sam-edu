<?php

namespace App\Repositories\Schedule;

use App\Models\ClassSchedule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ClassScheduleRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  ?int                 $teacherId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?int $subjectId = null,
        ?int $teacherId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator;

    /**
     * @param  int                $id
     * @param  array<int>|null    $allowedCenterIds
     * @return ClassSchedule|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?ClassSchedule;

    /**
     * @param  array<string, mixed> $data
     * @return ClassSchedule
     */
    public function create(array $data): ClassSchedule;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return ClassSchedule
     */
    public function update(int $id, array $data): ClassSchedule;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * @param  int                            $classSubjectId
     * @return Collection<int, ClassSchedule>
     */
    public function getByClassSubjectId(int $classSubjectId): Collection;
}
