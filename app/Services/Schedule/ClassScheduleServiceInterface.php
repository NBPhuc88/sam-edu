<?php

namespace App\Services\Schedule;

use App\Models\Admin;
use App\Models\ClassSchedule;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ClassScheduleServiceInterface
{
    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  ?int                 $teacherId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedSchedules(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $subjectId = null,
        ?int $teacherId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null
    ): LengthAwarePaginator;

    /**
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null): array;

    /**
     * @param  int                $id
     * @param  ?Admin             $admin
     * @return ClassSchedule|null
     */
    public function findSchedule(int $id, ?Admin $admin = null): ?ClassSchedule;

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return ClassSchedule
     */
    public function createSchedule(array $data, ?Admin $admin = null): ClassSchedule;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return ClassSchedule
     */
    public function updateSchedule(int $id, array $data, ?Admin $admin = null): ClassSchedule;

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteSchedule(int $id, ?Admin $admin = null): bool;
}
