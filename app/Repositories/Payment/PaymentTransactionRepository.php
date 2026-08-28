<?php

namespace App\Repositories\Payment;

use App\Models\PaymentTransaction;

class PaymentTransactionRepository implements PaymentTransactionRepositoryInterface
{
    public function findByTransactionCode(string $appTransId): ?PaymentTransaction
    {
        /** @var PaymentTransaction|null $transaction */
        $transaction = PaymentTransaction::where('app_trans_id', $appTransId)->first();

        return $transaction;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): PaymentTransaction
    {
        /** @var PaymentTransaction $transaction */
        $transaction = PaymentTransaction::create($data);

        return $transaction;
    }

    /**
     * @param int                  $id
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): bool
    {
        /** @var PaymentTransaction|null $transaction */
        $transaction = PaymentTransaction::find($id);

        return $transaction ? $transaction->update($data) : false;
    }

    /**
     * @param  \Carbon\CarbonInterface $start
     * @param  \Carbon\CarbonInterface $end
     * @return array<int, int>
     */
    public function getSuccessfulCenterIdsBetween(\Carbon\CarbonInterface $start, \Carbon\CarbonInterface $end): array
    {
        return PaymentTransaction::where('status', \App\Enums\Constant::PAYMENT_STATUS_SUCCESS)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('updated_at', [$start, $end])
                    ->orWhereBetween('paid_at', [$start, $end]);
            })
            ->pluck('center_id')
            ->toArray();
    }
}
