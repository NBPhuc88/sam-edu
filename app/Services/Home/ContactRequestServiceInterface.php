<?php

namespace App\Services\Home;

use App\Models\ContactRequest;

interface ContactRequestServiceInterface
{
    /**
     * @param array<string, mixed> $data
     */
    public function submitContact(array $data): ContactRequest;
}
