<?php

namespace App\Repositories\Teacher;

use App\Models\Teacher;

class TeacherRepository implements TeacherRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Teacher
    {
        /** @var Teacher|null $teacher */
        $teacher = Teacher::where('username', $username)->orWhere('email', $username)->first();

        return $teacher;
    }
}
