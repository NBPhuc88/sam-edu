<?php

namespace App\Repositories\Class;

use App\Models\SchoolClass;
use App\Models\Student;

interface SchoolClassRepositoryInterface
{
    public function findById(int $classId): ?SchoolClass;

    /**
     * @return \Generator<int, Student>
     */
    public function getClassStudentsCursor(int $classId): \Generator;

    public function attachStudent(int $classId, int $studentId, ?string $note = null): bool;
}
