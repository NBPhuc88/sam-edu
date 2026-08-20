<?php

namespace App\Services\Schedule;

use App\Helpers\VietnamHolidayHelper;
use App\Models\Admin;
use App\Models\ClassSchedule;
use App\Models\ClassSubject;
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

        return DB::transaction(function () use ($data, $schoolClass, $subjectId, $teacherId) {
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

            // Cập nhật teacher và ngày học của class_subject nếu có thay đổi
            $this->scheduleRepository->updateClassSubject($classSubject->id, [
                'teacher_id' => $teacherId,
                'start_date' => $data['start_date'] ?? $classSubject->start_date,
                'end_date'   => $data['end_date'] ?? $classSubject->end_date,
            ]);

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

            // 3. Tự động sinh ra danh sách ca học thực tế (ClassSession)
            $result = $this->generateSessions($classSubject, $createdSchedules, $data);

            // Cập nhật ngày kết thúc được tính toán vào class_subject và class_schedules nếu ban đầu để trống
            if (empty($data['end_date']) && ! empty($result['calculated_end_date'])) {
                $this->scheduleRepository->updateClassSubject($classSubject->id, ['end_date' => $result['calculated_end_date']]);
                $this->scheduleRepository->updateEffectiveToByClassSubjectId($classSubject->id, $result['calculated_end_date']);
            }

            return $firstSchedule;
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

            // Cập nhật class_subject
            $this->scheduleRepository->updateClassSubject($classSubject->id, [
                'teacher_id' => $teacherId,
                'start_date' => $data['start_date'] ?? $classSubject->start_date,
                'end_date'   => $data['end_date'] ?? $classSubject->end_date,
            ]);

            // Xóa các schedule cũ của class_subject này để đồng bộ lại
            $this->scheduleRepository->deleteByClassSubjectId($classSubject->id);

            // Tạo lại các schedule tuần mới
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
                        'room_id'          => ! empty($data['room_id']) ? (int) $data['room_id'] : null,
                        'effective_from'   => $data['start_date'],
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
                    'room_id'          => ! empty($data['room_id']) ? (int) $data['room_id'] : null,
                    'effective_from'   => $data['start_date'],
                    'effective_to'     => $data['end_date'] ?? null,
                    'status'           => $data['status'] ?? 'active',
                ]);
            }

            // Xóa các ca học cũ chưa diễn ra hoặc chưa điểm danh và sinh lại ca học mới
            $this->sessionRepository->deleteFutureUnattendedSessions($classSubject->id, now()->toDateString());

            $result = $this->generateSessions($classSubject, $createdSchedules, $data);

            // Cập nhật ngày kết thúc được tính toán vào class_subject và class_schedules nếu ban đầu để trống
            if (empty($data['end_date']) && ! empty($result['calculated_end_date'])) {
                $this->scheduleRepository->updateClassSubject($classSubject->id, ['end_date' => $result['calculated_end_date']]);
                $this->scheduleRepository->updateEffectiveToByClassSubjectId($classSubject->id, $result['calculated_end_date']);
            }

            return $firstSchedule;
        });
    }

    /**
     * Tự động sinh danh sách các ca học (ClassSession) từ lịch học định kỳ và các thiết lập ngày nghỉ/học bù.
     * Nếu không có ngày kết thúc cụ thể, số ca học sẽ được sinh theo số buổi thiết lập của Môn Học.
     *
     * @param  ClassSubject                                            $classSubject
     * @param  array<int, ClassSchedule>                               $createdSchedules
     * @param  array<string, mixed>                                    $data
     * @return array{created_count: int, calculated_end_date: ?string}
     */
    protected function generateSessions(ClassSubject $classSubject, array $createdSchedules, array $data): array
    {
        $startDateStr = $data['start_date'] ?? null;
        $endDateStr   = ! empty($data['end_date']) ? $data['end_date'] : null;

        if (! $startDateStr) {
            return [
                'created_count'       => 0,
                'calculated_end_date' => null,
            ];
        }

        $startDate = Carbon::parse($startDateStr);

        // Lấy số buổi đã thiết lập của môn học
        $subject       = $classSubject->subject ?? $this->subjectRepository->find($classSubject->subject_id);
        $totalSessions = $subject?->total_sessions;

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

        $createdCount    = 0;
        $currentDate     = $startDate->copy();
        $lastSessionDate = null;

        // 1. Sinh ca học theo chu kỳ các thứ trong tuần
        if (! $endDateStr) {
            if ($totalSessions && $totalSessions > 0) {
                // TH1: Môn học đã cấu hình số buổi (total_sessions) -> sinh chính xác theo số buổi
                $pastSessionsCount = $this->sessionRepository->countSessionsBeforeDate($classSubject->id, $startDateStr);

                $targetRemainingCount = max(1, $totalSessions - $pastSessionsCount);
                $maxSafetyDate        = $startDate->copy()->addYears(3); // Giới hạn tối đa tránh lặp vô tận

                while ($createdCount < $targetRemainingCount && $currentDate->lte($maxSafetyDate)) {
                    $dayOfWeek = (int) $currentDate->dayOfWeekIso; // 1 = Mon, ..., 7 = Sun
                    $dateStr   = $currentDate->format('Y-m-d');

                    if (isset($weeklyMap[$dayOfWeek])) {
                        $isOffDay = isset($offDatesMap[$dateStr]);
                        $isVnHol  = $excludeHolidays && VietnamHolidayHelper::isHoliday($currentDate);

                        if (! $isOffDay && ! $isVnHol) {
                            $item       = $weeklyMap[$dayOfWeek];
                            $scheduleId = isset($createdSchedules[$dayOfWeek]) ? $createdSchedules[$dayOfWeek]->id : null;

                            $exists = $this->sessionRepository->sessionExists($classSubject->id, $dateStr, $item['start_time']);

                            if (! $exists) {
                                $this->sessionRepository->createSession([
                                    'class_subject_id'  => $classSubject->id,
                                    'class_schedule_id' => $scheduleId,
                                    'teacher_id'        => $teacherId,
                                    'room_id'           => $roomId,
                                    'session_date'      => $dateStr,
                                    'start_time'        => $item['start_time'],
                                    'end_time'          => $item['end_time'],
                                    'status'            => 'scheduled',
                                ]);
                                $createdCount++;
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

                            $exists = $this->sessionRepository->sessionExists($classSubject->id, $dateStr, $item['start_time']);

                            if (! $exists) {
                                $this->sessionRepository->createSession([
                                    'class_subject_id'  => $classSubject->id,
                                    'class_schedule_id' => $scheduleId,
                                    'teacher_id'        => $teacherId,
                                    'room_id'           => $roomId,
                                    'session_date'      => $dateStr,
                                    'start_time'        => $item['start_time'],
                                    'end_time'          => $item['end_time'],
                                    'status'            => 'scheduled',
                                ]);
                                $createdCount++;
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

                        $exists = $this->sessionRepository->sessionExists($classSubject->id, $dateStr, $item['start_time']);

                        if (! $exists) {
                            $this->sessionRepository->createSession([
                                'class_subject_id'  => $classSubject->id,
                                'class_schedule_id' => $scheduleId,
                                'teacher_id'        => $teacherId,
                                'room_id'           => $roomId,
                                'session_date'      => $dateStr,
                                'start_time'        => $item['start_time'],
                                'end_time'          => $item['end_time'],
                                'status'            => 'scheduled',
                            ]);
                            $createdCount++;
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

                $exists = $this->sessionRepository->sessionExists($classSubject->id, $specDateStr, $spec['start_time']);

                if (! $exists) {
                    $this->sessionRepository->createSession([
                        'class_subject_id'  => $classSubject->id,
                        'class_schedule_id' => null,
                        'teacher_id'        => $teacherId,
                        'room_id'           => $roomId,
                        'session_date'      => $specDateStr,
                        'start_time'        => $spec['start_time'],
                        'end_time'          => $spec['end_time'],
                        'status'            => 'scheduled',
                        'topic'             => $spec['topic'] ?? 'Buổi học bổ sung',
                    ]);
                    $createdCount++;

                    if ($lastSessionDate === null || $specDateStr > $lastSessionDate) {
                        $lastSessionDate = $specDateStr;
                    }
                }
            }
        }

        $calculatedEndDate = $endDateStr ?: $lastSessionDate;

        return [
            'created_count'       => $createdCount,
            'calculated_end_date' => $calculatedEndDate,
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
