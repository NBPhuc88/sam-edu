<?php

namespace App\Services\Tuition;

use App\Enums\Constant;
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
     * @param  ?string              $month
     * @return LengthAwarePaginator
     */
    public function getPaginatedTuitions(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $studentId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        ?Admin $admin = null,
        ?string $month = null
    ): LengthAwarePaginator;

    /**
     * @param  ?Admin               $admin
     * @param  ?int                 $selectedCenterId
     * @param  ?int                 $classId
     * @param  ?string              $month
     * @return array<string, mixed>
     */
    public function getSummaryStats(
        ?Admin $admin = null,
        ?int $selectedCenterId = null,
        ?int $classId = null,
        ?string $month = null
    ): array;

    /**
     * @param  int                  $studentId
     * @return array<string, mixed>
     */
    public function getStudentTuitionSummary(int $studentId): array;

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

    /**
     * @param  ?string    $search
     * @param  ?int       $centerId
     * @param  ?int       $classId
     * @param  ?string    $status
     * @param  ?string    $month
     * @param  ?Admin     $admin
     * @return \Generator
     */
    public function exportTuitionsHtml(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?string $status = null,
        ?string $month = null,
        ?Admin $admin = null
    ): \Generator;

    /**
     * @param  ?string    $search
     * @param  ?int       $centerId
     * @param  ?int       $classId
     * @param  ?string    $status
     * @param  ?string    $month
     * @param  ?Admin     $admin
     * @return \Generator
     */
    public function exportTuitionsCsv(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?string $status = null,
        ?string $month = null,
        ?Admin $admin = null
    ): \Generator;

    /**
     * @param  ?Admin               $admin
     * @param  ?int                 $selectedCenterId
     * @param  ?int                 $classId
     * @param  ?string              $month
     * @return array<string, mixed>
     */
    public function getDetailedChartStats(
        ?Admin $admin = null,
        ?int $selectedCenterId = null,
        ?int $classId = null,
        ?string $month = null
    ): array;
}
