<?php

namespace App\Services\Payment;

class PaymentGatewayFactory
{
    /**
     * Khởi tạo Payment Gateway Instance phù hợp với phương thức thanh toán.
     *
     * @param  string                  $paymentMethod ('zalopay', 'bank_transfer', 'momo', 'vnpay')
     * @return PaymentGatewayInterface
     */
    public static function make(string $paymentMethod): PaymentGatewayInterface
    {
        return match ($paymentMethod) {
            'zalopay'                 => new ZaloPayGateway(),
            'bank_transfer', 'vietqr' => new BankTransferGateway(),
            default                   => new ZaloPayGateway(),
        };
    }
}
