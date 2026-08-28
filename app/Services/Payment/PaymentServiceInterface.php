<?php

namespace App\Services\Payment;

use App\Models\Admin;
use Illuminate\Database\Eloquent\Collection;

interface PaymentServiceInterface
{
    /**
     * @return Collection
     */
    public function getSubscriptionPlans(): Collection;

    /**
     * Send email request to system admin for center subscription renewal.
     *
     * @param  array<string, mixed> $data
     * @param  Admin|null           $requestingUser
     * @return array<string, mixed>
     */
    public function requestRenewal(array $data, ?Admin $requestingUser = null): array;

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
