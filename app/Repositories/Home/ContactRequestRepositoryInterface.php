<?php

namespace App\Repositories\Home;

use App\Models\ContactRequest;

interface ContactRequestRepositoryInterface
{
    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): ContactRequest;
}
