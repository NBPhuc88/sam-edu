<?php

namespace App\Services\Center;

use App\Models\Center;

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

    /**
     * @param  int    $centerId
     * @param  string $username
     * @param  string $password
     * @return Center
     */
    public function completeAccount(int $centerId, string $username, string $password): Center;
}
