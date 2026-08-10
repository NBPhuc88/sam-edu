<?php

namespace App\Repositories\Class;

use App\Models\ClassStudent;
use App\Models\SchoolClass;
use App\Models\Student;

class SchoolClassRepository implements SchoolClassRepositoryInterface
{
    public function findById(int $classId): ?SchoolClass
    {
        /** @var SchoolClass|null $class */
        $class = SchoolClass::find($classId);

        return $class;
    }

    /**
     * @return \Generator<int, Student>
     */
    public function getClassStudentsCursor(int $classId): \Generator
    {
        $classStudents = ClassStudent::with('student')
            ->where('class_id', $classId)
            ->where('status', 'active')
            ->orderBy('id', 'asc');

        foreach ($classStudents->cursor() as $classStudent) {
            /** @var ClassStudent $classStudent */
            if ($classStudent->student) {
                yield $classStudent->student;
            }
        }
    }

    public function attachStudent(int $classId, int $studentId, ?string $note = null): bool
    {
        ClassStudent::updateOrCreate(
            [
                'class_id' => $classId,
                'student_id' => $studentId,
            ],
            [
                'status' => 'active',
                'enrolled_at' => now(),
                'note' => $note,
            ]
        );

        return true;
    }
}
