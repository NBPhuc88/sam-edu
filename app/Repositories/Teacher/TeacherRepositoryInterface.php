<?php

namespace App\Repositories\Teacher;

use App\Models\Teacher;

interface TeacherRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Teacher;

    /**
     * @return \Generator<int, Teacher>
     * @param  ?int                     $centerId
     */
    public function getTeachersCursor(?int $centerId = null): \Generator;

    public function findByCode(string $teacherCode): ?Teacher;

    /**
     * @param array<string, mixed> $data
     * @param string               $teacherCode
     */
    public function updateOrCreateByCode(string $teacherCode, array $data): Teacher;
}
