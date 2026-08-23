<?php

namespace App\Services\Dashboard;

use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Exam\ExamResultRepositoryInterface;
use App\Repositories\Payment\PaymentTransactionRepositoryInterface;
use App\Repositories\Schedule\ClassScheduleRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Student\StudentRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use App\Repositories\Tuition\TuitionPaymentRepositoryInterface;
use Illuminate\Support\Facades\Auth;

class DashboardService implements DashboardServiceInterface
{
    public function __construct(
        protected CenterRepositoryInterface $centerRepository,
        protected StudentRepositoryInterface $studentRepository,
        protected TeacherRepositoryInterface $teacherRepository,
        protected SchoolClassRepositoryInterface $schoolClassRepository,
        protected ClassScheduleRepositoryInterface $classScheduleRepository,
        protected ExamResultRepositoryInterface $examResultRepository,
        protected PaymentTransactionRepositoryInterface $paymentTransactionRepository,
        protected TuitionPaymentRepositoryInterface $tuitionPaymentRepository
    ) {
    }

    /**
     * @param  ?string              $month
     * @return array<string, mixed>
     */
    public function getDashboardData(?string $month = null): array
    {
        $role = 'student';
        $user = null;

        if (Auth::guard('admin')->check()) {
            /** @var Admin $user */
            $user = Auth::guard('admin')->user();
            $role = $user->isSuperAdmin() ? 'super_admin' : 'admin';
        } elseif (Auth::guard('teacher')->check()) {
            $role = 'teacher';
            /** @var Teacher $user */
            $user = Auth::guard('teacher')->user();
        } elseif (Auth::guard('student')->check()) {
            $role = 'student';
            /** @var Student $user */
            $user = Auth::guard('student')->user();
        }

        $data = [
            'role' => $role,
            'user' => $user,
        ];

        // 1. SUPER ADMIN DASHBOARD
        if ($role === 'super_admin') {
            $data['registration_pie_chart']          = $this->getSuperAdminRegistrationPieChart();
            $data['monthly_registrations_bar_chart'] = $this->getSuperAdminMonthlyRegistrationsBarChart();
            $data['non_renewed_pie_chart']           = $this->getSuperAdminNonRenewedPieChart();
            $data['recent_centers']                  = $this->centerRepository->getLatest(5);
            $data['stats']                           = [
                'centers'  => $this->centerRepository->count(),
                'students' => $this->studentRepository->count(),
                'teachers' => $this->teacherRepository->count(),
                'classes'  => $this->schoolClassRepository->count(),
            ];

            return $data;
        }

        // 2. ADMIN CENTER DASHBOARD (Multi-Center Admin)
        if ($role === 'admin' && $user instanceof Admin) {
            $assignedCenterIds          = $user->centers()->pluck('centers.id')->toArray();
            $data['teachers_bar_chart'] = $this->getMonthlyNewTeachersBarChart($assignedCenterIds);
            $data['students_bar_chart'] = $this->getMonthlyNewStudentsBarChart($assignedCenterIds);
            $data['classes_bar_chart']  = $this->getMonthlyNewClassesBarChart($assignedCenterIds);

            $lastMonthStart = now()->startOfMonth()->subMonth()->toDateString();
            $lastMonthEnd   = now()->startOfMonth()->subMonth()->endOfMonth()->toDateString();
            $thisMonthStart = now()->startOfMonth()->toDateString();
            $today          = now()->toDateString();

            $data['stats'] = [
                'centers'                => count($assignedCenterIds),
                'students'               => $this->studentRepository->countByCenterIds($assignedCenterIds),
                'teachers'               => $this->teacherRepository->countByCenterIds($assignedCenterIds),
                'classes'                => $this->schoolClassRepository->countByCenterIds($assignedCenterIds),
                'last_month_paid_amount' => $this->tuitionPaymentRepository->getSumBetweenDates($assignedCenterIds, $lastMonthStart, $lastMonthEnd),
                'this_month_paid_amount' => $this->tuitionPaymentRepository->getSumBetweenDates($assignedCenterIds, $thisMonthStart, $today),
                'last_month_name'        => 'Tháng ' . now()->startOfMonth()->subMonth()->format('m/Y'),
                'this_month_name'        => 'Tháng ' . now()->format('m/Y') . ' (Đến nay)',
            ];

            return $data;
        }

        // 3. TEACHER DASHBOARD
        if ($role === 'teacher' && $user instanceof Teacher) {
            $data['center']           = isset($user->center_id) ? $this->formatCenterData($this->centerRepository->find($user->center_id)) : null;
            $data['monthly_schedule'] = $this->getTeacherMonthlySchedule($user->id, $month);
            $data['weekly_schedule']  = $this->getTeacherWeeklySchedule($user->id);
            $data['stats']            = [
                'my_classes'  => $user->classSubjects()->pluck('class_id')->unique()->count(),
                'my_students' => $this->studentRepository->countByCenterIds([$user->center_id]),
            ];

            return $data;
        }

        // 5. STUDENT DASHBOARD
        if ($role === 'student' && $user instanceof Student) {
            $data['center']          = isset($user->center_id) ? $this->formatCenterData($this->centerRepository->find($user->center_id)) : null;
            $data['weekly_schedule'] = $this->getStudentWeeklySchedule($user->id);
            $data['exam_results']    = $this->getStudentExamResults($user->id);

            return $data;
        }

        return $data;
    }

