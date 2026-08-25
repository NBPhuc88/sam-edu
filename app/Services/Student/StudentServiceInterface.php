<?php

namespace App\Services\Student;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface StudentServiceInterface
{
    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @return LengthAwarePaginator
     */
    public function getPaginatedStudents(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
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
     * @param  int          $id
     * @param  ?Admin       $admin
     * @param  ?Teacher     $teacher
     * @return Student|null
     */
    public function findStudent(int $id, ?Admin $admin = null, ?Teacher $teacher = null): ?Student;

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Student
     */
    public function createStudent(array $data, ?Admin $admin = null): Student;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Student
     */
    public function updateStudent(int $id, array $data, ?Admin $admin = null): Student;

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteStudent(int $id, ?Admin $admin = null): bool;

    /**
     * @param int        $studentId
     * @param array<int> $classIds
     * @param ?Admin     $admin
     */
    public function assignClassesToStudent(int $studentId, array $classIds, ?Admin $admin = null): void;

    /**
     * @param  int                                        $classId
     * @param  array<int>                                 $studentIds
     * @param  ?Admin                                     $admin
     * @return array{success_count: int, message: string}
     */
    public function bulkAssignStudentsToClass(int $classId, array $studentIds, ?Admin $admin = null): array;

    /**
     * @param int    $studentId
     * @param int    $classId
     * @param ?Admin $admin
     */
    public function removeStudentFromClass(int $studentId, int $classId, ?Admin $admin = null): bool;

    /**
     * @param  int                  $studentId
     * @param  ?string              $weekDate
     * @param  ?Student             $student
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getStudentTimetableData(int $studentId, ?string $weekDate = null, ?Student $student = null, ?Admin $admin = null): array;

    /**
     * @param  int                  $studentId
     * @param  ?string              $filterType
     * @param  ?int                 $filterMonth
     * @param  ?int                 $filterYear
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @param  int                  $perPage
     * @param  int                  $page
     * @return array<string, mixed>
     */
    public function getStudentDetailData(
        int $studentId,
        ?string $filterType = 'month',
        ?int $filterMonth = null,
        ?int $filterYear = null,
        ?Admin $admin = null,
        ?Teacher $teacher = null,
        int $perPage = 20,
        int $page = 1
    ): array;

    /**
     * @param  int                                      $studentId
     * @param  ?string                                  $filterType
     * @param  ?int                                     $filterMonth
     * @param  ?int                                     $filterYear
     * @param  ?Admin                                   $admin
     * @return \Generator<int, array<int, string|null>>
     */
    public function exportStudentAttendanceCsv(
        int $studentId,
        ?string $filterType = 'month',
        ?int $filterMonth = null,
        ?int $filterYear = null,
        ?Admin $admin = null
    ): \Generator;
}
