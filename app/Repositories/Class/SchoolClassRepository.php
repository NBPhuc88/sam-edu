<?php

namespace App\Repositories\Class;

use App\Models\ClassStudent;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SchoolClassRepository implements SchoolClassRepositoryInterface
{
    public function findById(int $classId): ?SchoolClass
    {
        /** @var SchoolClass|null $class */
        $class = SchoolClass::find($classId);

        return $class;
    }

    /**
     * @param  int                      $classId
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
                'class_id'   => $classId,
                'student_id' => $studentId,
            ],
            [
                'status'      => 'active',
                'enrolled_at' => now(),
                'note'        => $note,
            ]
        );

        return true;
    }

    public function getPaginatedClassStudents(SchoolClass $schoolClass, ?string $search = null, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        $offset = max(0, ($page - 1) * $perPage);
        $query  = $schoolClass->students();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('student_code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($offset > 0) {
            $idQuery   = (clone $query)->select('students.id')->latest('students.id')->offset($offset)->limit($perPage);
            $targetIds = $idQuery->pluck('students.id')->toArray();

            if (! empty($targetIds)) {
                return $schoolClass->students()
                    ->withPivot('enrolled_at', 'status', 'note')
                    ->whereIn('students.id', $targetIds)
                    ->latest('students.id')
                    ->paginate($perPage)
                    ->withQueryString();
            }
        }

        return $query->withPivot('enrolled_at', 'status', 'note')
            ->latest('students.id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
