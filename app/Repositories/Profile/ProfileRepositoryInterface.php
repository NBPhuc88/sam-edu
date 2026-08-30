<?php

namespace App\Repositories\Profile;

interface ProfileRepositoryInterface
{
    /**
     * @param string                $userType
     * @param int                   $userId
     * @param string                $email
     * @param int|string            $action
     * @param string                $otpHash
     * @param ?array<string, mixed> $payload
     */
    public function createVerificationOtp(
        string $userType,
        int $userId,
        string $email,
        int|string $action,
        string $otpHash,
        ?array $payload = null
    ): void;

    /**
     * @param  string      $userType
     * @param  int         $userId
     * @param  string      $email
     * @param  int|string  $action
     * @return object|null
     */
    public function getLatestVerificationOtp(
        string $userType,
        int $userId,
        string $email,
        int|string $action
    ): ?object;

    /**
     * @param string     $userType
     * @param int        $userId
     * @param int|string $action
     */
    public function deleteVerificationOtp(
        string $userType,
        int $userId,
        int|string $action
    ): void;
}
