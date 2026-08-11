<?php

namespace App\Repositories\Payment;

use App\Models\PaymentTransaction;

interface PaymentTransactionRepositoryInterface
{
    public function findByTransactionCode(string $appTransId): ?PaymentTransaction;

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): PaymentTransaction;

    /**
     * @param int                  $id
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): bool;
}
