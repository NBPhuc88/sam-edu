<?php

namespace App\Services\Teacher;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TeacherServiceInterface
{
    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedTeachers(
        ?string $search = null,
        ?int $centerId = null,
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
     * @param  int          $id
     * @param  ?Admin       $admin
     * @return Teacher|null
     */
    public function findTeacher(int $id, ?Admin $admin = null): ?Teacher;

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Teacher
     */
    public function createTeacher(array $data, ?Admin $admin = null): Teacher;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Teacher
     */
    public function updateTeacher(int $id, array $data, ?Admin $admin = null): Teacher;

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteTeacher(int $id, ?Admin $admin = null): bool;

    /**
     * @param  int                  $teacherId
     * @param  ?string              $weekDate
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getTeacherTimetableData(int $teacherId, ?string $weekDate = null, ?Admin $admin = null): array;

    /**
     * @param  int                  $teacherId
     * @param  ?string              $filterType
     * @param  ?int                 $filterMonth
     * @param  ?int                 $filterYear
     * @param  ?Admin               $admin
     * @param  int                  $perPage
     * @param  int                  $page
     * @return array<string, mixed>
     */
    public function getTeacherDetailData(
        int $teacherId,
        ?string $filterType = 'month',
        ?int $filterMonth = null,
        ?int $filterYear = null,
        ?Admin $admin = null,
        int $perPage = 20,
        int $page = 1
    ): array;

    /**
     * @param  int                                      $teacherId
     * @param  ?string                                  $filterType
     * @param  ?int                                     $filterMonth
     * @param  ?int                                     $filterYear
     * @param  ?Admin                                   $admin
     * @return \Generator<int, array<int, string|null>>
     */
    public function exportTeacherSessionsCsv(
        int $teacherId,
        ?string $filterType = 'month',
        ?int $filterMonth = null,
        ?int $filterYear = null,
        ?Admin $admin = null
    ): \Generator;
    /**
     * @return \Generator<int, string>
     * @param  int                     $teacherId
     * @param  int                     $month
     * @param  int                     $year
     * @param  ?Admin                  $admin
     */
    public function exportTeacherSessionsExcel(int $teacherId, int $month, int $year, ?Admin $admin): \Generator;

    /**
     * @return array{path: string, filename: string}
     * @param  int                                   $month
     * @param  int                                   $year
     * @param  ?int                                  $centerId
     * @param  ?Admin                                $admin
     */
    public function exportAttendanceZip(int $month, int $year, ?int $centerId, ?Admin $admin): array;
}
