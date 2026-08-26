<?php

use App\Services\Setting\SettingService;

beforeEach(function () {
    $this->service = app(SettingService::class);
});

test('getSettingsData returns system settings and SEO metadata', function () {
    $data = $this->service->getSettingsData();

    expect($data)->toHaveKeys(['settings', 'seo']);
});

test('updateSettings updates system settings key-values in database', function () {
    $settingsData = [
        'system_name'   => 'SAM Education System Updated',
        'contact_email' => 'contact_updated@sam.edu.vn',
    ];

    $this->service->updateSettings($settingsData);

    $data = $this->service->getSettingsData();
    expect($data['settings']['system_name'])->toBe('SAM Education System Updated');
    expect($data['settings']['contact_email'])->toBe('contact_updated@sam.edu.vn');
});
