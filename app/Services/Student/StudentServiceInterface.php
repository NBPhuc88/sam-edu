<?php

namespace App\Services\Student;

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
}
