<?php

namespace App\Repositories\Subject;

use App\Enums\Constant;
use App\Models\ClassSubject;
use App\Models\Subject;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SubjectRepository implements SubjectRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
    ): LengthAwarePaginator {
        $query = Subject::query()
            ->select(
                'id',
                'center_id',
                'code',
                'name',
                'description',
                'total_sessions',
                'duration_minutes',
                'tuition_fee',
                'status',
                'created_at'
            )
            ->with('center:id,name,code');

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if ($status !== null && $status !== '' && $status !== '') {
            $query->where('status', is_numeric($status) ? (int) $status : match ($status) {
                'active'   => Constant::SUBJECT_STATUS_ACTIVE,
                'inactive' => Constant::SUBJECT_STATUS_INACTIVE,
                default    => $status,
            });
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('code', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhereHas('center', function ($cq) use ($term) {
                        $cq->where('name', 'like', "%{$term}%")
                            ->orWhere('code', 'like', "%{$term}%");
                    });
            });
        }

        return $query->latest('id')->deferredPaginate($perPage, ['*'], 'page', $page)->withQueryString();
    }

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Subject|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Subject
    {
        $query = Subject::query()
            ->select(
                'id',
                'center_id',
                'code',
                'name',
                'description',
                'total_sessions',
                'duration_minutes',
                'tuition_fee',
                'status',
                'created_at'
            )
            ->with('center:id,name,code');

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->find($id);
    }

    /**
     * @param  array<string, mixed> $data
     * @return Subject
     */
    public function create(array $data): Subject
    {
        return Subject::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Subject
     */
    public function update(int $id, array $data): Subject
    {
        $subject = Subject::findOrFail($id);
        $subject->update($data);

        return $subject;
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $subject = Subject::findOrFail($id);

        return (bool) $subject->delete();
    }

    public function codeExists(string $code): bool
    {
        return Subject::where('code', $code)->exists();
    }

    public function nextId(): int
    {
        return (int) (Subject::max('id') ?? 0) + 1;
    }

    /**
     * @param  ?array<int, int>                                       $centerIds
     * @return \Illuminate\Database\Eloquent\Collection<int, Subject>
     */
    public function getByCenterIds(?array $centerIds = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Subject::select(
            'id',
            'center_id',
            'code',
            'name',
            'description',
            'total_sessions',
            'duration_minutes',
            'tuition_fee',
            'status'
        )->where('status', Constant::SUBJECT_STATUS_ACTIVE);

        if ($centerIds !== null) {
            $query->whereIn('center_id', $centerIds);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Lấy danh sách môn học mà giáo viên được phân công giảng dạy tại trung tâm.
     * @param  int                      $teacherId
     * @param  int                      $centerId
     * @return Collection<int, Subject>
     */
    public function getTaughtSubjectsByTeacher(int $teacherId, int $centerId): Collection
    {
        $taughtSubjectIds = ClassSubject::where('teacher_id', $teacherId)
            ->pluck('subject_id')
            ->unique()
            ->toArray();

        $query = Subject::select(
            'id',
            'center_id',
            'code',
            'name',
            'description',
            'total_sessions',
            'duration_minutes',
            'tuition_fee',
            'status'
        )
            ->where('center_id', $centerId)
            ->where('status', Constant::SUBJECT_STATUS_ACTIVE);

        if (! empty($taughtSubjectIds)) {
            $query->whereIn('id', $taughtSubjectIds);
        }

        return $query->orderBy('name')->get();
    }
}
