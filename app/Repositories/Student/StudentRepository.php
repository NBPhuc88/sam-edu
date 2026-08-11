<?php

namespace App\Repositories\Student;

use App\Models\Student;

class StudentRepository implements StudentRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Student
    {
        /** @var Student|null $student */
        $student = Student::where('username', $username)->orWhere('email', $username)->first();

        return $student;
    }

    /**
     * @return \Generator<int, Student>
     * @param  ?int                     $centerId
     */
    public function getStudentsCursor(?int $centerId = null): \Generator
    {
        $query = Student::query()->orderBy('id', 'asc');

        if ($centerId !== null) {
            $query->where('center_id', $centerId);
        }

        foreach ($query->cursor() as $student) {
            /** @var Student $student */
            yield $student;
        }
    }

    public function findByCode(string $studentCode): ?Student
    {
        /** @var Student|null $student */
        $student = Student::where('student_code', $studentCode)->first();

        return $student;
    }

    /**
     * @param array<string, mixed> $data
     * @param string               $studentCode
     */
    public function updateOrCreateByCode(string $studentCode, array $data): Student
    {
        /** @var Student $student */
        $student = Student::updateOrCreate(
            ['student_code' => $studentCode],
            $data
        );

        return $student;
    }
}
