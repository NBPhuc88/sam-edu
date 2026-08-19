<?php

namespace App\Repositories\ClassExam;

use App\Models\Admin;
use App\Models\ClassExam;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ClassExamRepositoryInterface
{
    /**
     * @return LengthAwarePaginator<ClassExam>
     * @param  ?string                         $search
     * @param  ?int                            $centerId
     * @param  ?int                            $classId
     * @param  ?int                            $examId
     * @param  ?string                         $status
     * @param  int                             $perPage
     * @param  int                             $page
     * @param  ?Admin                          $admin
     */
    public function getPaginatedClassExams(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $examId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null
    ): LengthAwarePaginator;

    public function findById(int $id, ?Admin $admin = null): ?ClassExam;

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): ClassExam;

    /**
     * @param array<string, mixed> $data
     * @param ClassExam            $classExam
     */
    public function update(ClassExam $classExam, array $data): ClassExam;

    public function delete(ClassExam $classExam): bool;

    /**
     * @return array{total: int, scheduled: int, ongoing: int, completed: int}
     * @param  ?Admin                                                          $admin
     */
    public function getStats(?Admin $admin = null): array;
}
