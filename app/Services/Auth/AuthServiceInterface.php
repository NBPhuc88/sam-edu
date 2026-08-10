<?php

namespace App\Services\Auth;

interface AuthServiceInterface
{
    /**
     * Authenticate account credentials for specified role.
     *
     * @return array{success: bool, account: mixed, error: string|null}
     */
    public function authenticate(string $role, string $username, string $password): array;

    /**
     * Logout active sessions across all guards.
     */
    public function logout(): void;
}
