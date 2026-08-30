<?php

namespace App\Services\Payment;

use App\Enums\Constant;

class PaymentGatewayFactory
{
    /**
     * Khởi tạo Payment Gateway Instance phù hợp với phương thức thanh toán.
     *
     * @param  int|string              $paymentMethod
     * @return PaymentGatewayInterface
     */
    public static function make(int|string $paymentMethod): PaymentGatewayInterface
    {
        return match ($paymentMethod) {
            Constant::PAYMENT_METHOD_BANK_TRANSFER, 'bank_transfer', 'vietqr' => new BankTransferGateway(),
            Constant::PAYMENT_METHOD_ZALOPAY, 'zalopay'                       => new ZaloPayGateway(),
            default                                                           => new ZaloPayGateway(),
        };
    }
}
