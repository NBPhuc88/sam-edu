<?php

namespace App\Services\Exam;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Exam;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ExamServiceInterface
{
    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  int|string|null      $examType
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  Admin|Teacher|null   $user
     * @return LengthAwarePaginator
     */
    public function getPaginatedExams(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $subjectId = null,
        int|string|null $examType = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        Admin|Teacher|null $user = null
    ): LengthAwarePaginator;

    /**
     * @param  Admin|Teacher|null   $user
     * @return array<string, mixed>
     */
    public function getFormData(Admin|Teacher|null $user = null): array;

    /**
     * @param  int                $id
     * @param  Admin|Teacher|null $user
     * @return Exam|null
     */
    public function findExam(int $id, Admin|Teacher|null $user = null): ?Exam;

    /**
     * @param  array<string, mixed> $data
     * @param  Admin|Teacher|null   $user
     * @return Exam
     */
    public function createExam(array $data, Admin|Teacher|null $user = null): Exam;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  Admin|Teacher|null   $user
     * @return Exam
     */
    public function updateExam(int $id, array $data, Admin|Teacher|null $user = null): Exam;

    /**
     * @param  int                $id
     * @param  Admin|Teacher|null $user
     * @return bool
     */
    public function deleteExam(int $id, Admin|Teacher|null $user = null): bool;

    /**
     * @param  Admin|Teacher|null $user
     * @return array<string, int>
     */
    public function getStats(Admin|Teacher|null $user = null): array;
}
