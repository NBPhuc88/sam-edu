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

    /**
     * @return \Generator<int, Teacher>
     * @param  ?int                     $centerId
     */
    public function getTeachersCursor(?int $centerId = null): \Generator
    {
        $query = Teacher::query()->orderBy('id', 'asc');

        if ($centerId !== null) {
            $query->where('center_id', $centerId);
        }

        foreach ($query->cursor() as $teacher) {
            /** @var Teacher $teacher */
            yield $teacher;
        }
    }

    public function findByCode(string $teacherCode): ?Teacher
    {
        /** @var Teacher|null $teacher */
        $teacher = Teacher::where('teacher_code', $teacherCode)->first();

        return $teacher;
    }

    /**
     * @param array<string, mixed> $data
     * @param string               $teacherCode
     */
    public function updateOrCreateByCode(string $teacherCode, array $data): Teacher
    {
        /** @var Teacher $teacher */
        $teacher = Teacher::updateOrCreate(
            ['teacher_code' => $teacherCode],
            $data
        );

        return $teacher;
    }
}
