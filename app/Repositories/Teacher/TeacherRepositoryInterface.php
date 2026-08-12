<?php

namespace App\Repositories\Teacher;

use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TeacherRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Teacher;

    /**
     * @param  ?int                     $centerId
     * @return \Generator<int, Teacher>
     */
    public function getTeachersCursor(?int $centerId = null): \Generator;

    public function findByCode(string $teacherCode): ?Teacher;

    /**
     * @param string               $teacherCode
     * @param array<string, mixed> $data
     */
    public function updateOrCreateByCode(string $teacherCode, array $data): Teacher;

    public function paginate(?string $search = null, ?int $centerId = null, int $perPage = 15, int $page = 1): LengthAwarePaginator;
}
