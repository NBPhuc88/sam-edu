<?php

namespace App\Services\Exam;

use App\Models\Admin;
use App\Models\Exam;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ExamServiceInterface
{
    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  ?string              $examType
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedExams(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $subjectId = null,
        ?string $examType = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null
    ): LengthAwarePaginator;

    /**
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null): array;

    /**
     * @param  int       $id
     * @param  ?Admin    $admin
     * @return Exam|null
     */
    public function findExam(int $id, ?Admin $admin = null): ?Exam;

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Exam
     */
    public function createExam(array $data, ?Admin $admin = null): Exam;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Exam
     */
    public function updateExam(int $id, array $data, ?Admin $admin = null): Exam;

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteExam(int $id, ?Admin $admin = null): bool;

    /**
     * @param  ?Admin             $admin
     * @return array<string, int>
     */
    public function getStats(?Admin $admin = null): array;
}
