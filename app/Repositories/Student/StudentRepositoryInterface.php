<?php

namespace App\Repositories\Student;

use App\Models\Student;

interface StudentRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Student;

    /**
     * @return \Generator<int, Student>
     * @param  ?int                     $centerId
     */
    public function getStudentsCursor(?int $centerId = null): \Generator;

    public function findByCode(string $studentCode): ?Student;

    /**
     * @param array<string, mixed> $data
     * @param string               $studentCode
     */
    public function updateOrCreateByCode(string $studentCode, array $data): Student;
}
