<?php

namespace App\Services\Class;

use App\Models\Admin;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SchoolClassServiceInterface
{
    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @return LengthAwarePaginator
     */
    public function getPaginatedClasses(
        ?string $search = null,
        ?int $centerId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null,
        ?Teacher $teacher = null
    ): LengthAwarePaginator;

    /**
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null, ?Teacher $teacher = null): array;

    /**
     * @param  int              $id
     * @param  ?Admin           $admin
     * @param  ?Teacher         $teacher
     * @return SchoolClass|null
     */
    public function findClass(int $id, ?Admin $admin = null, ?Teacher $teacher = null): ?SchoolClass;

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return SchoolClass
     */
    public function createClass(array $data, ?Admin $admin = null): SchoolClass;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return SchoolClass
     */
    public function updateClass(int $id, array $data, ?Admin $admin = null): SchoolClass;

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteClass(int $id, ?Admin $admin = null): bool;

    public function getClassWithCenter(int $classId, ?Admin $admin = null): SchoolClass;

    public function getPaginatedClassStudents(int $classId, ?string $search = null, int $perPage = 15, int $page = 1, ?Admin $admin = null): LengthAwarePaginator;

    /**
     * @param  int                  $classId
     * @param  ?string              $weekDate
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @return array<string, mixed>
     */
    public function getClassTimetableData(int $classId, ?string $weekDate = null, ?Admin $admin = null, ?Teacher $teacher = null): array;
}
