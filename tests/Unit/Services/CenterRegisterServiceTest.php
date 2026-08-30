<?php

use App\Services\Center\CenterRegisterService;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Mail::fake();
    $this->service = app(CenterRegisterService::class);
});

test('registerStep1 registers center with trial plan when online payment is disabled', function () {
    config(['payment.enable_online_payment' => false]);

    $data = [
        'name'              => 'Trung Tam Tuong Lai',
        'email'             => 'contact@tuonglai.edu.vn',
        'phone'             => '0933445566',
        'subscription_plan' => 'trial',
    ];

    $result = $this->service->registerStep1($data);

    expect($result['success'])->toBeTrue()
        ->and($result['step'])->toBe('contact_notification');

    $this->assertDatabaseHas('centers', [
        'name'  => 'Trung Tam Tuong Lai',
        'email' => 'contact@tuonglai.edu.vn',
    ]);
});

test('getRegisterPageData returns plans and payment configuration', function () {
    $data = $this->service->getRegisterPageData();

    expect($data)->toHaveKeys(['plans', 'enableOnlinePayment', 'paymentGateways']);
});
