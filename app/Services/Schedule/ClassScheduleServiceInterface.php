<?php

namespace App\Services\Schedule;

use App\Enums\Constant;
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
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
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

    /**
     * Đồng bộ ca học thông minh tiết kiệm RAM (stream qua cursor và gom batch 1000 items).
     *
     * @param  int                                          $classSubjectId
     * @param  array<int, array<string, mixed>>             $newFutureSlots
     * @param  string                                       $fromDate
     * @return array{kept: int, deleted: int, created: int}
     */
    public function syncSessionsWithChunking(int $classSubjectId, array $newFutureSlots, string $fromDate): array;

    /**
     * Tái sinh các ca học tương lai khi cấu hình lịch hoặc ngày lễ thay đổi.
     *
     * @param  ClassSchedule      $schedule
     * @return ClassSchedule|null
     */
    public function regenerateFutureSessions(ClassSchedule $schedule): ?ClassSchedule;
}
