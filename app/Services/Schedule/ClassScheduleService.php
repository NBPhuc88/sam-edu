<?php

namespace App\Services\Schedule;

use App\Helpers\VietnamHolidayHelper;
use App\Jobs\GenerateClassSessionsJob;
use App\Models\Admin;
use App\Models\ClassSchedule;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Room\RoomRepositoryInterface;
use App\Repositories\Schedule\ClassScheduleRepositoryInterface;
use App\Repositories\Session\ClassSessionRepositoryInterface;
use App\Repositories\Subject\SubjectRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ClassScheduleService implements ClassScheduleServiceInterface
{
    public function __construct(
        protected ClassScheduleRepositoryInterface $scheduleRepository,
        protected CenterRepositoryInterface $centerRepository,
        protected SchoolClassRepositoryInterface $schoolClassRepository,
        protected RoomRepositoryInterface $roomRepository,
        protected TeacherRepositoryInterface $teacherRepository,
        protected SubjectRepositoryInterface $subjectRepository,
        protected ClassSessionRepositoryInterface $sessionRepository
    ) {
    }

    /**
     * @param  ?Admin          $admin
     * @return array<int>|null Null nghĩa là Super Admin (truy cập toàn bộ)
     */
    protected function getAllowedCenterIds(?Admin $admin): ?array
    {
        if (! $admin) {
            return [];
        }

        if ($admin->isSuperAdmin()) {
            return null; // All centers
        }

        return $admin->centers()->pluck('centers.id')->toArray();
    }

    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  ?int                 $teacherId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedSchedules(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $subjectId = null,
        ?int $teacherId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null
    ): LengthAwarePaginator {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null) {
            if ($centerId !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                $centerIds = []; // No access
            } elseif ($centerId !== null) {
                $centerIds = [$centerId];
            } else {
                $centerIds = $allowedCenterIds;
            }
        } else {
            $centerIds = $centerId;
        }

        return $this->scheduleRepository->paginate(
            $search,
            $centerIds,
            $classId,
            $subjectId,
            $teacherId,
            $status,
            $perPage,
            $page
        );
    }

    /**
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        return [
            'centers'  => $this->centerRepository->getActiveCenters($allowedCenterIds),
            'classes'  => $this->schoolClassRepository->getClassesForScheduleForm($allowedCenterIds),
            'rooms'    => $this->roomRepository->getByCenterIds($allowedCenterIds),
            'teachers' => $this->teacherRepository->getActiveTeachers($allowedCenterIds),
            'subjects' => $this->subjectRepository->getByCenterIds($allowedCenterIds),
        ];
    }

    /**
     * @param  int                $id
     * @param  ?Admin             $admin
     * @return ClassSchedule|null
     */
    public function findSchedule(int $id, ?Admin $admin = null): ?ClassSchedule
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $schedule         = $this->scheduleRepository->find($id, $allowedCenterIds);

        if (! $schedule) {
            throw new NotFoundHttpException('Không tìm thấy lịch học hoặc bạn không có quyền truy cập.');
        }

        return $schedule;
    }

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return ClassSchedule
     */
    public function createSchedule(array $data, ?Admin $admin = null): ClassSchedule
    {
        $classId   = (int) $data['class_id'];
        $subjectId = (int) $data['subject_id'];
        $teacherId = (int) $data['teacher_id'];

        $schoolClass = $this->schoolClassRepository->find($classId);

        if (! $schoolClass) {
            throw new NotFoundHttpException("Không tìm thấy lớp học với ID #{$classId}");
        }

        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null && ! in_array($schoolClass->center_id, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền quản lý lịch học của lớp này.');
        }

        // Lấy thông tin môn học để đảm bảo có số buổi total_sessions chính xác
        $subject = $this->subjectRepository->find($subjectId);

        return DB::transaction(function () use ($data, $schoolClass, $subject, $subjectId, $teacherId) {
            // 1. Tìm hoặc tạo liên kết ClassSubject
            $classSubject = $this->scheduleRepository->findOrCreateClassSubject(
                $schoolClass->id,
                $subjectId,
                [
                    'teacher_id' => $teacherId,
                    'start_date' => $data['start_date'] ?? null,
                    'end_date'   => $data['end_date'] ?? null,
                    'status'     => 'active',
                ]
            );

            $firstSchedule    = null;
            $createdSchedules = [];

            // 2. Tạo các bản ghi ClassSchedule theo từng thứ trong tuần
            $weeklySchedules = $data['weekly_schedules'] ?? [];

            foreach ($weeklySchedules as $item) {
                if (! empty($item['weekday']) && ! empty($item['start_time']) && ! empty($item['end_time'])) {
                    $schedule = $this->scheduleRepository->create([
                        'class_subject_id' => $classSubject->id,
                        'weekday'          => (int) $item['weekday'],
                        'start_time'       => $item['start_time'],
                        'end_time'         => $item['end_time'],
                        'room_id'          => ! empty($data['room_id']) ? (int) $data['room_id'] : null,
                        'effective_from'   => $data['start_date'],
                        'effective_to'     => $data['end_date'] ?? null,
                        'status'           => $data['status'] ?? 'active',
                    ]);

                    $createdSchedules[$item['weekday']] = $schedule;

                    if (! $firstSchedule) {
                        $firstSchedule = $schedule;
                    }
                }
            }

            // Fallback nếu không có weekly_schedules nhưng có specific_sessions
            if (! $firstSchedule) {
                $firstSchedule = $this->scheduleRepository->create([
                    'class_subject_id' => $classSubject->id,
                    'weekday'          => 1,
                    'start_time'       => '08:00',
                    'end_time'         => '10:00',
                    'room_id'          => ! empty($data['room_id']) ? (int) $data['room_id'] : null,
                    'effective_from'   => $data['start_date'],
                    'effective_to'     => $data['end_date'] ?? null,
                    'status'           => $data['status'] ?? 'active',
                ]);
            }

            // 3. Tính toán toàn bộ danh sách ca học và ngày kết thúc (thuần in-memory)
            $sessionResult = $this->calculateSessionsPayload($classSubject, $createdSchedules, $data, $subject?->total_sessions);
            $finalEndDate  = ! empty($data['end_date']) ? $data['end_date'] : $sessionResult['calculated_end_date'];

            // 4. Cập nhật ngày bắt đầu và kết thúc vào class_subject và class_schedules
            $this->scheduleRepository->updateClassSubject($classSubject->id, [
                'teacher_id' => $teacherId,
                'start_date' => $data['start_date'],
                'end_date'   => $finalEndDate,
                'status'     => 'active',
            ]);

            if ($finalEndDate) {
                $this->scheduleRepository->updateEffectiveToByClassSubjectId($classSubject->id, $finalEndDate);
            }

            // Cập nhật ngày bắt đầu / kết thúc của lớp học nếu cần
            $this->syncSchoolClassDates($schoolClass, $data['start_date'], $finalEndDate);

            // 5. Dispatch Job để lưu các ca học hàng loạt (tối đa 1000 items/chunk)
            if (! empty($sessionResult['sessions'])) {
                GenerateClassSessionsJob::dispatchSync($classSubject->id, $sessionResult['sessions'], false);
            }

            return $firstSchedule->refresh();
        });
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return ClassSchedule
     */
    public function updateSchedule(int $id, array $data, ?Admin $admin = null): ClassSchedule
    {
        $schedule = $this->findSchedule($id, $admin);

        return DB::transaction(function () use ($schedule, $data) {
            $classSubject = $schedule->classSubject;
            $teacherId    = ! empty($data['teacher_id']) ? (int) $data['teacher_id'] : $classSubject->teacher_id;
            $roomId       = ! empty($data['room_id']) ? (int) $data['room_id'] : null;
            $startDate    = $data['start_date'] ?? ($schedule->effective_from?->format('Y-m-d') ?: $classSubject->start_date?->format('Y-m-d') ?: now()->toDateString());
            $subjectId    = $classSubject->subject_id;
            $subject      = $this->subjectRepository->find($subjectId);

            $scheduleChanged = $this->hasScheduleOrDateChanged($classSubject, $data);

            if (! $scheduleChanged) {
                // Chỉ cập nhật thông tin chung (teacher_id, room_id, status) mà không xóa và sinh lại buổi học
                $this->scheduleRepository->updateClassSubject($classSubject->id, [
                    'teacher_id' => $teacherId,
                    'status'     => $data['status'] ?? $classSubject->status,
                ]);

                foreach ($classSubject->classSchedules as $cs) {
                    $this->scheduleRepository->update($cs->id, [
                        'room_id' => $roomId,
                        'status'  => $data['status'] ?? $cs->status,
                    ]);
                }

                // Cập nhật teacher_id và room_id cho các ca học tương lai chưa điểm danh
                \App\Models\ClassSession::where('class_subject_id', $classSubject->id)
                    ->where('session_date', '>=', now()->toDateString())
                    ->where('status', 'scheduled')
                    ->whereDoesntHave('attendances')
                    ->update([
                        'teacher_id' => $teacherId,
                        'room_id'    => $roomId,
                    ]);

                return $schedule->refresh();
            }

            // Khi có thay đổi về ngày bắt đầu hoặc lịch học:
            $oldStartDate = $classSubject->start_date?->format('Y-m-d');
            $fromDate     = min(array_filter([$startDate, $oldStartDate, now()->toDateString()]));

            // 1. Xóa các schedule cũ của class_subject này để đồng bộ lại
            $this->scheduleRepository->deleteByClassSubjectId($classSubject->id);

            // 2. Tạo lại các schedule tuần mới
            $weeklySchedules  = $data['weekly_schedules'] ?? [];
            $createdSchedules = [];
            $firstSchedule    = null;

            foreach ($weeklySchedules as $item) {
                if (! empty($item['weekday']) && ! empty($item['start_time']) && ! empty($item['end_time'])) {
                    $newSchedule = $this->scheduleRepository->create([
                        'class_subject_id' => $classSubject->id,
                        'weekday'          => (int) $item['weekday'],
                        'start_time'       => $item['start_time'],
                        'end_time'         => $item['end_time'],
                        'room_id'          => $roomId,
                        'effective_from'   => $startDate,
                        'effective_to'     => $data['end_date'] ?? null,
                        'status'           => $data['status'] ?? 'active',
                    ]);

                    $createdSchedules[$item['weekday']] = $newSchedule;

                    if (! $firstSchedule) {
                        $firstSchedule = $newSchedule;
                    }
                }
            }

            if (! $firstSchedule) {
                $firstSchedule = $this->scheduleRepository->create([
                    'class_subject_id' => $classSubject->id,
                    'weekday'          => 1,
                    'start_time'       => '08:00',
                    'end_time'         => '10:00',
                    'room_id'          => $roomId,
                    'effective_from'   => $startDate,
                    'effective_to'     => $data['end_date'] ?? null,
                    'status'           => $data['status'] ?? 'active',
                ]);
            }

            // 3. Tính toán toàn bộ ca học mới
            $calcData      = array_merge($data, ['start_date' => $startDate]);
            $sessionResult = $this->calculateSessionsPayload($classSubject, $createdSchedules, $calcData, $subject?->total_sessions);
            $finalEndDate  = ! empty($data['end_date']) ? $data['end_date'] : $sessionResult['calculated_end_date'];

            // 4. Cập nhật class_subject và class_schedules
            $this->scheduleRepository->updateClassSubject($classSubject->id, [
                'teacher_id' => $teacherId,
                'start_date' => $startDate,
                'end_date'   => $finalEndDate,
                'status'     => $data['status'] ?? 'active',
            ]);

            if ($finalEndDate) {
                $this->scheduleRepository->updateEffectiveToByClassSubjectId($classSubject->id, $finalEndDate);
            }

            if ($classSubject->schoolClass) {
                $this->syncSchoolClassDates($classSubject->schoolClass, $startDate, $finalEndDate);
            }

            // 5. Xóa các ca học cũ bị thay đổi và sinh lại ca học mới
            GenerateClassSessionsJob::dispatchSync(
                $classSubject->id,
                $sessionResult['sessions'],
                true,
                $fromDate
            );

            return $firstSchedule->refresh();
        });
    }

    /**
     * Kiểm tra xem ngày bắt đầu hoặc cấu hình lịch học có bị thay đổi hay không.
     *
     * @param  ClassSubject         $classSubject
     * @param  array<string, mixed> $data
     * @return bool
     */
    protected function hasScheduleOrDateChanged(ClassSubject $classSubject, array $data): bool
    {
        $oldStartDate = $classSubject->start_date?->format('Y-m-d');
        $newStartDate = ! empty($data['start_date']) ? Carbon::parse($data['start_date'])->format('Y-m-d') : null;

        if ($newStartDate && $oldStartDate !== $newStartDate) {
            return true;
        }

        if (array_key_exists('end_date', $data)) {
            $oldEndDate = $classSubject->end_date?->format('Y-m-d');
            $newEndDate = ! empty($data['end_date']) ? Carbon::parse($data['end_date'])->format('Y-m-d') : null;

            if ($oldEndDate !== $newEndDate) {
                return true;
            }
        }

        if (! empty($data['specific_sessions']) || ! empty($data['off_sessions'])) {
            return true;
        }

        $oldSchedules = $classSubject->classSchedules
            ->map(fn ($s) => [
                'weekday'    => (int) $s->weekday,
                'start_time' => substr((string) $s->start_time, 0, 5),
                'end_time'   => substr((string) $s->end_time, 0, 5),
            ])
            ->sortBy(['weekday', 'start_time'])
            ->values()
            ->toArray();

        $newSchedules = collect($data['weekly_schedules'] ?? [])
            ->filter(fn ($s) => ! empty($s['weekday']) && ! empty($s['start_time']) && ! empty($s['end_time']))
            ->map(fn ($s) => [
                'weekday'    => (int) $s['weekday'],
                'start_time' => substr((string) $s['start_time'], 0, 5),
                'end_time'   => substr((string) $s['end_time'], 0, 5),
            ])
            ->sortBy(['weekday', 'start_time'])
            ->values()
            ->toArray();

        return $oldSchedules !== $newSchedules;
    }

    /**
     * Đồng bộ ngày bắt đầu và kết thúc của Lớp học nếu chưa được thiết lập.
     * @param SchoolClass $schoolClass
     * @param ?string     $startDate
     * @param ?string     $endDate
     */
    protected function syncSchoolClassDates(SchoolClass $schoolClass, ?string $startDate, ?string $endDate): void
    {
        $update = [];

        if ($startDate) {
            $currentClassStart = $schoolClass->start_date?->format('Y-m-d');

            if (! $currentClassStart || $startDate < $currentClassStart) {
                $update['start_date'] = $startDate;
            }
        }

        if ($endDate) {
            $currentClassEnd = $schoolClass->end_date?->format('Y-m-d');

            if (! $currentClassEnd || $endDate > $currentClassEnd) {
                $update['end_date'] = $endDate;
            }
        }

        if (! empty($update)) {
            $this->schoolClassRepository->update($schoolClass->id, $update);
        }
    }

    /**
     * Tính toán thuần danh sách ca học (ClassSession payload) và ngày kết thúc dự kiến.
     * Xử lý hoàn toàn trong bộ nhớ theo mảng, không thực hiện các câu query đơn lẻ trong vòng lặp.
     *
     * @param  ClassSubject                                                                                $classSubject
     * @param  array<int, ClassSchedule>                                                                   $createdSchedules
     * @param  array<string, mixed>                                                                        $data
     * @param  ?int                                                                                        $totalSessions
     * @return array{sessions: array<int, array<string, mixed>>, calculated_end_date: ?string, count: int}
     */
    protected function calculateSessionsPayload(
        ClassSubject $classSubject,
        array $createdSchedules,
        array $data,
        ?int $totalSessions = null
    ): array {
        $startDateStr = $data['start_date'] ?? null;
        $endDateStr   = ! empty($data['end_date']) ? $data['end_date'] : null;

        if (! $startDateStr) {
            return [
                'sessions'            => [],
                'calculated_end_date' => null,
                'count'               => 0,
            ];
        }

        $startDate = Carbon::parse($startDateStr);

        $weeklySchedules = $data['weekly_schedules'] ?? [];
        $weeklyMap       = [];

        foreach ($weeklySchedules as $ws) {
            $weeklyMap[(int) $ws['weekday']] = $ws;
        }

        $offSessions = $data['off_sessions'] ?? [];
        $offDatesMap = [];

        foreach ($offSessions as $off) {
            if (! empty($off['date'])) {
                $offDatesMap[$off['date']] = $off['reason'] ?? 'Nghỉ theo lịch đã đặt';
            }
        }

        $excludeHolidays = ! empty($data['exclude_vietnam_holidays']);
        $teacherId       = (int) $data['teacher_id'];
        $roomId          = ! empty($data['room_id']) ? (int) $data['room_id'] : null;

        $sessions        = [];
        $seenDateTime    = [];
        $lastSessionDate = null;
        $currentDate     = $startDate->copy();
        $now             = now()->toDateTimeString();

        // 1. Sinh ca học theo chu kỳ các thứ trong tuần
        if (! $endDateStr) {
            if ($totalSessions && $totalSessions > 0) {
                // TH1: Môn học có cấu hình số buổi (VD: 60 buổi) -> sinh chính xác đến khi đủ số buổi
                $pastSessionsCount    = $this->sessionRepository->countSessionsBeforeDate($classSubject->id, $startDateStr);
                $targetRemainingCount = max(1, $totalSessions - $pastSessionsCount);
                $maxSafetyDate        = $startDate->copy()->addYears(5); // Giới hạn an toàn

                while (count($sessions) < $targetRemainingCount && $currentDate->lte($maxSafetyDate)) {
                    $dayOfWeek = (int) $currentDate->dayOfWeekIso; // 1 = Mon, ..., 7 = Sun
                    $dateStr   = $currentDate->format('Y-m-d');

                    if (isset($weeklyMap[$dayOfWeek])) {
                        $isOffDay = isset($offDatesMap[$dateStr]);
                        $isVnHol  = $excludeHolidays && VietnamHolidayHelper::isHoliday($currentDate);

                        if (! $isOffDay && ! $isVnHol) {
                            $item       = $weeklyMap[$dayOfWeek];
                            $scheduleId = isset($createdSchedules[$dayOfWeek]) ? $createdSchedules[$dayOfWeek]->id : null;
                            $key        = "{$dateStr}_{$item['start_time']}";

                            if (! isset($seenDateTime[$key])) {
                                $seenDateTime[$key] = true;
                                $sessions[]         = [
                                    'class_subject_id'  => $classSubject->id,
                                    'class_schedule_id' => $scheduleId,
                                    'teacher_id'        => $teacherId,
                                    'room_id'           => $roomId,
                                    'session_date'      => $dateStr,
                                    'start_time'        => $item['start_time'],
                                    'end_time'          => $item['end_time'],
                                    'status'            => 'scheduled',
                                    'topic'             => null,
                                    'note'              => null,
                                    'created_at'        => $now,
                                    'updated_at'        => $now,
                                ];
                                $lastSessionDate = $dateStr;
                            }
                        }
                    }

                    $currentDate->addDay();
                }
            } else {
                // TH2: Môn học không có cấu hình số buổi -> mặc định 12 tuần (khoảng 3 tháng)
                $endDate = $startDate->copy()->addWeeks(12);

                while ($currentDate->lte($endDate)) {
                    $dayOfWeek = (int) $currentDate->dayOfWeekIso;
                    $dateStr   = $currentDate->format('Y-m-d');

                    if (isset($weeklyMap[$dayOfWeek])) {
                        $isOffDay = isset($offDatesMap[$dateStr]);
                        $isVnHol  = $excludeHolidays && VietnamHolidayHelper::isHoliday($currentDate);

                        if (! $isOffDay && ! $isVnHol) {
                            $item       = $weeklyMap[$dayOfWeek];
                            $scheduleId = isset($createdSchedules[$dayOfWeek]) ? $createdSchedules[$dayOfWeek]->id : null;
                            $key        = "{$dateStr}_{$item['start_time']}";

                            if (! isset($seenDateTime[$key])) {
                                $seenDateTime[$key] = true;
                                $sessions[]         = [
                                    'class_subject_id'  => $classSubject->id,
                                    'class_schedule_id' => $scheduleId,
                                    'teacher_id'        => $teacherId,
                                    'room_id'           => $roomId,
                                    'session_date'      => $dateStr,
                                    'start_time'        => $item['start_time'],
                                    'end_time'          => $item['end_time'],
                                    'status'            => 'scheduled',
                                    'topic'             => null,
                                    'note'              => null,
                                    'created_at'        => $now,
                                    'updated_at'        => $now,
                                ];
                                $lastSessionDate = $dateStr;
                            }
                        }
                    }

                    $currentDate->addDay();
                }
            }
        } else {
            // TH3: Người dùng đã chỉ định ngày kết thúc dự kiến cụ thể
            $endDate = Carbon::parse($endDateStr);

            while ($currentDate->lte($endDate)) {
                $dayOfWeek = (int) $currentDate->dayOfWeekIso;
                $dateStr   = $currentDate->format('Y-m-d');

                if (isset($weeklyMap[$dayOfWeek])) {
                    $isOffDay = isset($offDatesMap[$dateStr]);
                    $isVnHol  = $excludeHolidays && VietnamHolidayHelper::isHoliday($currentDate);

                    if (! $isOffDay && ! $isVnHol) {
                        $item       = $weeklyMap[$dayOfWeek];
                        $scheduleId = isset($createdSchedules[$dayOfWeek]) ? $createdSchedules[$dayOfWeek]->id : null;
                        $key        = "{$dateStr}_{$item['start_time']}";

                        if (! isset($seenDateTime[$key])) {
                            $seenDateTime[$key] = true;
                            $sessions[]         = [
                                'class_subject_id'  => $classSubject->id,
                                'class_schedule_id' => $scheduleId,
                                'teacher_id'        => $teacherId,
                                'room_id'           => $roomId,
                                'session_date'      => $dateStr,
                                'start_time'        => $item['start_time'],
                                'end_time'          => $item['end_time'],
                                'status'            => 'scheduled',
                                'topic'             => null,
                                'note'              => null,
                                'created_at'        => $now,
                                'updated_at'        => $now,
                            ];
                            $lastSessionDate = $dateStr;
                        }
                    }
                }

                $currentDate->addDay();
            }
        }

        // 2. Thêm các buổi học cố định bổ sung (specific_sessions)
        $specificSessions = $data['specific_sessions'] ?? [];

        foreach ($specificSessions as $spec) {
            if (! empty($spec['date']) && ! empty($spec['start_time']) && ! empty($spec['end_time'])) {
                $specDateStr = $spec['date'];
                $key         = "{$specDateStr}_{$spec['start_time']}";

                if (! isset($seenDateTime[$key])) {
                    $seenDateTime[$key] = true;
                    $sessions[]         = [
                        'class_subject_id'  => $classSubject->id,
                        'class_schedule_id' => null,
                        'teacher_id'        => $teacherId,
                        'room_id'           => $roomId,
                        'session_date'      => $specDateStr,
                        'start_time'        => $spec['start_time'],
                        'end_time'          => $spec['end_time'],
                        'status'            => 'scheduled',
                        'topic'             => $spec['topic'] ?? 'Buổi học bổ sung',
                        'note'              => null,
                        'created_at'        => $now,
                        'updated_at'        => $now,
                    ];

                    if ($lastSessionDate === null || $specDateStr > $lastSessionDate) {
                        $lastSessionDate = $specDateStr;
                    }
                }
            }
        }

        // Sắp xếp các ca học theo ngày và giờ tăng dần
        usort($sessions, function ($a, $b) {
            $cmp = strcmp($a['session_date'], $b['session_date']);

            if ($cmp === 0) {
                return strcmp($a['start_time'], $b['start_time']);
            }

            return $cmp;
        });

        $calculatedEndDate = $endDateStr ?: $lastSessionDate;

        return [
            'sessions'            => $sessions,
            'calculated_end_date' => $calculatedEndDate,
            'count'               => count($sessions),
        ];
    }

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteSchedule(int $id, ?Admin $admin = null): bool
    {
        $schedule = $this->findSchedule($id, $admin);

        // Xóa các ca học tương ứng chưa diễn ra
        $this->sessionRepository->deleteFutureSessionsByScheduleId($schedule->id, now()->toDateString());

        return $this->scheduleRepository->delete($schedule->id);
    }
}
