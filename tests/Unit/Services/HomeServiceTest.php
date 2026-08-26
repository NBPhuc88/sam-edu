<?php

use App\Services\Home\HomeService;

beforeEach(function () {
    $this->service = app(HomeService::class);
});

test('getLandingPageData returns landing page hero and promotion banner data', function () {
    $data = $this->service->getLandingPageData();

    expect($data)->toHaveKeys(['hero', 'promotionBanner', 'plans']);
});

test('getContactPageData returns company contact info and payment configs', function () {
    $data = $this->service->getContactPageData();

    expect($data)->toHaveKeys(['contactInfo', 'enableOnlinePayment', 'paymentGateways']);
});
