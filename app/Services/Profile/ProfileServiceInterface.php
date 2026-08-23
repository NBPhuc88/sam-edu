<?php

namespace App\Services\Profile;

interface ProfileServiceInterface
{
    /**
     * @param  object               $user
     * @param  string               $role
     * @return array<string, mixed>
     */
    public function getProfileData(object $user, string $role): array;

    /**
     * @param  object               $user
     * @param  string               $role
     * @return array<string, mixed>
     */
    public function sendPasswordChangeOtp(object $user, string $role): array;

    /**
     * @param  object               $user
     * @param  string               $role
     * @param  string               $currentPassword
     * @param  string               $newPassword
     * @param  string               $otp
     * @return array<string, mixed>
     */
    public function updatePassword(
        object $user,
        string $role,
        string $currentPassword,
        string $newPassword,
        string $otp
    ): array;

    /**
     * @param  object               $user
     * @param  string               $role
     * @param  string               $currentPassword
     * @return array<string, mixed>
     */
    public function sendChangeEmailOldOtp(object $user, string $role, string $currentPassword): array;

    /**
     * @param  object               $user
     * @param  string               $role
     * @param  string               $otp
     * @return array<string, mixed>
     */
    public function verifyChangeEmailOldOtp(object $user, string $role, string $otp): array;

    /**
     * @param  object               $user
     * @param  string               $role
     * @param  string               $newEmail
     * @return array<string, mixed>
     */
    public function sendChangeEmailNewOtp(object $user, string $role, string $newEmail): array;

    /**
     * @param  object               $user
     * @param  string               $role
     * @param  string               $newEmail
     * @param  string               $otp
     * @return array<string, mixed>
     */
    public function updateEmail(
        object $user,
        string $role,
        string $newEmail,
        string $otp
    ): array;
}
