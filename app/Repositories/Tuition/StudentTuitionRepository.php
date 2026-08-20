<?php

namespace App\Repositories\Tuition;

use App\Models\StudentTuition;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StudentTuitionRepository implements StudentTuitionRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?int                 $studentId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?int $studentId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator {
        $query = StudentTuition::query()
            ->select(
                'id',
                'center_id',
                'student_id',
                'class_id',
                'created_by_admin_id',
                'title',
                'total_amount',
                'paid_amount',
                'remaining_amount',
                'status',
                'due_date',
                'created_at'
            )
            ->with([
                'student:id,full_name,student_code,phone',
                'schoolClass:id,name,code',
                'center:id,name,code'
            ])
            ->withCount('payments');

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if ($classId !== null) {
            $query->where('class_id', $classId);
        }

        if ($studentId !== null) {
            $query->where('student_id', $studentId);
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                    ->orWhereHas('student', function ($sq) use ($term) {
                        $sq->where('full_name', 'like', "%{$term}%")
                            ->orWhere('student_code', 'like', "%{$term}%")
                            ->orWhere('phone', 'like', "%{$term}%");
                    })
                    ->orWhereHas('schoolClass', function ($cq) use ($term) {
                        $cq->where('name', 'like', "%{$term}%")
                            ->orWhere('code', 'like', "%{$term}%");
                    })
                    ->orWhereHas('center', function ($ctq) use ($term) {
                        $ctq->where('name', 'like', "%{$term}%")
                            ->orWhere('code', 'like', "%{$term}%");
                    });
            });
        }

        return $query->latest('id')->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  int                 $id
     * @param  array<int>|null     $allowedCenterIds
     * @return StudentTuition|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?StudentTuition
    {
        $query = StudentTuition::query()
            ->select(
                'id',
                'center_id',
                'student_id',
                'class_id',
                'created_by_admin_id',
                'title',
                'description',
                'total_amount',
                'paid_amount',
                'remaining_amount',
                'status',
                'due_date',
                'created_at'
            )
            ->with([
                'student:id,full_name,student_code,email,phone',
                'schoolClass:id,name,code',
                'center:id,name,code',
                'creator:id,username,full_name',
                'payments' => function ($q) {
                    $q->select(
                        'id',
                        'student_tuition_id',
                        'received_by_admin_id',
                        'amount',
                        'payment_date',
                        'payment_method',
                        'transaction_code',
                        'note',
                        'created_at'
                    )
                    ->with('receiver:id,username,full_name')
                    ->latest('payment_date');
                },
            ]);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->find($id);
    }

    /**
     * @param  array<string, mixed> $data
     * @return StudentTuition
     */
    public function create(array $data): StudentTuition
    {
        return StudentTuition::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return StudentTuition
     */
    public function update(int $id, array $data): StudentTuition
    {
        $tuition = StudentTuition::findOrFail($id);
        $tuition->update($data);

        return $tuition;
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $tuition = StudentTuition::findOrFail($id);

        return (bool) $tuition->delete();
    }

    /**
     * @param  array<int>|null      $allowedCenterIds
     * @return array<string, mixed>
     */
    public function getSummaryStats(?array $allowedCenterIds = null): array
    {
        $query = StudentTuition::query();

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        $totalAmount     = (float) (clone $query)->sum('total_amount');
        $paidAmount      = (float) (clone $query)->sum('paid_amount');
        $remainingAmount = (float) (clone $query)->sum('remaining_amount');
        $totalTuitions   = (int) (clone $query)->count();
        $completedCount  = (int) (clone $query)->where('status', 'completed')->count();
        $partialCount    = (int) (clone $query)->where('status', 'partial')->count();
        $pendingCount    = (int) (clone $query)->where('status', 'pending')->count();

        return [
            'total_amount'     => $totalAmount,
            'paid_amount'      => $paidAmount,
            'remaining_amount' => $remainingAmount,
            'total_tuitions'   => $totalTuitions,
            'completed_count'  => $completedCount,
            'partial_count'    => $partialCount,
            'pending_count'    => $pendingCount,
        ];
    }
}
