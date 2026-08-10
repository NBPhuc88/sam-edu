<?php

namespace App\Repositories\Admin;

use App\Models\Admin;

interface AdminRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Admin;
}
