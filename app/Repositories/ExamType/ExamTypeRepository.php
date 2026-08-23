<?php

namespace App\Repositories\ExamType;

use App\Models\ExamType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ExamTypeRepository implements ExamTypeRepositoryInterface
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
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator {
        $query = ExamType::query()
            ->select(
                'id',
                'center_id',
                'code',
                'name',
                'description',
                'status',
                'created_at'
            )
            ->with('center:id,name,code')
            ->withCount('exams');

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('status', $status);
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

        return $query->orderBy('center_id', 'asc')
            ->orderBy('id', 'asc')
            ->deferredPaginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  array<int>|int|null       $centerIds
     * @return Collection<int, ExamType>
     */
    public function getAllActive(array|int|null $centerIds = null): Collection
    {
        $query = ExamType::query()
            ->select('id', 'center_id', 'code', 'name', 'description', 'status')
            ->where('status', 'active');

        if ($centerIds !== null) {
            $ids = is_array($centerIds) ? $centerIds : [$centerIds];
            $query->where(function ($q) use ($ids) {
                $q->whereIn('center_id', $ids)
                    ->orWhereNull('center_id');
            });
        }

        return $query->orderBy('name', 'asc')->get();
    }

    /**
     * @param  int                       $centerId
     * @return Collection<int, ExamType>
     */
    public function getByCenterOnly(int $centerId): Collection
    {
        return ExamType::query()
            ->select('id', 'center_id', 'code', 'name', 'description', 'status')
            ->where('center_id', $centerId)
            ->where('status', 'active')
            ->orderBy('name', 'asc')
            ->get();
    }

    /**
     * @param  int       $id
     * @return ?ExamType
     */
    public function findById(int $id): ?ExamType
    {
        return ExamType::with('center:id,name,code')->withCount('exams')->find($id);
    }

    /**
     * @param  array<string, mixed> $data
     * @return ExamType
     */
    public function create(array $data): ExamType
    {
        return ExamType::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return ExamType
     */
    public function update(int $id, array $data): ExamType
    {
        $examType = ExamType::findOrFail($id);
        $examType->update($data);

        return $examType;
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
            $examType = ExamType::findOrFail($id);

            // Gỡ liên kết ở các đề thi
            \App\Models\Exam::where('exam_type_id', $id)->update(['exam_type_id' => null]);

            return (bool) $examType->delete();
        });
    }

    /**
     * @param  ?int   $centerId
     * @param  string $code
     * @param  ?int   $ignoreId
     * @return bool
     */
    public function codeExists(?int $centerId, string $code, ?int $ignoreId = null): bool
    {
        $query = ExamType::where('code', $code);

        if ($centerId !== null) {
            $query->where('center_id', $centerId);
        } else {
            $query->whereNull('center_id');
        }

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    /**
     * @param  ?int   $centerId
     * @return string
     */
    public function generateUniqueCode(?int $centerId = null): string
    {
        $maxAttempts = 1000;

        for ($i = 1; $i <= $maxAttempts; $i++) {
            $candidateCode = sprintf('EXT%09d', $i);

            if (! $this->codeExists($centerId, $candidateCode)) {
                return $candidateCode;
            }
        }

        $highestId = ExamType::withTrashed()->max('id') ?? 0;

        return sprintf('EXT%09d', $highestId + 1);
    }
}
