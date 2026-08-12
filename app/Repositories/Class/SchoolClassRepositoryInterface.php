<?php

namespace App\Repositories\Class;

use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SchoolClassRepositoryInterface
{
    public function findById(int $classId): ?SchoolClass;

    /**
     * @param  int                      $classId
     * @return \Generator<int, Student>
     */
    public function getClassStudentsCursor(int $classId): \Generator;

    public function attachStudent(int $classId, int $studentId, ?string $note = null): bool;

    public function getPaginatedClassStudents(SchoolClass $schoolClass, ?string $search = null, int $perPage = 15, int $page = 1): LengthAwarePaginator;
}
