<?php

namespace App\Repositories\Student;

use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface StudentRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Student;

    /**
     * @param  ?int                     $centerId
     * @return \Generator<int, Student>
     */
    public function getStudentsCursor(?int $centerId = null): \Generator;

    public function findByCode(string $studentCode): ?Student;

    /**
     * @param string               $studentCode
     * @param array<string, mixed> $data
     */
    public function updateOrCreateByCode(string $studentCode, array $data): Student;

    public function paginate(?string $search = null, ?int $centerId = null, int $perPage = 15, int $page = 1): LengthAwarePaginator;
}
