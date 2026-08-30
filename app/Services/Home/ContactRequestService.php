<?php

namespace App\Services\Home;

use App\Enums\Constant;
use App\Mail\ContactRequestSubmittedMail;
use App\Models\ContactRequest;
use App\Repositories\Home\ContactRequestRepositoryInterface;
use App\Repositories\Setting\SystemSettingRepositoryInterface;
use Illuminate\Support\Facades\Mail;

class ContactRequestService implements ContactRequestServiceInterface
{
    public function __construct(
        protected ContactRequestRepositoryInterface $contactRequestRepository,
        protected SystemSettingRepositoryInterface $systemSettingRepository
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function submitContact(array $data): ContactRequest
    {
        $contactRequest = $this->contactRequestRepository->create([
            'full_name'   => $data['full_name'],
            'phone'       => $data['phone'],
            'email'       => $data['email'] ?? null,
            'center_name' => $data['center_name'] ?? null,
            'message'     => $data['message'] ?? null,
            'status'      => Constant::CONTACT_STATUS_PENDING,
        ]);

        $this->sendAdminNotificationMail($contactRequest);

        return $contactRequest;
    }

    protected function sendAdminNotificationMail(ContactRequest $contactRequest): void
    {
        $adminEmail = $this->systemSettingRepository->getByKey(
            'contact_email',
            (string) config('mail.from.address', 'sam.edu190824@gmail.com')
        );

        if ($adminEmail) {
            try {
                Mail::to($adminEmail)->queue(new ContactRequestSubmittedMail($contactRequest));
            } catch (\Throwable $e) {
                // Ignore mail queue errors if queue driver is not reachable
            }
        }
    }
}
