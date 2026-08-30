<?php

namespace App\Repositories\Tuition;

use App\Enums\Constant;
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
     * @param  ?string              $month
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?int $studentId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        ?string $month = null
    ): LengthAwarePaginator {
        $query = StudentTuition::query()
            ->select(
                'id',
                'center_id',
                'student_id',
                'class_id',
                'created_by',
                'title',
                'total_amount',
                'paid_amount',
                'remaining_amount',
                'status',
                'due_date',
                'created_at'
            )
            ->with([
                'student:id,full_name,student_code,phone,deleted_at',
                'schoolClass:id,name,code',
                'center:id,name,code',
                'creator:id,username,full_name',
                'payments' => function ($q) {
                    $q->select(
                        'id',
                        'student_tuition_id',
                        'received_by',
                        'amount',
                        'payment_date',
                        'payment_method',
                        'transaction_code',
                        'note',
                        'created_at'
                    )
                    ->with('receiver:id,username,full_name');
                },
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

        if ($status !== null && $status !== '' && $status !== '') {
            $query->where('status', is_numeric($status) ? (int) $status : match ($status) {
                'completed', 'paid' => Constant::TUITION_STATUS_PAID,
                'pending', 'unpaid' => Constant::TUITION_STATUS_PENDING,
                'partial'           => Constant::TUITION_STATUS_PARTIAL,
                'overdue'           => Constant::TUITION_STATUS_OVERDUE,
                default             => $status,
            });
        }

        if ($month !== null && $month !== '' && $month !== '') {
            $startOfMonth = \Illuminate\Support\Carbon::parse($month . '-01')->startOfMonth()->toDateTimeString();
            $endOfMonth   = \Illuminate\Support\Carbon::parse($month . '-01')->endOfMonth()->toDateTimeString();
            $query->where(function ($q) use ($startOfMonth, $endOfMonth) {
                $q->whereBetween('due_date', [$startOfMonth, $endOfMonth])
                    ->orWhereBetween('created_at', [$startOfMonth, $endOfMonth]);
            });
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

        return $query->latest('id')->deferredPaginate($perPage, ['*'], 'page', $page)->withQueryString();
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
                'created_by',
                'title',
                'note',
                'total_amount',
                'paid_amount',
                'remaining_amount',
                'status',
                'due_date',
                'created_at'
            )
            ->with([
                'student:id,full_name,student_code,email,phone,deleted_at',
                'schoolClass:id,name,code',
                'center:id,name,code',
                'creator:id,username,full_name',
                'payments' => function ($q) {
                    $q->select(
                        'id',
                        'student_tuition_id',
                        'received_by',
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
     * @param  ?int                 $selectedCenterId
     * @param  ?int                 $classId
     * @param  ?string              $month
     * @return array<string, mixed>
     */
    public function getSummaryStats(
        ?array $allowedCenterIds = null,
        ?int $selectedCenterId = null,
        ?int $classId = null,
        ?string $month = null
    ): array {
        $query = StudentTuition::query();

        if ($selectedCenterId !== null) {
            $query->where('center_id', $selectedCenterId);
        } elseif ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        if ($classId !== null) {
            $query->where('class_id', $classId);
        }

        if ($month !== null && $month !== '' && $month !== '') {
            $startOfMonth = \Illuminate\Support\Carbon::parse($month . '-01')->startOfMonth()->toDateTimeString();
            $endOfMonth   = \Illuminate\Support\Carbon::parse($month . '-01')->endOfMonth()->toDateTimeString();
            $query->where(function ($q) use ($startOfMonth, $endOfMonth) {
                $q->whereBetween('due_date', [$startOfMonth, $endOfMonth])
                    ->orWhereBetween('created_at', [$startOfMonth, $endOfMonth]);
            });
        }

        $totalAmount     = (float) (clone $query)->sum('total_amount');
        $paidAmount      = (float) (clone $query)->sum('paid_amount');
        $remainingAmount = (float) (clone $query)->sum('remaining_amount');
        $totalTuitions   = (int) (clone $query)->count();
        $completedCount  = (int) (clone $query)->where('status', Constant::TUITION_STATUS_PAID)->count();
        $partialCount    = (int) (clone $query)->where('status', Constant::TUITION_STATUS_PARTIAL)->count();
        $pendingCount    = (int) (clone $query)->where('status', Constant::TUITION_STATUS_PENDING)->count();

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

    /**
     * @param  int                  $studentId
     * @return array<string, mixed>
     */
    public function getStudentTuitionSummary(int $studentId): array
    {
        $tuitions = StudentTuition::where('student_id', $studentId)->get();

        return [
            'total_amount'     => (float) $tuitions->sum('total_amount'),
            'paid_amount'      => (float) $tuitions->sum('paid_amount'),
            'remaining_amount' => (float) $tuitions->sum('remaining_amount'),
            'total_records'    => $tuitions->count(),
            'completed_count'  => $tuitions->where('status', Constant::TUITION_STATUS_PAID)->count(),
            'partial_count'    => $tuitions->where('status', Constant::TUITION_STATUS_PARTIAL)->count(),
            'unpaid_count'     => $tuitions->whereIn('status', [Constant::TUITION_STATUS_PENDING, Constant::TUITION_STATUS_OVERDUE])->count(),
        ];
    }

    /**
     * @param  ?string                                  $search
     * @param  array<int>|int|null                      $centerIds
     * @param  ?int                                     $classId
     * @param  ?string                                  $status
     * @param  ?string                                  $month
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getTuitionsForExport(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?string $status = null,
        ?string $month = null
    ): \Illuminate\Database\Eloquent\Collection {
        $query = StudentTuition::query()
            ->with([
                'student' => function ($q) {
                    $q->select('id', 'full_name', 'student_code', 'phone', 'deleted_at')
                        ->with('classes:id,name,code');
                },
                'schoolClass:id,name,code',
                'center:id,name,code',
                'creator:id,username,full_name',
                'payments' => function ($q) {
                    $q->select(
                        'id',
                        'student_tuition_id',
                        'received_by',
                        'amount',
                        'payment_date',
                        'payment_method',
                        'transaction_code',
                        'note',
                        'created_at'
                    )
                    ->with('receiver:id,username,full_name')
                    ->orderBy('payment_date', 'asc')
                    ->orderBy('id', 'asc');
                },
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

        if ($status !== null && $status !== '' && $status !== '') {
            $query->where('status', is_numeric($status) ? (int) $status : match ($status) {
                'completed', 'paid' => Constant::TUITION_STATUS_PAID,
                'pending', 'unpaid' => Constant::TUITION_STATUS_PENDING,
                'partial'           => Constant::TUITION_STATUS_PARTIAL,
                'overdue'           => Constant::TUITION_STATUS_OVERDUE,
                default             => $status,
            });
        }

        if ($month !== null && $month !== '' && $month !== '') {
            $startOfMonth = \Illuminate\Support\Carbon::parse($month . '-01')->startOfMonth()->toDateTimeString();
            $endOfMonth   = \Illuminate\Support\Carbon::parse($month . '-01')->endOfMonth()->toDateTimeString();
            $query->where(function ($q) use ($startOfMonth, $endOfMonth) {
                $q->whereBetween('due_date', [$startOfMonth, $endOfMonth])
                    ->orWhereBetween('created_at', [$startOfMonth, $endOfMonth]);
            });
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

        return $query->latest('id')->get();
    }

    /**
     * @param  array<int>|int|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?string              $month
     * @return array<string, mixed>
     */
    public function getDetailedChartStats(
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?string $month = null
    ): array {
        $query = StudentTuition::query();

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

        if ($month !== null && $month !== '' && $month !== '') {
            $startOfMonth = \Illuminate\Support\Carbon::parse($month . '-01')->startOfMonth()->toDateTimeString();
            $endOfMonth   = \Illuminate\Support\Carbon::parse($month . '-01')->endOfMonth()->toDateTimeString();
            $query->where(function ($q) use ($startOfMonth, $endOfMonth) {
                $q->whereBetween('due_date', [$startOfMonth, $endOfMonth])
                    ->orWhereBetween('created_at', [$startOfMonth, $endOfMonth]);
            });
        }

        // 1. Status distribution for Pie Chart
        $completedCount = (int) (clone $query)->where('status', Constant::TUITION_STATUS_PAID)->count();
        $partialCount   = (int) (clone $query)->where('status', Constant::TUITION_STATUS_PARTIAL)->count();
        $pendingCount   = (int) (clone $query)->where('status', Constant::TUITION_STATUS_PENDING)->count();
        $overdueCount   = (int) (clone $query)->where('status', Constant::TUITION_STATUS_OVERDUE)->count();

        $statusPie = [
            ['name' => 'Đã hoàn thành', 'value' => $completedCount, 'status' => Constant::TUITION_STATUS_PAID, 'color' => '#10b981'],
            ['name' => 'Còn nợ (Đóng dở)', 'value' => $partialCount, 'status' => Constant::TUITION_STATUS_PARTIAL, 'color' => '#f59e0b'],
            ['name' => 'Chưa đóng', 'value' => $pendingCount, 'status' => Constant::TUITION_STATUS_PENDING, 'color' => '#6b7280'],
            ['name' => 'Quá hạn', 'value' => $overdueCount, 'status' => Constant::TUITION_STATUS_OVERDUE, 'color' => '#ef4444'],
        ];

        // Filter out items with 0 value if total records exist, or keep original
        $nonZeroPie        = array_values(array_filter($statusPie, fn ($item) => $item['value'] > 0));
        $statusPieFiltered = ! empty($nonZeroPie) ? $nonZeroPie : $statusPie;

        // 2. Monthly Trend (6 months recent)
        $monthlyTrend = [];
        $baseDate     = ($month && $month !== '') ? \Illuminate\Support\Carbon::parse($month . '-01') : now();

        for ($i = 5; $i >= 0; $i--) {
            $m          = (clone $baseDate)->subMonths($i);
            $monthKey   = $m->format('Y-m');
            $monthLabel = 'Thg ' . $m->format('m/Y');

            $mQuery = StudentTuition::query();

            if ($centerIds !== null) {
                if (is_array($centerIds)) {
                    $mQuery->whereIn('center_id', $centerIds);
                } else {
                    $mQuery->where('center_id', $centerIds);
                }
            }

            if ($classId !== null) {
                $mQuery->where('class_id', $classId);
            }

            $mStart = (clone $m)->startOfMonth()->toDateTimeString();
            $mEnd   = (clone $m)->endOfMonth()->toDateTimeString();

            $mQuery->where(function ($q) use ($mStart, $mEnd) {
                $q->whereBetween('due_date', [$mStart, $mEnd])
                    ->orWhereBetween('created_at', [$mStart, $mEnd]);
            });

            $total     = (float) (clone $mQuery)->sum('total_amount');
            $paid      = (float) (clone $mQuery)->sum('paid_amount');
            $remaining = (float) (clone $mQuery)->sum('remaining_amount');

            $monthlyTrend[] = [
                'month_key'        => $monthKey,
                'name'             => $monthLabel,
                'total_amount'     => $total,
                'paid_amount'      => $paid,
                'remaining_amount' => $remaining,
            ];
        }

        return [
            'status_pie'    => $statusPieFiltered,
            'monthly_trend' => $monthlyTrend,
        ];
    }
}
