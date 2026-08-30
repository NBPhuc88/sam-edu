<?php

namespace App\Services\Statistic;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassStudent;
use App\Models\SchoolClass;
use App\Models\StudentTuition;
use App\Models\Teacher;
use App\Models\TuitionPayment;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StatisticService implements StatisticServiceInterface
{
    public function __construct(
        protected CenterRepositoryInterface $centerRepository,
        protected SchoolClassRepositoryInterface $schoolClassRepository
    ) {
    }

    /**
     * @param  ?int                 $selectedCenterId
     * @param  ?string              $month
     * @param  ?int                 $subjectId
     * @param  int                  $perPage
     * @param  int                  $page
     * @return array<string, mixed>
     */
    public function getStatisticData(
        ?int $selectedCenterId = null,
        ?string $month = null,
        ?int $subjectId = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
    ): array {
        $user = null;
        $role = 'admin';

        if (Auth::guard('admin')->check()) {
            $role = 'admin';
            /** @var Admin $user */
            $user = Auth::guard('admin')->user();
        } elseif (Auth::guard('teacher')->check()) {
            $role = 'teacher';
            /** @var Teacher $user */
            $user = Auth::guard('teacher')->user();
        } elseif (Auth::guard('student')->check()) {
            return [
                'forbidden' => true,
                'message'   => 'Bạn không có quyền truy cập vào trang thống kê báo cáo quản trị.',
            ];
        }

        $allowedCenters = collect();
        $isSuperAdmin   = false;

        if ($role === 'admin' && $user instanceof Admin) {
            $isSuperAdmin = $user->isSuperAdmin();

            if ($isSuperAdmin) {
                $allowedCenters = $this->centerRepository->getCenterListForDropdown();
            } else {
                $allowedCenters = $user->centers()->select('centers.id', 'centers.code', 'centers.name')->get();
            }
        } elseif ($user instanceof Teacher) {
            $allowedCenters = $this->centerRepository->getByIds([$user->center_id], ['id', 'code', 'name']);
        }

        $allowedCenterIds = $allowedCenters->pluck('id')->map(fn ($id) => (int) $id)->toArray();

        // Default or validate selected center
        if ($isSuperAdmin) {
            if ($selectedCenterId && in_array($selectedCenterId, $allowedCenterIds, true)) {
                $activeCenterId = $selectedCenterId;
            } else {
                $activeCenterId = ! empty($allowedCenterIds) ? $allowedCenterIds[0] : null;
            }
        } else {
            $activeCenterId = ! empty($allowedCenterIds) ? $allowedCenterIds[0] : null;
        }

        // Validate or fallback month
        $selectedMonth = $month;

        if (! $selectedMonth || ! preg_match('/^\d{4}-\d{2}$/', $selectedMonth)) {
            $selectedMonth = Carbon::now()->format('Y-m');
        }

        $monthCarbon    = Carbon::createFromFormat('Y-m', $selectedMonth);
        $startOfMonth   = $monthCarbon->copy()->startOfMonth();
        $endOfMonth     = $monthCarbon->copy()->endOfMonth();
        $startOf3Months = $monthCarbon->copy()->subMonths(2)->startOfMonth();

        $centerDetail = $this->getCenterDetail(
            $activeCenterId,
            $selectedMonth,
            $startOfMonth,
            $endOfMonth,
            $startOf3Months,
            $subjectId
        );

        $teacherClassIds = null;

        if ($user instanceof Teacher) {
            $teacherClassIds = $user->classSubjects()->pluck('class_id')->unique()->toArray();
        }

        $activeCenterIds = $activeCenterId ? [$activeCenterId] : [];

        $paginatedClasses = $this->schoolClassRepository->paginateClassesWithStudentCount(
            $activeCenterIds,
            $teacherClassIds,
            $perPage,
            $page
        );

        $classStats = $paginatedClasses->through(function (SchoolClass $schoolClass) {
            $studentCount  = (int) $schoolClass->students_count;
            $maxCapacity   = (int) ($schoolClass->max_students ?: 30);
            $occupancyRate = min(100, (int) round(($studentCount / $maxCapacity) * 100));

            return [
                'id'             => $schoolClass->id,
                'code'           => $schoolClass->code,
                'name'           => $schoolClass->name,
                'student_count'  => $studentCount,
                'max_capacity'   => $maxCapacity,
                'occupancy_rate' => $occupancyRate,
                'status'         => $schoolClass->status,
            ];
        });

        return [
            'forbidden'      => false,
            'role'           => $role,
            'isSuperAdmin'   => $isSuperAdmin,
            'allowedCenters' => $allowedCenters->map(fn ($c) => [
                'id'   => (int) $c->id,
                'code' => $c->code,
                'name' => $c->name,
            ])->values()->toArray(),
            'selectedCenterId'  => $activeCenterId,
            'selectedMonth'     => $selectedMonth,
            'selectedSubjectId' => $centerDetail['selectedSubjectId'] ?? null,
            'centerDetail'      => $centerDetail,
            'classStats'        => $classStats,
        ];
    }

    /**
     * @param  ?int                 $centerId
     * @param  string               $selectedMonth
     * @param  Carbon               $startOfMonth
     * @param  Carbon               $endOfMonth
     * @param  Carbon               $startOf3Months
     * @param  ?int                 $subjectId
     * @return array<string, mixed>
     */
    protected function getCenterDetail(
        ?int $centerId,
        string $selectedMonth,
        Carbon $startOfMonth,
        Carbon $endOfMonth,
        Carbon $startOf3Months,
        ?int $subjectId = null
    ): array {
        if (! $centerId) {
            return [
                'centerId'               => null,
                'centerName'             => 'N/A',
                'centerCode'             => 'N/A',
                'monthlyNewStudents'     => 0,
                'monthlyRevenue'         => 0.0,
                'monthlyTuitionCreated'  => 0.0,
                'topSubjectsByMonth'     => [],
                'topSubjectsLast3Months' => [],
                'subjectTrend'           => [],
                'centerSubjects'         => [],
                'selectedSubjectId'      => null,
            ];
        }

        $center = Center::find($centerId);

        // 1. KPI: Học sinh mới trong tháng
        $monthlyNewStudents = (int) ClassStudent::whereHas('schoolClass', function ($q) use ($centerId) {
            $q->where('center_id', $centerId);
        })
            ->whereBetween('enrolled_at', [$startOfMonth, $endOfMonth])
            ->distinct('student_id')
            ->count('student_id');

        // 2. KPI: Tiền thu được trong tháng (tất cả học sinh có đợt nộp trong tháng)
        $monthlyRevenue = (float) (TuitionPayment::whereHas('studentTuition', function ($q) use ($centerId) {
            $q->where('center_id', $centerId);
        })
            ->whereBetween('payment_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->sum('amount') ?? 0);

        // 3. KPI: Tổng số tiền học phí được tạo mới trong tháng
        $monthlyTuitionCreated = (float) (StudentTuition::where('center_id', $centerId)
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('total_amount') ?? 0);

        // 4. Chart A: Top môn học đăng ký trong tháng (Số lớp × Số học sinh = Số lượt đăng ký môn)
        $topSubjectsByMonth = DB::table('class_students')
            ->join('classes', 'classes.id', '=', 'class_students.class_id')
            ->join('class_subjects', 'class_subjects.class_id', '=', 'classes.id')
            ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
            ->where('classes.center_id', $centerId)
            ->whereNull('classes.deleted_at')
            ->whereNull('subjects.deleted_at')
            ->whereBetween('class_students.enrolled_at', [$startOfMonth, $endOfMonth])
            ->groupBy('subjects.id', 'subjects.name', 'subjects.code')
            ->select([
                'subjects.id as subject_id',
                'subjects.name',
                'subjects.code',
                DB::raw('COUNT(class_students.id) as count'),
            ])
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($item) => [
                'subject_id' => (int) $item->subject_id,
                'name'       => $item->name,
                'code'       => $item->code,
                'count'      => (int) $item->count,
            ])
            ->toArray();

        // 5. Chart B: Top môn học đăng ký trong 3 tháng gần nhất
        $topSubjectsLast3Months = DB::table('class_students')
            ->join('classes', 'classes.id', '=', 'class_students.class_id')
            ->join('class_subjects', 'class_subjects.class_id', '=', 'classes.id')
            ->join('subjects', 'subjects.id', '=', 'class_subjects.subject_id')
            ->where('classes.center_id', $centerId)
            ->whereNull('classes.deleted_at')
            ->whereNull('subjects.deleted_at')
            ->whereBetween('class_students.enrolled_at', [$startOf3Months, $endOfMonth])
            ->groupBy('subjects.id', 'subjects.name', 'subjects.code')
            ->select([
                'subjects.id as subject_id',
                'subjects.name',
                'subjects.code',
                DB::raw('COUNT(class_students.id) as count'),
            ])
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($item) => [
                'subject_id' => (int) $item->subject_id,
                'name'       => $item->name,
                'code'       => $item->code,
                'count'      => (int) $item->count,
            ])
            ->toArray();

        // 6. Center Subjects list for filtering
        $centerSubjects = DB::table('subjects')
            ->where('center_id', $centerId)
            ->whereNull('deleted_at')
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get()
            ->map(fn ($item) => [
                'id'   => (int) $item->id,
                'name' => $item->name,
                'code' => $item->code,
            ])
            ->toArray();

        // Determine active selectedSubjectId
        $activeSubjectId = null;
        $subjectIds      = array_column($centerSubjects, 'id');

        if ($subjectId && in_array($subjectId, $subjectIds, true)) {
            $activeSubjectId = $subjectId;
        } elseif (! empty($centerSubjects)) {
            $activeSubjectId = $centerSubjects[0]['id'];
        }

        // 7. Line chart: 6 months registration trend for selected subject
        $subjectTrend = [];

        if ($activeSubjectId) {
            for ($i = 5; $i >= 0; $i--) {
                $curCarbon = Carbon::createFromFormat('Y-m', $selectedMonth)->subMonths($i);
                $curStart  = $curCarbon->copy()->startOfMonth();
                $curEnd    = $curCarbon->copy()->endOfMonth();
                $mKey      = $curCarbon->format('Y-m');
                $mLabel    = 'T' . $curCarbon->format('m/Y');

                $enrollCount = (int) DB::table('class_students')
                    ->join('classes', 'classes.id', '=', 'class_students.class_id')
                    ->join('class_subjects', 'class_subjects.class_id', '=', 'classes.id')
                    ->where('classes.center_id', $centerId)
                    ->where('class_subjects.subject_id', $activeSubjectId)
                    ->whereNull('classes.deleted_at')
                    ->whereBetween('class_students.enrolled_at', [$curStart, $curEnd])
                    ->count();

                $subjectTrend[] = [
                    'month' => $mKey,
                    'label' => $mLabel,
                    'count' => $enrollCount,
                ];
            }
        }

        return [
            'centerId'               => (int) $centerId,
            'centerName'             => $center->name ?? 'N/A',
            'centerCode'             => $center->code ?? 'N/A',
            'monthlyNewStudents'     => $monthlyNewStudents,
            'monthlyRevenue'         => $monthlyRevenue,
            'monthlyTuitionCreated'  => $monthlyTuitionCreated,
            'topSubjectsByMonth'     => $topSubjectsByMonth,
            'topSubjectsLast3Months' => $topSubjectsLast3Months,
            'subjectTrend'           => $subjectTrend,
            'centerSubjects'         => $centerSubjects,
            'selectedSubjectId'      => $activeSubjectId,
        ];
    }
}
