<?php

use App\Enums\Constant;
use App\Models\Center;
use App\Models\PaymentTransaction;
use App\Services\Payment\PaymentService;
use App\Services\Zalo\ZaloServiceInterface;

beforeEach(function () {
    $this->zaloMock = Mockery::mock(ZaloServiceInterface::class);
    $this->app->instance(ZaloServiceInterface::class, $this->zaloMock);

    $this->service = app(PaymentService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test PaymentService',
        'status' => Constant::STATUS_ACTIVE,
    ]);
});

test('createZaloPayOrder creates pending transaction and order URL', function () {
    $this->zaloMock->shouldReceive('createOrder')
        ->once()
        ->andReturn([
            'return_code' => 1,
            'order_url'   => 'https://payment.zalopay.vn/order/123456',
            'qr_code'     => 'zalopay_qr_code_sample',
        ]);

    $data = [
        'center_id'       => $this->center->id,
        'amount'          => 5000000,
        'plan_code'       => 'pro_yearly',
        'plan_name'       => 'Goi Pro 1 Nam',
        'duration_months' => 12,
    ];

    $result = $this->service->createZaloPayOrder($data);

    expect($result['success'])->toBeTrue()
        ->and($result['order_url'])->toBe('https://payment.zalopay.vn/order/123456');

    $this->assertDatabaseHas('payment_transactions', [
        'center_id' => $this->center->id,
        'amount'    => 5000000,
        'status'    => Constant::PAYMENT_STATUS_PENDING,
    ]);
});

test('handleZaloPayCallback updates transaction to success and extends center expiration date', function () {
    $transaction = PaymentTransaction::create([
        'center_id'      => $this->center->id,
        'app_trans_id'   => '260826_998877',
        'payment_method' => Constant::PAYMENT_METHOD_ZALOPAY,
        'amount'         => 1000000,
        'status'         => Constant::PAYMENT_STATUS_PENDING,
    ]);

    $callbackData = json_encode([
        'app_trans_id' => '260826_998877',
        'zp_trans_id'  => '9988776655',
        'embed_data'   => json_encode(['duration_days' => 30, 'plan_code' => 'basic_monthly']),
    ]);
    $mac = 'valid_mac_hash';

    $this->zaloMock->shouldReceive('verifyCallback')
        ->once()
        ->with($callbackData, $mac)
        ->andReturn(true);

    $result = $this->service->handleZaloPayCallback($callbackData, $mac);

    expect($result['return_code'])->toBe(1);
    expect($transaction->fresh()->status)->toBe(Constant::PAYMENT_STATUS_SUCCESS);
    expect($this->center->fresh()->expires_at)->not()->toBeNull();
});
