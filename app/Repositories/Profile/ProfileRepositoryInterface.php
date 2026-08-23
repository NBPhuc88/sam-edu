<?php

namespace App\Repositories\Profile;

interface ProfileRepositoryInterface
{
    /**
     * @param string                $userType
     * @param int                   $userId
     * @param string                $email
     * @param string                $action
     * @param string                $otpHash
     * @param ?array<string, mixed> $payload
     */
    public function createVerificationOtp(
        string $userType,
        int $userId,
        string $email,
        string $action,
        string $otpHash,
        ?array $payload = null
    ): void;

    /**
     * @param  string      $userType
     * @param  int         $userId
     * @param  string      $email
     * @param  string      $action
     * @return object|null
     */
    public function getLatestVerificationOtp(
        string $userType,
        int $userId,
        string $email,
        string $action
    ): ?object;

    /**
     * @param string $userType
     * @param int    $userId
     * @param string $action
     */
    public function deleteVerificationOtp(
        string $userType,
        int $userId,
        string $action
    ): void;
}
