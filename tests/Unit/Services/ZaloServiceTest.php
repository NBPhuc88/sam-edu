<?php

use App\Services\Zalo\ZaloService;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.zalopay.app_id'         => '2553',
        'services.zalopay.key1'           => 'Pc9IdSHNY1G2rSUA8hEscIn2gSStructure',
        'services.zalopay.key2'           => 'kLfiR5IdSHNY1G2rSUA8hEscIn2gSSecretKey',
        'services.zalopay.endpoint'       => 'https://sb-openapi.zalopay.vn/v2/create',
        'services.zalopay.query_endpoint' => 'https://sb-openapi.zalopay.vn/v2/query',
        'services.zalopay.callback_url'   => 'https://example.com/api/v1/zalopay/callback',
    ]);

    $this->service = app(ZaloService::class);
});

test('createOrder calculates MAC and posts to ZaloPay endpoint', function () {
    Http::fake([
        'https://sb-openapi.zalopay.vn/v2/create' => Http::response([
            'return_code'    => 1,
            'return_message' => 'Giao dịch thành công',
            'order_url'      => 'https://payment.zalopay.vn/order/12345',
        ], 200),
    ]);

    $result = $this->service->createOrder(
        '260826_123456',
        'CENTER001',
        1000000,
        'Thanh toan goi dich vu'
    );

    expect($result['return_code'])->toBe(1)
        ->and($result['order_url'])->toBe('https://payment.zalopay.vn/order/12345');
});

test('verifyCallback verifies signature using key2 secret', function () {
    $data       = '{"app_trans_id":"260826_123456","amount":1000000}';
    $validMac   = hash_hmac('sha256', $data, 'kLfiR5IdSHNY1G2rSUA8hEscIn2gSSecretKey');
    $invalidMac = 'invalid_mac_signature';

    expect($this->service->verifyCallback($data, $validMac))->toBeTrue();
    expect($this->service->verifyCallback($data, $invalidMac))->toBeFalse();
});
