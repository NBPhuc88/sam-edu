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

    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator;

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Student|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Student;

    /**
     * @param  array<string, mixed> $data
     * @return Student
     */
    public function create(array $data): Student;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Student
     */
    public function update(int $id, array $data): Student;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;
}
