<?php

namespace App\Repositories\Student;

use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StudentRepository implements StudentRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Student
    {
        /** @var Student|null $student */
        $student = Student::where('username', $username)->orWhere('email', $username)->first();

        return $student;
    }

    /**
     * @param  ?int                     $centerId
     * @return \Generator<int, Student>
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
     * @param string               $studentCode
     * @param array<string, mixed> $data
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

    public function paginate(?string $search = null, ?int $centerId = null, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        $offset = max(0, ($page - 1) * $perPage);
        $query  = Student::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('student_code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($centerId) {
            $query->where('center_id', $centerId);
        }

        if ($offset > 0) {
            $idQuery   = (clone $query)->select('id')->latest('id')->offset($offset)->limit($perPage);
            $targetIds = $idQuery->pluck('id')->toArray();

            if (! empty($targetIds)) {
                return Student::with('center')
                    ->whereIn('id', $targetIds)
                    ->latest('id')
                    ->paginate($perPage)
                    ->withQueryString();
            }
        }

        return $query->with('center')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
