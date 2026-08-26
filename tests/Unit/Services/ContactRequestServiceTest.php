<?php

use App\Models\ContactRequest;
use App\Services\Home\ContactRequestService;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Mail::fake();
    $this->service = app(ContactRequestService::class);
});

test('submitContact creates contact request and queues notification email', function () {
    $data = [
        'full_name'   => 'Nguyen Van Tu',
        'phone'       => '0912345678',
        'email'       => 'vantu@gmail.com',
        'center_name' => 'Trung Tam Tu Duong',
        'message'     => 'Toi muon tu van voi ban ve dich vu SAM',
    ];

    $contact = $this->service->submitContact($data);

    expect($contact)->toBeInstanceOf(ContactRequest::class)
        ->and($contact->full_name)->toBe('Nguyen Van Tu')
        ->and($contact->status)->toBe('pending');

    Mail::assertQueued(\App\Mail\ContactRequestSubmittedMail::class);
});
