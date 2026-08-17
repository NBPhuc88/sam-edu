<?php

namespace App\Services\Schedule;

use App\Helpers\VietnamHolidayHelper;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Repositories\Schedule\ClassScheduleRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ClassScheduleService implements ClassScheduleServiceInterface
{
    public function __construct(
        protected ClassScheduleRepositoryInterface $scheduleRepository
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

        $centersQuery = Center::query()->where('status', 'active');
        $classesQuery = SchoolClass::query()->with([
            'classSubjects.subject:id,name,code',
            'classSubjects.teacher:id,full_name,teacher_code',
        ]);
        $roomsQuery    = Room::query();
        $teachersQuery = Teacher::query()->where('status', 'active');
        $subjectsQuery = Subject::query()->where('status', 'active');

        if ($allowedCenterIds !== null) {
            $centersQuery->whereIn('id', $allowedCenterIds);
            $classesQuery->whereIn('center_id', $allowedCenterIds);
            $roomsQuery->whereIn('center_id', $allowedCenterIds);
            $teachersQuery->whereIn('center_id', $allowedCenterIds);
            $subjectsQuery->whereIn('center_id', $allowedCenterIds);
        }

        return [
            'centers'  => $centersQuery->orderBy('name')->get(['id', 'name', 'code']),
            'classes'  => $classesQuery->orderBy('name')->get(['id', 'name', 'code', 'center_id']),
            'rooms'    => $roomsQuery->orderBy('name')->get(['id', 'name', 'center_id', 'capacity']),
            'teachers' => $teachersQuery->orderBy('full_name')->get(['id', 'full_name', 'teacher_code', 'center_id']),
            'subjects' => $subjectsQuery->orderBy('name')->get(['id', 'name', 'code', 'center_id']),
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

        $schoolClass      = SchoolClass::findOrFail($classId);
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null && ! in_array($schoolClass->center_id, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền quản lý lịch học của lớp này.');
        }

        return DB::transaction(function () use ($data, $schoolClass, $subjectId, $teacherId) {
            // 1. Tìm hoặc tạo liên kết ClassSubject
            $classSubject = ClassSubject::firstOrCreate(
                [
                    'class_id'   => $schoolClass->id,
                    'subject_id' => $subjectId,
                ],
                [
                    'teacher_id' => $teacherId,
                    'start_date' => $data['start_date'] ?? null,
                    'end_date'   => $data['end_date'] ?? null,
                    'status'     => 'active',
                ]
            );

            // Cập nhật teacher và ngày học của class_subject nếu có thay đổi
            $classSubject->update([
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
            $this->generateSessions($classSubject, $createdSchedules, $data);

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
            $classSubject->update([
                'teacher_id' => $teacherId,
                'start_date' => $data['start_date'] ?? $classSubject->start_date,
                'end_date'   => $data['end_date'] ?? $classSubject->end_date,
            ]);

            // Xóa các schedule cũ của class_subject này để đồng bộ lại
            ClassSchedule::where('class_subject_id', $classSubject->id)->delete();

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
            ClassSession::where('class_subject_id', $classSubject->id)
                ->where('session_date', '>=', now()->toDateString())
                ->delete();

            $this->generateSessions($classSubject, $createdSchedules, $data);

            return $firstSchedule;
        });
    }

    /**
     * Tự động sinh danh sách các ca học (ClassSession) từ lịch học định kỳ và các thiết lập ngày nghỉ/học bù
     *
     * @param  ClassSubject              $classSubject
     * @param  array<int, ClassSchedule> $createdSchedules
     * @param  array<string, mixed>      $data
     * @return int                       Số lượng buổi học được sinh ra
     */
    protected function generateSessions(ClassSubject $classSubject, array $createdSchedules, array $data): int
    {
        $startDateStr = $data['start_date'] ?? null;
        $endDateStr   = $data['end_date'] ?? null;

        if (! $startDateStr) {
            return 0;
        }

        $startDate = Carbon::parse($startDateStr);
        // Nếu không có ngày kết thúc, mặc định tạo trong 12 tuần (khoảng 3 tháng)
        $endDate = $endDateStr ? Carbon::parse($endDateStr) : $startDate->copy()->addWeeks(12);

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

        $createdCount = 0;
        $currentDate  = $startDate->copy();

        // 1. Sinh ca học theo chu kỳ các thứ trong tuần
        while ($currentDate->lte($endDate)) {
            $dayOfWeek = (int) $currentDate->dayOfWeekIso; // 1 = Mon, ..., 7 = Sun
            $dateStr   = $currentDate->format('Y-m-d');

            if (isset($weeklyMap[$dayOfWeek])) {
                $item = $weeklyMap[$dayOfWeek];

                // Kiểm tra nếu là ngày nghỉ cố định
                if (isset($offDatesMap[$dateStr])) {
                    $currentDate->addDay();

                    continue;
                }

                // Kiểm tra nếu là ngày lễ Việt Nam
                if ($excludeHolidays && VietnamHolidayHelper::isHoliday($currentDate)) {
                    $currentDate->addDay();

                    continue;
                }

                $scheduleId = isset($createdSchedules[$dayOfWeek]) ? $createdSchedules[$dayOfWeek]->id : null;

                // Kiểm tra tránh trùng lặp ngày & giờ
                $exists = ClassSession::where('class_subject_id', $classSubject->id)
                    ->where('session_date', $dateStr)
                    ->where('start_time', $item['start_time'])
                    ->exists();

                if (! $exists) {
                    ClassSession::create([
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
                }
            }

            $currentDate->addDay();
        }

        // 2. Thêm các buổi học cố định bổ sung (specific_sessions)
        $specificSessions = $data['specific_sessions'] ?? [];

        foreach ($specificSessions as $spec) {
            if (! empty($spec['date']) && ! empty($spec['start_time']) && ! empty($spec['end_time'])) {
                $specDateStr = $spec['date'];

                $exists = ClassSession::where('class_subject_id', $classSubject->id)
                    ->where('session_date', $specDateStr)
                    ->where('start_time', $spec['start_time'])
                    ->exists();

                if (! $exists) {
                    ClassSession::create([
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
                }
            }
        }

        return $createdCount;
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
        ClassSession::where('class_schedule_id', $schedule->id)
            ->where('session_date', '>=', now()->toDateString())
            ->delete();

        return $this->scheduleRepository->delete($schedule->id);
    }
}