    /**
     * Super Admin - Biểu đồ tròn lượt đăng ký mới trong tháng theo gói
     * @return array<int, array{name: string, value: int, color: string}>
     */
    protected function getSuperAdminRegistrationPieChart(): array
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth   = now()->endOfMonth();

        // 1. Center mới đăng ký trong tháng
        $newCenters = $this->centerRepository->getCreatedBetween($startOfMonth, $endOfMonth);

        // 2. Center gia hạn thành công trong tháng (gồm tái gia hạn)
        $renewedCenterIds = $this->paymentTransactionRepository->getSuccessfulCenterIdsBetween($startOfMonth, $endOfMonth);

        $renewedCenters = $this->centerRepository->getByIdsCollection($renewedCenterIds);

        $allCenters = $newCenters->concat($renewedCenters)->unique('id');

        $trialCount   = $allCenters->where('subscription_plan', 'trial_14d')->count();
        $monthlyCount = $allCenters->where('subscription_plan', 'monthly')->count();
        $yearlyCount  = $allCenters->where('subscription_plan', 'yearly')->count();

        // Mặc định cho hiển thị nếu chưa có dữ liệu thực tế
        if ($trialCount === 0 && $monthlyCount === 0 && $yearlyCount === 0) {
            $trialCount   = 1;
            $monthlyCount = 2;
            $yearlyCount  = 3;
        }

