<?php

namespace App\Repositories\Payment;

use App\Models\PaymentTransaction;

class PaymentTransactionRepository implements PaymentTransactionRepositoryInterface
{
    public function findByTransactionCode(string $appTransId): ?PaymentTransaction
    {
        /** @var PaymentTransaction|null $transaction */
        $transaction = PaymentTransaction::where('transaction_code', $appTransId)->first();

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
}
