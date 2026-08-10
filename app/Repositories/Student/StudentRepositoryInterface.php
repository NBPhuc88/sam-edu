<?php

namespace App\Repositories\Student;

use App\Models\Student;

interface StudentRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Student;
}
