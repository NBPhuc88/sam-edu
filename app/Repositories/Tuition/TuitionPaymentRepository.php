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
        return TuitionPayment::query()
            ->select(
                'id',
                'student_tuition_id',
                'received_by',
                'amount',
                'payment_date',
                'payment_method',
                'transaction_code',
                'note',
                'created_at'
            )
            ->with('studentTuition:id,center_id,student_id,class_id,title,total_amount,paid_amount,remaining_amount,status')
            ->find($id);
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

    /**
     * @param  array<int>|null                                 $allowedCenterIds
     * @param  int                                             $months
     * @return array<int, array{month: string, amount: float}>
     */
    public function getMonthlySumsByCenterIds(?array $allowedCenterIds, int $months = 6): array
    {
        $chart = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date         = now()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth()->toDateString();
            $endOfMonth   = $date->copy()->endOfMonth()->toDateString();
            $amount       = $this->getSumBetweenDates($allowedCenterIds, $startOfMonth, $endOfMonth);

            $chart[] = [
                'month'  => 'Thg ' . $date->format('n/Y'),
                'amount' => $amount,
            ];
        }

        return $chart;
    }
}
