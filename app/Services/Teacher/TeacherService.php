<?php

namespace App\Services\Teacher;

use App\Repositories\Teacher\TeacherRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TeacherService implements TeacherServiceInterface
{
    public function __construct(
        protected TeacherRepositoryInterface $teacherRepository
    ) {
    }

    public function getPaginatedTeachers(?string $search = null, ?int $centerId = null, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        return $this->teacherRepository->paginate($search, $centerId, $perPage, $page);
    }
}
