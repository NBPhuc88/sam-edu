<?php

namespace App\Repositories\Home;

use App\Models\ContactRequest;

class ContactRequestRepository implements ContactRequestRepositoryInterface
{
    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): ContactRequest
    {
        /** @var ContactRequest $contactRequest */
        $contactRequest = ContactRequest::create($data);

        return $contactRequest;
    }
}
