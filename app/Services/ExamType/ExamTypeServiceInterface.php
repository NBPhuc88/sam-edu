<?php

namespace App\Services\ExamType;

use App\Models\Admin;
use App\Models\ExamType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ExamTypeServiceInterface
{
    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedExamTypes(
        ?string $search = null,
        ?int $centerId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null
    ): LengthAwarePaginator;

    /**
     * @param  ?int                      $centerId
     * @param  ?Admin                    $admin
     * @return Collection<int, ExamType>
     */
    public function getActiveExamTypes(?int $centerId = null, ?Admin $admin = null): Collection;

    /**
     * @param  int      $id
     * @param  ?Admin   $admin
     * @return ExamType
     */
    public function findExamType(int $id, ?Admin $admin = null): ExamType;

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return ExamType
     */
    public function createExamType(array $data, ?Admin $admin = null): ExamType;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return ExamType
     */
    public function updateExamType(int $id, array $data, ?Admin $admin = null): ExamType;

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteExamType(int $id, ?Admin $admin = null): bool;

    /**
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null): array;
}
