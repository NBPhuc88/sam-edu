<?php

namespace App\Services\Teacher;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TeacherServiceInterface
{
    public function getPaginatedTeachers(?string $search = null, ?int $centerId = null, int $perPage = 15, int $page = 1): LengthAwarePaginator;
}
