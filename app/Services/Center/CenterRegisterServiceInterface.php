<?php

namespace App\Services\Center;

interface CenterRegisterServiceInterface
{
    /**
     * @param  array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function registerStep1(array $data): array;

    /**
     * @param  string               $appTransId
     * @return array<string, mixed>
     */
    public function checkPaymentStatus(string $appTransId): array;
}
