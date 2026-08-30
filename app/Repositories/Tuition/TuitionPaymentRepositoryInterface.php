<?php

namespace App\Repositories\Tuition;

use App\Models\TuitionPayment;

interface TuitionPaymentRepositoryInterface
{
    /**
     * @param  int                 $id
     * @return TuitionPayment|null
     */
    public function find(int $id): ?TuitionPayment;

    /**
     * @param  array<string, mixed> $data
     * @return TuitionPayment
     */
    public function create(array $data): TuitionPayment;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return TuitionPayment
     */
    public function update(int $id, array $data): TuitionPayment;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * @param  array<int>|null $allowedCenterIds
     * @param  string          $startDate
     * @param  string          $endDate
     * @return float
     */
    public function getSumBetweenDates(?array $allowedCenterIds, string $startDate, string $endDate): float;

    /**
     * @param  array<int>|null                                 $allowedCenterIds
     * @param  int                                             $months
     * @return array<int, array{month: string, amount: float}>
     */
    public function getMonthlySumsByCenterIds(?array $allowedCenterIds, int $months = 6): array;
}
