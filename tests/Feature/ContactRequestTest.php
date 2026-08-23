<?php

use App\Mail\ContactRequestSubmittedMail;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Mail;

test('submitting contact form creates request and queues notification mail to configured admin email', function () {
    Mail::fake();

    SystemSetting::updateOrCreate(
        ['key' => 'contact_email'],
        ['value' => 'sam.edu190824@gmail.com', 'group' => 'contact']
    );

    $payload = [
        'full_name'   => 'Nguyễn Văn A',
        'phone'       => '0912345678',
        'email'       => 'nguyenvana@gmail.com',
        'center_name' => 'Trung Tâm Tiếng Anh ABC',
        'message'     => 'Tôi muốn tìm hiểu thêm về gói dịch vụ đa trung tâm.',
    ];

    $response = $this->post(route('contact.submit'), $payload);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('contact_requests', [
        'full_name'   => 'Nguyễn Văn A',
        'phone'       => '0912345678',
        'email'       => 'nguyenvana@gmail.com',
        'center_name' => 'Trung Tâm Tiếng Anh ABC',
    ]);

    Mail::assertQueued(ContactRequestSubmittedMail::class, function (ContactRequestSubmittedMail $mail) {
        return $mail->hasTo('sam.edu190824@gmail.com')
            && $mail->contactRequest->full_name === 'Nguyễn Văn A';
    });
});
