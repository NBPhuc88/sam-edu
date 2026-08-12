<?php

namespace App\Repositories\Auth;

interface PasswordResetRepositoryInterface
{
    public function createOtp(string $email, string $accountType, string $otpHash): void;

    public function getLatestOtp(string $email, string $accountType): ?object;

    public function deleteOtp(string $email, string $accountType): void;

    public function findAccountByEmail(string $accountType, string $email): ?object;
}
