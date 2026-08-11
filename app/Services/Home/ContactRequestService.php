<?php

namespace App\Services\Home;

use App\Models\ContactRequest;
use App\Repositories\Home\ContactRequestRepositoryInterface;

class ContactRequestService implements ContactRequestServiceInterface
{
    public function __construct(
        protected ContactRequestRepositoryInterface $contactRequestRepository
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function submitContact(array $data): ContactRequest
    {
        return $this->contactRequestRepository->create([
            'full_name'   => $data['full_name'],
            'phone'       => $data['phone'],
            'email'       => $data['email'] ?? null,
            'center_name' => $data['center_name'] ?? null,
            'message'     => $data['message'] ?? null,
            'status'      => 'pending',
        ]);
    }
}
