<?php

namespace App\Services\Class;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\SchoolClass;
use App\Models\Student;
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
     * @param  ?Student             $student
     * @return LengthAwarePaginator
     */
    public function getPaginatedClasses(
        ?string $search = null,
        ?int $centerId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        ?Admin $admin = null,
        ?Teacher $teacher = null,
        ?Student $student = null
    ): LengthAwarePaginator;

    /**
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @param  ?Student             $student
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null, ?Teacher $teacher = null, ?Student $student = null): array;

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

    public function getClassWithCenter(int $classId, ?Admin $admin = null, ?Teacher $teacher = null): SchoolClass;

    public function getPaginatedClassStudents(int $classId, ?string $search = null, int $perPage = Constant::DEFAULT_PER_PAGE, int $page = Constant::DEFAULT_PAGE, ?Admin $admin = null, ?Teacher $teacher = null): LengthAwarePaginator;

    /**
     * @param  int                  $classId
     * @param  ?string              $weekDate
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @return array<string, mixed>
     */
    public function getClassTimetableData(int $classId, ?string $weekDate = null, ?Admin $admin = null, ?Teacher $teacher = null): array;

    /**
     * @param  int                                                                $classId
     * @param  ?string                                                            $search
     * @param  ?Admin                                                             $admin
     * @param  ?Teacher                                                           $teacher
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\Student>
     */
    public function getAvailableStudents(int $classId, ?string $search = null, ?Admin $admin = null, ?Teacher $teacher = null): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  int        $classId
     * @param  array<int> $studentIds
     * @param  ?Admin     $admin
     * @param  ?Teacher   $teacher
     * @return int
     */
    public function addStudentsToClass(int $classId, array $studentIds, ?Admin $admin = null, ?Teacher $teacher = null): int;

    /**
     * @param  int      $classId
     * @param  int      $studentId
     * @param  ?Admin   $admin
     * @param  ?Teacher $teacher
     * @return bool
     */
    public function removeStudentFromClass(int $classId, int $studentId, ?Admin $admin = null, ?Teacher $teacher = null): bool;

    /**
     * @param  int      $classId
     * @param  int      $studentId
     * @param  string   $status
     * @param  ?string  $note
     * @param  ?Admin   $admin
     * @param  ?Teacher $teacher
     * @return bool
     */
    public function updateClassStudentStatus(int $classId, int $studentId, string $status, ?string $note = null, ?Admin $admin = null, ?Teacher $teacher = null): bool;
}