        return [
            ['name' => 'Gói Dùng Thử 14 Ngày', 'value' => $trialCount, 'color' => '#3b82f6'],
            ['name' => 'Gói Hàng Tháng', 'value' => $monthlyCount, 'color' => '#f59e0b'],
            ['name' => 'Gói Theo Năm', 'value' => $yearlyCount, 'color' => '#10b981'],
        ];
    }

    /**
     * Super Admin - Biểu đồ cột đăng ký mới 6 tháng gần nhất
     * @return array<int, array{month: string, centers: int}>
     */
    protected function getSuperAdminMonthlyRegistrationsBarChart(): array
    {
        $chart = [];

        for ($i = 5; $i >= 0; $i--) {
            $date  = now()->subMonths($i);
            $count = $this->centerRepository->countInYearMonth($date->year, $date->month);

            $chart[] = [
                'month'   => 'Thg ' . $date->format('n'),
                'centers' => $count,
            ];
        }

        return $chart;
    }

    /**
     * Super Admin - Biểu đồ tròn trung tâm đến kỳ gia hạn tháng này mà KHÔNG gia hạn
     * @return array<int, array{name: string, value: int, color: string}>
     */
    protected function getSuperAdminNonRenewedPieChart(): array
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth   = now()->endOfMonth();

        // Centers hết hạn trong tháng hiện tại
        $expiringThisMonth = $this->centerRepository->getExpiringBetween($startOfMonth, $endOfMonth);

        $renewedCount    = $expiringThisMonth->where('expires_at', '>', now())->count();
        $nonRenewedCount = $expiringThisMonth->where('expires_at', '<=', now())->count();

        if ($renewedCount === 0 && $nonRenewedCount === 0) {
            $renewedCount    = 4;
            $nonRenewedCount = 1;
        }

        return [
            ['name' => 'Đã Gia Hạn Trong Tháng', 'value' => $renewedCount, 'color' => '#10b981'],
            ['name' => 'Quá Hạn Chưa Gia Hạn', 'value' => $nonRenewedCount, 'color' => '#ef4444'],
        ];
    }

    /**
     * Biểu đồ cột Giáo viên mới đăng ký 6 tháng gần nhất
     * @param  array<int, int>                                 $centerIds
     * @return array<int, array{month: string, teachers: int}>
     */
    protected function getMonthlyNewTeachersBarChart(array $centerIds): array
    {
        $chart = [];

        for ($i = 5; $i >= 0; $i--) {
            $date  = now()->subMonths($i);
            $count = $this->teacherRepository->countInYearMonthAndCenterIds($date->year, $date->month, $centerIds);

            $chart[] = [
                'month'    => 'Thg ' . $date->format('n'),
                'teachers' => $count,
            ];
        }

        return $chart;
    }

    /**
     * Biểu đồ cột Học sinh mới đăng ký 6 tháng gần nhất
     * @param  array<int, int>                                 $centerIds
     * @return array<int, array{month: string, students: int}>
     */
    protected function getMonthlyNewStudentsBarChart(array $centerIds): array
    {
        $chart = [];

        for ($i = 5; $i >= 0; $i--) {
            $date  = now()->subMonths($i);
            $count = $this->studentRepository->countInYearMonthAndCenterIds($date->year, $date->month, $centerIds);

            $chart[] = [
                'month'    => 'Thg ' . $date->format('n'),
                'students' => $count,
            ];
        }

        return $chart;
    }

    /**
     * Biểu đồ cột Lớp học mới thêm 6 tháng gần nhất
     * @param  array<int, int>                                $centerIds
     * @return array<int, array{month: string, classes: int}>
     */
    protected function getMonthlyNewClassesBarChart(array $centerIds): array
    {
        $chart = [];

        for ($i = 5; $i >= 0; $i--) {
            $date  = now()->subMonths($i);
            $count = $this->schoolClassRepository->countInYearMonthAndCenterIds($date->year, $date->month, $centerIds);

            $chart[] = [
                'month'   => 'Thg ' . $date->format('n'),
                'classes' => $count,
            ];
        }

        return $chart;
    }

    /**
     * Giáo viên - Lịch dạy cả tháng
     * @param  int                                                                                                        $teacherId
     * @param  ?string                                                                                                    $monthStr  (YYYY-MM)
     * @return array{month: string, month_label: string, prev_month: string, next_month: string, days: array<int, mixed>}
     */
    protected function getTeacherMonthlySchedule(int $teacherId, ?string $monthStr = null): array
    {
        $baseDate = null;

        if ($monthStr && preg_match('/^\d{4}-\d{2}$/', $monthStr)) {
            try {
                $baseDate = \Carbon\Carbon::createFromFormat('Y-m', $monthStr)->startOfMonth();
            } catch (\Exception $e) {
                $baseDate = now()->startOfMonth();
            }
        } else {
            $baseDate = now()->startOfMonth();
        }

        $startOfMonth = $baseDate->copy()->startOfMonth();
        $endOfMonth   = $baseDate->copy()->endOfMonth();
        $todayStr     = now()->toDateString();

        // Start grid on Monday of the first week
        $gridStart = $startOfMonth->copy()->startOfWeek(\Carbon\Carbon::MONDAY);
        // End grid on Sunday of the last week
        $gridEnd = $endOfMonth->copy()->endOfWeek(\Carbon\Carbon::SUNDAY);

        // Lấy các ca học thực tế trong toàn bộ khung lưới tháng của giáo viên
        $sessions = \App\Models\ClassSession::query()
            ->with([
                'classSubject.schoolClass:id,name,code,center_id',
                'classSubject.subject:id,name,code',
                'room:id,name',
            ])
            ->where(function ($q) use ($teacherId) {
                $q->where('class_sessions.teacher_id', $teacherId)
                    ->orWhere(function ($fallbackQ) use ($teacherId) {
                        $fallbackQ->whereNull('class_sessions.teacher_id')
                            ->whereHas('classSubject', fn ($cq) => $cq->where('teacher_id', $teacherId));
                    });
            })
            ->whereBetween('session_date', [$gridStart->toDateString(), $gridEnd->toDateString()])
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get();

        $days       = [];
        $currentDay = $gridStart->copy();

        $dayNames = [
            1 => 'Thứ 2',
            2 => 'Thứ 3',
            3 => 'Thứ 4',
            4 => 'Thứ 5',
            5 => 'Thứ 6',
            6 => 'Thứ 7',
            7 => 'Chủ Nhật',
        ];

        while ($currentDay->lte($gridEnd)) {
            $dayDateStr     = $currentDay->toDateString();
            $isoWeekday     = $currentDay->dayOfWeekIso; // 1 (Mon) - 7 (Sun)
            $isToday        = ($dayDateStr === $todayStr);
            $isCurrentMonth = ($currentDay->month === $startOfMonth->month);

            $daySess = $sessions->filter(function ($sess) use ($dayDateStr) {
                if (! $sess->session_date) {
                    return false;
                }
                $sessDate = $sess->session_date instanceof \DateTimeInterface
                    ? $sess->session_date->format('Y-m-d')
                    : Carbon::parse($sess->session_date)->format('Y-m-d');

                return $sessDate === $dayDateStr;
            })->values();
            $mapped = [];

            if ($daySess->isNotEmpty()) {
                foreach ($daySess as $sess) {
                    $startTimeStr = $sess->start_time ? (is_string($sess->start_time) ? substr($sess->start_time, 0, 5) : $sess->start_time->format('H:i')) : '08:00';
                    $endTimeStr   = $sess->end_time ? (is_string($sess->end_time) ? substr($sess->end_time, 0, 5) : $sess->end_time->format('H:i')) : '09:30';

                    $mapped[] = [
                        'id'           => $sess->id,
                        'session_id'   => $sess->id,
                        'session_date' => $dayDateStr,
                        'start_time'   => $startTimeStr,
                        'end_time'     => $endTimeStr,
                        'time'         => "{$startTimeStr} - {$endTimeStr}",
                        'class_id'     => $sess->classSubject?->schoolClass?->id,
                        'class_name'   => $sess->classSubject?->schoolClass?->name ?? 'Lớp học',
                        'class_code'   => $sess->classSubject?->schoolClass?->code,
                        'subject_name' => $sess->classSubject?->subject?->name ?? 'Môn học',
                        'room_name'    => $sess->room?->name ?? 'Phòng học',
                        'status'       => $sess->status ?? 'scheduled',
                        'is_today'     => $isToday,
                    ];
                }
            }

            $days[] = [
                'date'             => $dayDateStr,
                'day_number'       => (int) $currentDay->format('j'),
                'weekday'          => $isoWeekday,
                'day_name'         => $dayNames[$isoWeekday] ?? "Thứ {$isoWeekday}",
                'is_current_month' => $isCurrentMonth,
                'is_today'         => $isToday,
                'schedules'        => $mapped,
            ];

            $currentDay = $currentDay->addDay();
        }

        return [
            'month'       => $startOfMonth->format('Y-m'),
            'month_label' => 'Tháng ' . $startOfMonth->format('m/Y'),
            'prev_month'  => $startOfMonth->copy()->subMonth()->format('Y-m'),
            'next_month'  => $startOfMonth->copy()->addMonth()->format('Y-m'),
            'days'        => $days,
        ];
    }

    /**
     * Giáo viên - Lịch dạy trong tuần
     * @param  int                                                                                                           $teacherId
     * @return array<int, array{day_name: string, weekday: int, date: string, is_today: bool, schedules: array<int, mixed>}>
     */
    protected function getTeacherWeeklySchedule(int $teacherId): array
    {
        $startOfWeek = now()->startOfWeek(); // Monday
        $endOfWeek   = now()->endOfWeek();   // Sunday
        $todayStr    = now()->toDateString();

        $weekdays = [
            1 => 'Thứ 2',
            2 => 'Thứ 3',
            3 => 'Thứ 4',
            4 => 'Thứ 5',
            5 => 'Thứ 6',
            6 => 'Thứ 7',
            7 => 'Chủ Nhật',
        ];

        // Lấy các ca học thực tế trong tuần của giáo viên
        $sessions = \App\Models\ClassSession::query()
            ->with([
                'classSubject.schoolClass:id,name,code,center_id',
                'classSubject.subject:id,name,code',
                'room:id,name',
            ])
            ->where(function ($q) use ($teacherId) {
                $q->where('class_sessions.teacher_id', $teacherId)
                    ->orWhere(function ($fallbackQ) use ($teacherId) {
                        $fallbackQ->whereNull('class_sessions.teacher_id')
                            ->whereHas('classSubject', fn ($cq) => $cq->where('teacher_id', $teacherId));
                    });
            })
            ->whereBetween('session_date', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get();

        $result = [];

        foreach ($weekdays as $dayCode => $dayName) {
            $dayDate = $startOfWeek->copy()->addDays($dayCode - 1)->toDateString();
            $isToday = ($dayDate === $todayStr);

            $daySess = $sessions->filter(function ($sess) use ($dayDate) {
                if (! $sess->session_date) {
                    return false;
                }
                $sessDate = $sess->session_date instanceof \DateTimeInterface
                    ? $sess->session_date->format('Y-m-d')
                    : Carbon::parse($sess->session_date)->format('Y-m-d');

                return $sessDate === $dayDate;
            })->values();

            $mapped = [];

            if ($daySess->isNotEmpty()) {
                foreach ($daySess as $sess) {
                    $startTimeStr = $sess->start_time ? (is_string($sess->start_time) ? substr($sess->start_time, 0, 5) : $sess->start_time->format('H:i')) : '08:00';
                    $endTimeStr   = $sess->end_time ? (is_string($sess->end_time) ? substr($sess->end_time, 0, 5) : $sess->end_time->format('H:i')) : '09:30';

                    $mapped[] = [
                        'id'           => $sess->id,
                        'session_id'   => $sess->id,
                        'session_date' => $dayDate,
                        'start_time'   => $startTimeStr,
                        'end_time'     => $endTimeStr,
                        'time'         => "{$startTimeStr} - {$endTimeStr}",
                        'class_id'     => $sess->classSubject?->schoolClass?->id,
                        'class_name'   => $sess->classSubject?->schoolClass?->name ?? 'Lớp học',
                        'class_code'   => $sess->classSubject?->schoolClass?->code,
                        'subject_name' => $sess->classSubject?->subject?->name ?? 'Môn học',
                        'room_name'    => $sess->room?->name ?? 'Phòng học',
                        'status'       => $sess->status ?? 'scheduled',
                        'is_today'     => $isToday,
                    ];
                }
            }

            $result[] = [
                'day_name'  => $dayName,
                'weekday'   => $dayCode,
                'date'      => $dayDate,
                'is_today'  => $isToday,
                'schedules' => $mapped,
            ];
        }

        return $result;
    }

    /**
     * Học sinh - Lịch học trong tuần
     * @param  int                                                                             $studentId
     * @return array<int, array{day_name: string, weekday: int, schedules: array<int, mixed>}>
     */
    protected function getStudentWeeklySchedule(int $studentId): array
    {
        $student = $this->studentRepository->find($studentId);

        if (! $student) {
            return [];
        }

        $classIds = $student->classStudents()->pluck('class_id')->toArray();

        $weekdays = [
            1 => 'Thứ 2',
            2 => 'Thứ 3',
            3 => 'Thứ 4',
            4 => 'Thứ 5',
            5 => 'Thứ 6',
            6 => 'Thứ 7',
            7 => 'Chủ Nhật',
        ];

        $schedules = $this->classScheduleRepository->getStudentSchedules($classIds);

        $result = [];

        foreach ($weekdays as $dayCode => $dayName) {
            $daySchedules = $schedules->where('weekday', $dayCode)->values();
            $mapped       = [];

            foreach ($daySchedules as $sched) {
                $mapped[] = [
                    'id'           => $sched->id,
                    'class_name'   => $sched->classSubject->schoolClass->name ?? 'Lớp học',
                    'subject_name' => $sched->classSubject->subject->name ?? 'Môn học',
                    'room_name'    => $sched->room->name ?? 'Phòng học',
                    'time'         => "{$sched->start_time} - {$sched->end_time}",
                ];
            }

            $result[] = [
                'day_name'  => $dayName,
                'weekday'   => $dayCode,
                'schedules' => $mapped,
            ];
        }

        return $result;
    }

    /**
     * Học sinh - Bảng kết quả thi
     * @param  int                              $studentId
     * @return array<int, array<string, mixed>>
     */
    protected function getStudentExamResults(int $studentId): array
    {
        $results = $this->examResultRepository->getStudentExamResults($studentId);

        $mapped = [];

        foreach ($results as $res) {
            $mapped[] = [
                'id'           => $res->id,
                'exam_name'    => $res->exam->name ?? 'Bài thi',
                'subject_name' => $res->exam->subject->name ?? 'Môn học',
                'class_name'   => $res->exam->schoolClass->name ?? 'Lớp học',
                'score'        => (float) $res->score,
                'grade'        => $res->grade ?? 'Đạt',
                'comment'      => $res->comment ?? '',
                'exam_date'    => $res->exam->exam_date ? $res->exam->exam_date->format('d-m-Y') : date('d-m-Y'),
            ];
        }

        return $mapped;
    }

    /**
     * Format Center data summary
     * @param  Center               $center
     * @return array<string, mixed>
     */
    protected function formatCenterData(Center $center): array
    {
        $expiresAt = $center->expires_at;
        $isExpired = $expiresAt ? $expiresAt->isPast() : false;

        $daysRemaining     = $expiresAt ? (int) max(0, ceil(now()->diffInHours($expiresAt, false) / 24)) : 999;
        $expiringSoon      = $expiresAt ? (! $isExpired && $daysRemaining <= 7) : false;
        $expiring1DayAlert = $expiresAt ? (! $isExpired && $daysRemaining <= 1) : false;

        return [
            'id'                => $center->id,
            'code'              => $center->code,
            'name'              => $center->name,
            'subscription_plan' => $center->subscription_plan,
            'expires_at'        => $expiresAt ? $expiresAt->toIso8601String() : null,
            'is_expired'        => $isExpired,
            'expiring_soon'     => $expiringSoon,
            'expiring_1day'     => $expiring1DayAlert,
            'days_remaining'    => $daysRemaining,
        ];
    }
}
