<?php

namespace App\Repositories\Teacher;

use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TeacherRepository implements TeacherRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Teacher
    {
        /** @var Teacher|null $teacher */
        $teacher = Teacher::where('username', $username)->orWhere('email', $username)->first();

        return $teacher;
    }

    /**
     * @param  ?int                     $centerId
     * @return \Generator<int, Teacher>
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
     * @param string               $teacherCode
     * @param array<string, mixed> $data
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

    public function paginate(?string $search = null, ?int $centerId = null, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        $offset = max(0, ($page - 1) * $perPage);
        $query  = Teacher::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('teacher_code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('specialization', 'like', "%{$search}%");
            });
        }

        if ($centerId) {
            $query->where('center_id', $centerId);
        }

        if ($offset > 0) {
            $idQuery   = (clone $query)->select('id')->latest('id')->offset($offset)->limit($perPage);
            $targetIds = $idQuery->pluck('id')->toArray();

            if (! empty($targetIds)) {
                return Teacher::with('center')
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
