<?php

namespace App\Services\Tuition;

use App\Models\Admin;
use App\Models\StudentTuition;
use App\Models\TuitionPayment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface StudentTuitionServiceInterface
{
    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?int                 $studentId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedTuitions(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $studentId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null
    ): LengthAwarePaginator;

    /**
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getSummaryStats(?Admin $admin = null): array;

    /**
     * @param  ?Admin               $admin
     * @param  ?int                 $selectedCenterId
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null, ?int $selectedCenterId = null): array;

    /**
     * @param  int                 $id
     * @param  ?Admin              $admin
     * @return StudentTuition|null
     */
    public function findTuition(int $id, ?Admin $admin = null): ?StudentTuition;

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return StudentTuition
     */
    public function createTuition(array $data, ?Admin $admin = null): StudentTuition;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return StudentTuition
     */
    public function updateTuition(int $id, array $data, ?Admin $admin = null): StudentTuition;

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteTuition(int $id, ?Admin $admin = null): bool;

    /**
     * @param  int                  $tuitionId
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return TuitionPayment
     */
    public function recordPayment(int $tuitionId, array $data, ?Admin $admin = null): TuitionPayment;

    /**
     * @param  int                  $paymentId
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return TuitionPayment
     */
    public function updatePayment(int $paymentId, array $data, ?Admin $admin = null): TuitionPayment;

    /**
     * @param  int    $paymentId
     * @param  ?Admin $admin
     * @return bool
     */
    public function deletePayment(int $paymentId, ?Admin $admin = null): bool;

    /**
     * @param  int  $tuitionId
     * @return void
     */
    public function recalculateSummary(int $tuitionId): void;
}
