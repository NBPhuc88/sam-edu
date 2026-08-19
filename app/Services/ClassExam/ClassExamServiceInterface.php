<?php

namespace App\Services\ClassExam;

use App\Models\Admin;
use App\Models\ClassExam;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ClassExamServiceInterface
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

    public function findClassExam(int $id, ?Admin $admin = null): ClassExam;

    /**
     * @param array<string, mixed> $data
     * @param ?Admin               $admin
     */
    public function createClassExam(array $data, ?Admin $admin = null): ClassExam;

    /**
     * @param array<string, mixed> $data
     * @param int                  $id
     * @param ?Admin               $admin
     */
    public function updateClassExam(int $id, array $data, ?Admin $admin = null): ClassExam;

    public function deleteClassExam(int $id, ?Admin $admin = null): bool;

    /**
     * @return array{centers: \Illuminate\Database\Eloquent\Collection<int, \App\Models\Center>, classes: \Illuminate\Database\Eloquent\Collection<int, \App\Models\SchoolClass>, exams: \Illuminate\Database\Eloquent\Collection<int, \App\Models\Exam>}
     * @param  ?Admin                                                                                                                                                                                                                                     $admin
     */
    public function getFormData(?Admin $admin = null): array;

    /**
     * @return array{total: int, scheduled: int, ongoing: int, completed: int}
     * @param  ?Admin                                                          $admin
     */
    public function getStats(?Admin $admin = null): array;
}
