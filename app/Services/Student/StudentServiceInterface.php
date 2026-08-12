<?php

namespace App\Services\Student;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface StudentServiceInterface
{
    public function getPaginatedStudents(?string $search = null, ?int $centerId = null, int $perPage = 15, int $page = 1): LengthAwarePaginator;
}
