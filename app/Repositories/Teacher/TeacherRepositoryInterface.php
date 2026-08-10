<?php

namespace App\Repositories\Teacher;

use App\Models\Teacher;

interface TeacherRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Teacher;
}
