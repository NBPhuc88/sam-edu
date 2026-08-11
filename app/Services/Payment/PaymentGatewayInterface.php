<?php

namespace App\Services\Payment;

interface PaymentGatewayInterface
{
    /**
     * Khởi tạo đơn hàng thanh toán.
     *
     * @param  array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function createOrder(array $data): array;

    /**
     * Kiểm tra trạng thái đơn hàng thanh toán.
     *
     * @param  string               $transactionCode
     * @return array<string, mixed>
     */
    public function checkStatus(string $transactionCode): array;
}
