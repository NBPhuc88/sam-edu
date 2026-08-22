<?php

namespace App\Repositories\Exam;

use App\Models\Exam;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ExamRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  int|array<int>|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  int|string|null      $examType
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        int|array|null $centerIds = null,
        ?int $classId = null,
        ?int $subjectId = null,
        int|string|null $examType = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator;

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Exam|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Exam;

    /**
     * @param  array<string, mixed> $data
     * @return Exam
     */
    public function create(array $data): Exam;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Exam
     */
    public function update(int $id, array $data): Exam;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * @param  array<int> $centerIds
     * @return int
     */
    public function countByCenterIds(array $centerIds): int;

    /**
     * @param  int      $centerId
     * @param  string   $code
     * @param  int|null $excludeId
     * @return bool
     */
    public function codeExists(int $centerId, string $code, ?int $excludeId = null): bool;

    /**
     * @param  Exam              $exam
     * @param  array<int, mixed> $questions
     * @return void
     */
    public function syncQuestions(Exam $exam, array $questions): void;

    /**
     * @param  Exam              $exam
     * @param  array<int, mixed> $sections
     * @return void
     */
    public function syncSections(Exam $exam, array $sections): void;

    /**
     * @param  array<int>|null    $allowedCenterIds
     * @return array<string, int>
     */
    public function getStats(?array $allowedCenterIds = null): array;

    /**
     * @param  ?array<int>                                                     $allowedCenterIds
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\Exam>
     */
    public function getPublishedExamsForDropdown(?array $allowedCenterIds = null): \Illuminate\Database\Eloquent\Collection;
}
