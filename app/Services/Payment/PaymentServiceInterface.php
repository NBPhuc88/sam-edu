<?php

namespace App\Services\Payment;

use Illuminate\Database\Eloquent\Collection;

interface PaymentServiceInterface
{
    /**
     * @return Collection
     */
    public function getSubscriptionPlans(): Collection;

    /**
     * @param  array<string, mixed> $validated
     * @return array<string, mixed>
     */
    public function createZaloPayOrder(array $validated): array;

    /**
     * @param  string               $data
     * @param  string               $mac
     * @return array<string, mixed>
     */
    public function handleZaloPayCallback(string $data, string $mac): array;

    /**
     * @param  string               $appTransId
     * @return array<string, mixed>
     */
    public function checkOrderStatus(string $appTransId): array;
}
