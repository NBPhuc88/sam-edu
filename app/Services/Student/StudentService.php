<?php

namespace App\Services\Student;

use App\Repositories\Student\StudentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StudentService implements StudentServiceInterface
{
    public function __construct(
        protected StudentRepositoryInterface $studentRepository
    ) {
    }

    public function getPaginatedStudents(?string $search = null, ?int $centerId = null, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        return $this->studentRepository->paginate($search, $centerId, $perPage, $page);
    }
}
