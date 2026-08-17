<?php

namespace App\Services\Subject;

use App\Models\Admin;
use App\Models\Subject;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SubjectServiceInterface
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
    public function getPaginatedSubjects(
        ?string $search = null,
        ?int $centerId = null,
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
     * @param  int          $id
     * @param  ?Admin       $admin
     * @return Subject|null
     */
    public function findSubject(int $id, ?Admin $admin = null): ?Subject;

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Subject
     */
    public function createSubject(array $data, ?Admin $admin = null): Subject;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Subject
     */
    public function updateSubject(int $id, array $data, ?Admin $admin = null): Subject;

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteSubject(int $id, ?Admin $admin = null): bool;
}
