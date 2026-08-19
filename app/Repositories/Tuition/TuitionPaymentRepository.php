<?php

namespace App\Repositories\Tuition;

use App\Models\TuitionPayment;

class TuitionPaymentRepository implements TuitionPaymentRepositoryInterface
{
    /**
     * @param  int                 $id
     * @return TuitionPayment|null
     */
    public function find(int $id): ?TuitionPayment
    {
        return TuitionPayment::with('studentTuition')->find($id);
    }

    /**
     * @param  array<string, mixed> $data
     * @return TuitionPayment
     */
    public function create(array $data): TuitionPayment
    {
        return TuitionPayment::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return TuitionPayment
     */
    public function update(int $id, array $data): TuitionPayment
    {
        $payment = TuitionPayment::findOrFail($id);
        $payment->update($data);

        return $payment;
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $payment = TuitionPayment::findOrFail($id);

        return (bool) $payment->delete();
    }

    /**
     * @param  array<int>|null $allowedCenterIds
     * @param  string          $startDate
     * @param  string          $endDate
     * @return float
     */
    public function getSumBetweenDates(?array $allowedCenterIds, string $startDate, string $endDate): float
    {
        $query = TuitionPayment::query()
            ->whereBetween('payment_date', [$startDate, $endDate]);

        if ($allowedCenterIds !== null) {
            $query->whereHas('studentTuition', function ($q) use ($allowedCenterIds) {
                $q->whereIn('center_id', $allowedCenterIds);
            });
        }

        return (float) $query->sum('amount');
    }
}
