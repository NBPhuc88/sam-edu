<?php

namespace App\Repositories\Admin;

use App\Models\Admin;

class AdminRepository implements AdminRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Admin::where('username', $username)->orWhere('email', $username)->first();

        return $admin;
    }
}
