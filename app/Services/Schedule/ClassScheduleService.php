<?php

namespace App\Services\Schedule;

use App\Models\Admin;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Holiday\HolidayRepositoryInterface;
use App\Repositories\Room\RoomRepositoryInterface;
use App\Repositories\Schedule\ClassScheduleRepositoryInterface;
use App\Repositories\Session\ClassSessionRepositoryInterface;
use App\Repositories\Subject\SubjectRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
        protected ClassSessionRepositoryInterface $sessionRepository,
        protected HolidayRepositoryInterface $holidayRepository
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
     * Chuẩn hóa cấu trúc weeks sang dạng map [dayKey => [[start, end], ...]]
     * @param  array<mixed>                                           $rawWeeks
     * @return array<string, array<int, array{0: string, 1: string}>>
     */
    protected function normalizeWeeks(array $rawWeeks): array
    {
        $normalized = [];

        // Hỗ trợ cả 2 định dạng: {"1": [["18:00","20:00"]]} hoặc mảng weekly_schedules cũ [{weekday: 1, start_time: ..., end_time: ...}]
        foreach ($rawWeeks as $key => $value) {
            if (is_array($value) && isset($value['weekday'])) {
                // Định dạng cũ [{weekday: 1, start_time: '18:00', end_time: '20:00'}]
                $dayKey = (string) $value['weekday'];

                if (! empty($value['start_time']) && ! empty($value['end_time'])) {
                    $normalized[$dayKey][] = [
                        substr((string) $value['start_time'], 0, 5),
                        substr((string) $value['end_time'], 0, 5),
                    ];
                }
            } elseif (is_numeric($key) || is_string($key)) {
                $dayKey = (string) $key;

                if (is_array($value)) {
                    foreach ($value as $slot) {
                        if (is_array($slot) && count($slot) >= 2) {
                            $normalized[$dayKey][] = [
                                substr((string) $slot[0], 0, 5),
                                substr((string) $slot[1], 0, 5),
                            ];
                        }
                    }
                }
            }
        }

        // Sắp xếp các ca học trong mỗi ngày theo giờ bắt đầu
        foreach ($normalized as $k => $slots) {
            usort($slots, fn ($a, $b) => strcmp($a[0], $b[0]));
            $normalized[$k] = $slots;
        }

        ksort($normalized);

        $this->validateWeeksOverlap($normalized);

        return $normalized;
    }

    /**
     * Kiểm tra và không cho phép nhập trùng hoặc chồng chéo các ca học trong cùng một ngày
     * @param array<string, array<int, array{0: string, 1: string}>> $normalizedWeeks
     */
    protected function validateWeeksOverlap(array $normalizedWeeks): void
    {
        $weekdayNames = [
            '1' => 'Thứ 2',
            '2' => 'Thứ 3',
            '3' => 'Thứ 4',
            '4' => 'Thứ 5',
            '5' => 'Thứ 6',
            '6' => 'Thứ 7',
            '7' => 'Chủ Nhật',
        ];

        foreach ($normalizedWeeks as $dayKey => $slots) {
            if (! is_array($slots)) {
                continue;
            }

            $dayLabel = $weekdayNames[(string) $dayKey] ?? "Thứ {$dayKey}";
            $count    = count($slots);

            for ($i = 0; $i < $count; $i++) {
                $s1     = $slots[$i];
                $start1 = substr((string) ($s1[0] ?? ''), 0, 5);
                $end1   = substr((string) ($s1[1] ?? ''), 0, 5);

                if (! empty($start1) && ! empty($end1) && $start1 >= $end1) {
                    throw ValidationException::withMessages([
                        'weeks' => "Trong {$dayLabel}, Ca " . ($i + 1) . " ({$start1} - {$end1}) có giờ kết thúc phải sau giờ bắt đầu.",
                    ]);
                }

                for ($j = $i + 1; $j < $count; $j++) {
                    $s2     = $slots[$j];
                    $start2 = substr((string) ($s2[0] ?? ''), 0, 5);
                    $end2   = substr((string) ($s2[1] ?? ''), 0, 5);

                    if (! empty($start1) && ! empty($end1) && ! empty($start2) && ! empty($end2)) {
                        if ($start1 < $end2 && $start2 < $end1) {
                            throw ValidationException::withMessages([
                                'weeks' => "Trong {$dayLabel}, các ca học không được trùng hoặc chồng chéo thời gian: Ca " . ($i + 1) . " ({$start1} - {$end1}) bị trùng với Ca " . ($j + 1) . " ({$start2} - {$end2}).",
                            ]);
                        }
                    }
                }
            }
        }
    }

    /**
     * Chuẩn hóa mảng off_days
     * @param  ?array<mixed>                                                           $offDays
     * @return array<int, array{date: string, start_time: ?string, end_time: ?string}>
     */
    protected function normalizeOffDays(?array $offDays): array
    {
        if (empty($offDays)) {
            return [];
        }

        $result = [];

        foreach ($offDays as $item) {
            if (is_string($item) && ! empty($item)) {
                $result[] = [
                    'date'       => $item,
                    'start_time' => null,
                    'end_time'   => null,
                ];
            } elseif (is_array($item) && ! empty($item['date'])) {
                $result[] = [
                    'date'       => (string) $item['date'],
                    'start_time' => ! empty($item['start_time']) ? substr((string) $item['start_time'], 0, 5) : null,
                    'end_time'   => ! empty($item['end_time']) ? substr((string) $item['end_time'], 0, 5) : null,
                ];
            }
        }

        return $result;
    }

    /**
     * Chuẩn hóa mảng extra_days
     * @param  ?array<mixed>                                                         $extraDays
     * @return array<int, array{date: string, start_time: string, end_time: string}>
     */
    protected function normalizeExtraDays(?array $extraDays): array
    {
        if (empty($extraDays)) {
            return [];
        }

        $result = [];

        foreach ($extraDays as $item) {
            if (is_array($item) && ! empty($item['date']) && ! empty($item['start_time']) && ! empty($item['end_time'])) {
                $result[] = [
                    'date'       => (string) $item['date'],
                    'start_time' => substr((string) $item['start_time'], 0, 5),
                    'end_time'   => substr((string) $item['end_time'], 0, 5),
                ];
            }
        }

        return $result;
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

            $normalizedWeeks     = $this->normalizeWeeks($data['weeks'] ?? $data['weekly_schedules'] ?? []);
            $normalizedOffDays   = $this->normalizeOffDays($data['off_days'] ?? $data['off_sessions'] ?? []);
            $normalizedExtraDays = $this->normalizeExtraDays($data['extra_days'] ?? $data['specific_sessions'] ?? []);
            $autoHolidays        = isset($data['auto_holidays']) ? (bool) $data['auto_holidays'] : true;
            $excludedHolidayIds  = ! empty($data['excluded_holiday_ids']) ? array_map('intval', (array) $data['excluded_holiday_ids']) : [];

            // Lấy danh sách ngày lễ trong khoảng thời gian, loại bỏ các ngày lễ bị loại trừ
            $holidays = [];

            if ($autoHolidays) {
                $maxScanEnd      = ! empty($data['end_date']) ? $data['end_date'] : now()->addYears(2)->toDateString();
                $holidaysInRange = $this->holidayRepository->getInRange($data['start_date'], $maxScanEnd);
                $excludedSet     = array_flip($excludedHolidayIds);
                $holidays        = $holidaysInRange
                    ->filter(fn ($h) => ! isset($excludedSet[(int) $h->id]))
                    ->map(fn ($h) => [
                        'id'   => $h->id,
                        'name' => $h->name,
                        'date' => $h->date instanceof \DateTimeInterface ? $h->date->format('Y-m-d') : (string) $h->date,
                    ])->values()->toArray();
            }

            // 2. Tạo hoặc cập nhật bản ghi ClassSchedule duy nhất
            $schedule = ClassSchedule::updateOrCreate(
                ['class_subject_id' => $classSubject->id],
                [
                    'weeks'                => $normalizedWeeks,
                    'auto_holidays'        => $autoHolidays,
                    'excluded_holiday_ids' => $excludedHolidayIds,
                    'holidays'             => $holidays,
                    'off_days'             => $normalizedOffDays,
                    'extra_days'           => $normalizedExtraDays,
                    'room_id'              => ! empty($data['room_id']) ? (int) $data['room_id'] : null,
                    'status'               => $data['status'] ?? 'active',
                ]
            );

            // 3. Tính toán toàn bộ danh sách ca học và ngày kết thúc (thuần in-memory)
            $sessionResult = $this->calculateSessionsPayload(
                $classSubject,
                $schedule->id,
                $normalizedWeeks,
                $normalizedOffDays,
                $normalizedExtraDays,
                $data['start_date'],
                $data['end_date'] ?? null,
                $teacherId,
                ! empty($data['room_id']) ? (int) $data['room_id'] : null,
                $subject?->total_sessions,
                null,
                [],
                $holidays,
                $autoHolidays
            );

            $finalEndDate = ! empty($data['end_date']) ? $data['end_date'] : $sessionResult['calculated_end_date'];

            // 4. Cập nhật ngày bắt đầu và kết thúc vào class_subject
            $this->scheduleRepository->updateClassSubject($classSubject->id, [
                'teacher_id' => $teacherId,
                'start_date' => $data['start_date'],
                'end_date'   => $finalEndDate,
                'status'     => 'active',
            ]);

            // Cập nhật ngày bắt đầu / kết thúc của lớp học nếu cần
            $this->syncSchoolClassDates($schoolClass, $data['start_date'], $finalEndDate);

            // 5. Lưu các ca học hàng loạt (mỗi mảng đủ 1000 items thì insert)
            if (! empty($sessionResult['sessions'])) {
                foreach (array_chunk($sessionResult['sessions'], 1000) as $chunk) {
                    $this->sessionRepository->bulkInsertSessions($chunk);
                }
            }

            return $schedule->refresh();
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
            $roomId       = array_key_exists('room_id', $data) ? (! empty($data['room_id']) ? (int) $data['room_id'] : null) : $schedule->room_id;
            $startDate    = $data['start_date'] ?? $classSubject->start_date?->format('Y-m-d') ?: now()->toDateString();
            $subjectId    = $classSubject->subject_id;
            $subject      = $this->subjectRepository->find($subjectId);

            $scheduleChanged = $this->hasScheduleOrDateChanged($classSubject, $schedule, $data);

            if (! $scheduleChanged) {
                // Chỉ cập nhật thông tin chung (teacher_id, room_id, status) mà không xóa và sinh lại buổi học
                $this->scheduleRepository->updateClassSubject($classSubject->id, [
                    'teacher_id' => $teacherId,
                    'status'     => $data['status'] ?? $classSubject->status,
                ]);

                $schedule->update([
                    'room_id' => $roomId,
                    'status'  => $data['status'] ?? $schedule->status,
                ]);

                // Cập nhật teacher_id và room_id cho các ca học tương lai chưa điểm danh
                ClassSession::where('class_subject_id', $classSubject->id)
                    ->where('session_date', '>=', now()->toDateString())
                    ->where('status', 'scheduled')
                    ->whereDoesntHave('attendances')
                    ->update([
                        'teacher_id' => $teacherId,
                        'room_id'    => $roomId,
                    ]);

                return $schedule->refresh();
            }

            // Khi có thay đổi về ngày bắt đầu, ngày kết thúc, weeks, off_days hoặc extra_days:
            $today = now()->toDateString();

            // 1. Stream các buổi học trong quá khứ / đã điểm danh / hoàn thành bằng cursor() để tiết kiệm RAM
            $pastSessionsCursor = $this->sessionRepository->getPastSessionsCursor($classSubject->id, $today);
            $pastSessionsCount  = 0;
            $pastSessionKeys    = [];

            foreach ($pastSessionsCursor as $ps) {
                $pastSessionsCount++;
                $pDate                                 = $ps->session_date instanceof \DateTimeInterface ? $ps->session_date->format('Y-m-d') : (string) $ps->session_date;
                $pStart                                = substr((string) $ps->start_time, 0, 5);
                $pastSessionKeys["{$pDate}_{$pStart}"] = true;
            }

            // 2. Mốc ngày bắt đầu quét ca học tương lai
            $scanStartDate = ($startDate && $startDate > $today) ? $startDate : $today;

            // 3. Tính số buổi còn lại cần sinh trong tương lai
            $totalSessions        = $subject?->total_sessions;
            $neededFutureSessions = null;

            if ($totalSessions && $totalSessions > 0) {
                $neededFutureSessions = max(0, $totalSessions - $pastSessionsCount);
            }

            $normalizedWeeks     = $this->normalizeWeeks($data['weeks'] ?? $data['weekly_schedules'] ?? $schedule->weeks ?? []);
            $normalizedOffDays   = $this->normalizeOffDays($data['off_days'] ?? $data['off_sessions'] ?? $schedule->off_days ?? []);
            $normalizedExtraDays = $this->normalizeExtraDays($data['extra_days'] ?? $data['specific_sessions'] ?? $schedule->extra_days ?? []);
            $autoHolidays        = array_key_exists('auto_holidays', $data) ? (bool) $data['auto_holidays'] : (bool) ($schedule->auto_holidays ?? true);
            $excludedHolidayIds  = array_key_exists('excluded_holiday_ids', $data)
                ? array_map('intval', (array) $data['excluded_holiday_ids'])
                : (is_array($schedule->excluded_holiday_ids) ? $schedule->excluded_holiday_ids : []);

            $holidays = [];

            if ($autoHolidays) {
                $maxScanEnd      = ! empty($data['end_date']) ? $data['end_date'] : now()->addYears(2)->toDateString();
                $holidaysInRange = $this->holidayRepository->getInRange($startDate, $maxScanEnd);
                $excludedSet     = array_flip(array_map('intval', $excludedHolidayIds));
                $holidays        = $holidaysInRange
                    ->filter(fn ($h) => ! isset($excludedSet[(int) $h->id]))
                    ->map(fn ($h) => [
                        'id'   => $h->id,
                        'name' => $h->name,
                        'date' => $h->date instanceof \DateTimeInterface ? $h->date->format('Y-m-d') : (string) $h->date,
                    ])->values()->toArray();
            }

            $schedule->update([
                'weeks'                => $normalizedWeeks,
                'auto_holidays'        => $autoHolidays,
                'excluded_holiday_ids' => $excludedHolidayIds,
                'holidays'             => $holidays,
                'off_days'             => $normalizedOffDays,
                'extra_days'           => $normalizedExtraDays,
                'room_id'              => $roomId,
                'status'               => $data['status'] ?? $schedule->status,
            ]);

            // 4. Tính toán danh sách ca học tương lai mới
            $sessionResult = $this->calculateSessionsPayload(
                $classSubject,
                $schedule->id,
                $normalizedWeeks,
                $normalizedOffDays,
                $normalizedExtraDays,
                $startDate,
                $data['end_date'] ?? null,
                $teacherId,
                $roomId,
                $neededFutureSessions,
                $scanStartDate,
                $pastSessionKeys,
                $holidays,
                $autoHolidays
            );

            // 5. Đồng bộ các ca học tương lai (Giữ trùng, Xóa khác, Thêm thiếu) với chunk 1000 items
            $this->syncSessionsWithChunking(
                $classSubject->id,
                $sessionResult['sessions'],
                $scanStartDate
            );

            // 6. Tính toán lại ngày kết thúc từ buổi học cuối cùng trong DB qua repository
            $lastSession = $this->sessionRepository->getLatestSession($classSubject->id);

            $finalEndDate = ! empty($data['end_date'])
                ? $data['end_date']
                : ($lastSession?->session_date instanceof \DateTimeInterface
                    ? $lastSession->session_date->format('Y-m-d')
                    : ($lastSession?->session_date ?: $sessionResult['calculated_end_date']));

            // Cập nhật class_subject
            $this->scheduleRepository->updateClassSubject($classSubject->id, [
                'teacher_id' => $teacherId,
                'start_date' => $startDate,
                'end_date'   => $finalEndDate,
                'status'     => $data['status'] ?? 'active',
            ]);

            if ($classSubject->schoolClass) {
                $this->syncSchoolClassDates($classSubject->schoolClass, $startDate, $finalEndDate);
            }

            return $schedule->refresh();
        });
    }

    /**
     * Đồng bộ ca học thông minh tiết kiệm RAM:
     * - Stream future sessions qua cursor().
     * - So khớp và gom batch: mảng xóa đủ 1000 ID -> xóa, mảng insert đủ 1000 slot -> insert.
     *
     * @param  int                                          $classSubjectId
     * @param  array<int, array<string, mixed>>             $newFutureSlots
     * @param  string                                       $fromDate
     * @return array{kept: int, deleted: int, created: int}
     */
    public function syncSessionsWithChunking(int $classSubjectId, array $newFutureSlots, string $fromDate): array
    {
        // 1. Key hóa danh sách new future slots để tra cứu O(1)
        $newSlotMap = [];

        foreach ($newFutureSlots as $slot) {
            $dateStr          = (string) $slot['session_date'];
            $startTime        = substr((string) $slot['start_time'], 0, 5);
            $endTime          = substr((string) $slot['end_time'], 0, 5);
            $key              = "{$dateStr}_{$startTime}_{$endTime}";
            $newSlotMap[$key] = $slot;
        }

        $matchedSlotKeys = [];
        $deleteBatch     = [];
        $keptCount       = 0;
        $deletedCount    = 0;
        $createdCount    = 0;

        // 2. Stream các ca học tương lai hiện có từ database bằng cursor() để tiết kiệm RAM
        $futureCursor = $this->sessionRepository->getFutureUnattendedSessionsCursor($classSubjectId, $fromDate);

        foreach ($futureCursor as $existing) {
            $dateStr   = $existing->session_date instanceof \DateTimeInterface ? $existing->session_date->format('Y-m-d') : (string) $existing->session_date;
            $startTime = substr((string) $existing->start_time, 0, 5);
            $endTime   = substr((string) $existing->end_time, 0, 5);
            $key       = "{$dateStr}_{$startTime}_{$endTime}";

            if (isset($newSlotMap[$key])) {
                // TRÙNG LỊCH: Giữ nguyên session
                $matchedSlotKeys[$key] = true;
                $slot                  = $newSlotMap[$key];

                $existing->update([
                    'teacher_id'        => $slot['teacher_id'] ?? $existing->teacher_id,
                    'room_id'           => array_key_exists('room_id', $slot) ? $slot['room_id'] : $existing->room_id,
                    'class_schedule_id' => $slot['class_schedule_id'] ?? $existing->class_schedule_id,
                    'topic'             => $slot['topic'] ?? $existing->topic,
                ]);
                $keptCount++;
            } else {
                // KHÁC LỊCH: Gom vào batch xóa
                $deleteBatch[] = $existing->id;

                // Khi mảng xóa đủ 1000 ID -> gọi repository xóa
                if (count($deleteBatch) >= 1000) {
                    $deletedCount += $this->sessionRepository->deleteSessionsByIds($deleteBatch);
                    $deleteBatch = [];
                }
            }
        }

        // Xóa nốt các ID còn lại trong deleteBatch
        if (! empty($deleteBatch)) {
            $deletedCount += $this->sessionRepository->deleteSessionsByIds($deleteBatch);
            $deleteBatch = [];
        }

        // 3. Gom các slot THIẾU vào batch insert (cứ đủ 1000 item thì insert)
        $insertBatch = [];

        foreach ($newSlotMap as $key => $slot) {
            if (! isset($matchedSlotKeys[$key])) {
                $insertBatch[] = $slot;

                // Khi mảng insert đủ 1000 item -> gọi repository insert
                if (count($insertBatch) >= 1000) {
                    $createdCount += $this->sessionRepository->bulkInsertSessions($insertBatch);
                    $insertBatch = [];
                }
            }
        }

        // Insert nốt các slot còn lại trong insertBatch
        if (! empty($insertBatch)) {
            $createdCount += $this->sessionRepository->bulkInsertSessions($insertBatch);
            $insertBatch = [];
        }

        return [
            'kept'    => $keptCount,
            'deleted' => $deletedCount,
            'created' => $createdCount,
        ];
    }

    /**
     * Kiểm tra xem ngày bắt đầu hoặc cấu hình lịch học có bị thay đổi hay không.
     *
     * @param  ClassSubject         $classSubject
     * @param  ClassSchedule        $schedule
     * @param  array<string, mixed> $data
     * @return bool
     */
    protected function hasScheduleOrDateChanged(ClassSubject $classSubject, ClassSchedule $schedule, array $data): bool
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

        if (array_key_exists('weeks', $data) || array_key_exists('weekly_schedules', $data)) {
            $oldWeeks = $schedule->weeks ?? [];
            $newWeeks = $this->normalizeWeeks($data['weeks'] ?? $data['weekly_schedules'] ?? []);

            if ($oldWeeks !== $newWeeks) {
                return true;
            }
        }

        if (array_key_exists('off_days', $data) || array_key_exists('off_sessions', $data)) {
            $oldOff = $schedule->off_days ?? [];
            $newOff = $this->normalizeOffDays($data['off_days'] ?? $data['off_sessions'] ?? []);

            if ($oldOff !== $newOff) {
                return true;
            }
        }

        if (array_key_exists('extra_days', $data) || array_key_exists('specific_sessions', $data)) {
            $oldExtra = $schedule->extra_days ?? [];
            $newExtra = $this->normalizeExtraDays($data['extra_days'] ?? $data['specific_sessions'] ?? []);

            if ($oldExtra !== $newExtra) {
                return true;
            }
        }

        return false;
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
     *
     * @param  ClassSubject                                                                                $classSubject
     * @param  int                                                                                         $scheduleId
     * @param  array<string, array<int, array{0: string, 1: string}>>                                      $weeks
     * @param  array<int, array{date: string, start_time: ?string, end_time: ?string}>                     $offDays
     * @param  array<int, array{date: string, start_time: string, end_time: string}>                       $extraDays
     * @param  string                                                                                      $startDateStr
     * @param  ?string                                                                                     $endDateStr
     * @param  int                                                                                         $teacherId
     * @param  ?int                                                                                        $roomId
     * @param  ?int                                                                                        $targetRemainingCount
     * @param  ?string                                                                                     $scanStartDateStr
     * @param  array<string, bool>                                                                         $existingPastKeys
     * @param  array                                                                                       $holidays
     * @param  bool                                                                                        $autoHolidays
     * @return array{sessions: array<int, array<string, mixed>>, calculated_end_date: ?string, count: int}
     */
    protected function calculateSessionsPayload(
        ClassSubject $classSubject,
        int $scheduleId,
        array $weeks,
        array $offDays,
        array $extraDays,
        string $startDateStr,
        ?string $endDateStr = null,
        int $teacherId = 0,
        ?int $roomId = null,
        ?int $targetRemainingCount = null,
        ?string $scanStartDateStr = null,
        array $existingPastKeys = [],
        array $holidays = [],
        bool $autoHolidays = true
    ): array {
        $actualScanStart = $scanStartDateStr ?: $startDateStr;

        if (! $actualScanStart) {
            return [
                'sessions'            => [],
                'calculated_end_date' => null,
                'count'               => 0,
            ];
        }

        $scanStart = Carbon::parse($actualScanStart);

        // Tạo map tra cứu nhanh cho off_days và holidays:
        $fullOffDays = [];
        $slotOffDays = [];

        // 1. Áp dụng holidays nếu autoHolidays = true
        if ($autoHolidays && ! empty($holidays)) {
            foreach ($holidays as $h) {
                $hDate = is_array($h) ? ($h['date'] ?? null) : (string) $h;

                if ($hDate) {
                    $fullOffDays[$hDate] = true;
                }
            }
        }

        // 2. Áp dụng off_days (ngày nghỉ riêng của lớp)
        foreach ($offDays as $off) {
            $d = $off['date'] ?? null;

            if (! $d) {
                continue;
            }
            $st = $off['start_time'] ?? null;

            if (empty($st)) {
                $fullOffDays[$d] = true;
            } else {
                $slotOffDays["{$d}_{$st}"] = true;
            }
        }

        $sessions        = [];
        $seenDateTime    = [];
        $lastSessionDate = null;
        $currentDate     = $scanStart->copy();
        $now             = now()->toDateTimeString();

        // 1. Sinh ca học theo chu kỳ tuần (weeks JSON)
        if (! $endDateStr) {
            if ($targetRemainingCount !== null) {
                // Đã xác định số buổi cần tạo (VD: 60 buổi hoặc còn 45 buổi)
                $maxSafetyDate = $scanStart->copy()->addYears(5);

                while (count($sessions) < $targetRemainingCount && $currentDate->lte($maxSafetyDate)) {
                    $dayKey  = (string) $currentDate->dayOfWeekIso; // 1 = Mon .. 7 = Sun
                    $dateStr = $currentDate->format('Y-m-d');

                    if (isset($weeks[$dayKey]) && ! isset($fullOffDays[$dateStr])) {
                        foreach ($weeks[$dayKey] as [$startTime, $endTime]) {
                            $slotKey = "{$dateStr}_{$startTime}";

                            if (! isset($slotOffDays[$slotKey]) && ! isset($seenDateTime[$slotKey]) && ! isset($existingPastKeys[$slotKey])) {
                                $seenDateTime[$slotKey] = true;
                                $sessions[]             = [
                                    'class_subject_id'  => $classSubject->id,
                                    'class_schedule_id' => $scheduleId,
                                    'teacher_id'        => $teacherId,
                                    'room_id'           => $roomId,
                                    'session_date'      => $dateStr,
                                    'start_time'        => $startTime,
                                    'end_time'          => $endTime,
                                    'status'            => 'scheduled',
                                    'topic'             => null,
                                    'note'              => null,
                                    'created_at'        => $now,
                                    'updated_at'        => $now,
                                ];
                                $lastSessionDate = $dateStr;

                                if (count($sessions) >= $targetRemainingCount) {
                                    break 2;
                                }
                            }
                        }
                    }

                    $currentDate->addDay();
                }
            } else {
                // Môn học không cấu hình số buổi -> mặc định 12 tuần
                $endDate = $scanStart->copy()->addWeeks(12);

                while ($currentDate->lte($endDate)) {
                    $dayKey  = (string) $currentDate->dayOfWeekIso;
                    $dateStr = $currentDate->format('Y-m-d');

                    if (isset($weeks[$dayKey]) && ! isset($fullOffDays[$dateStr])) {
                        foreach ($weeks[$dayKey] as [$startTime, $endTime]) {
                            $slotKey = "{$dateStr}_{$startTime}";

                            if (! isset($slotOffDays[$slotKey]) && ! isset($seenDateTime[$slotKey]) && ! isset($existingPastKeys[$slotKey])) {
                                $seenDateTime[$slotKey] = true;
                                $sessions[]             = [
                                    'class_subject_id'  => $classSubject->id,
                                    'class_schedule_id' => $scheduleId,
                                    'teacher_id'        => $teacherId,
                                    'room_id'           => $roomId,
                                    'session_date'      => $dateStr,
                                    'start_time'        => $startTime,
                                    'end_time'          => $endTime,
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
            // Có ngày kết thúc cụ thể
            $endDate = Carbon::parse($endDateStr);

            while ($currentDate->lte($endDate)) {
                $dayKey  = (string) $currentDate->dayOfWeekIso;
                $dateStr = $currentDate->format('Y-m-d');

                if (isset($weeks[$dayKey]) && ! isset($fullOffDays[$dateStr])) {
                    foreach ($weeks[$dayKey] as [$startTime, $endTime]) {
                        $slotKey = "{$dateStr}_{$startTime}";

                        if (! isset($slotOffDays[$slotKey]) && ! isset($seenDateTime[$slotKey]) && ! isset($existingPastKeys[$slotKey])) {
                            $seenDateTime[$slotKey] = true;
                            $sessions[]             = [
                                'class_subject_id'  => $classSubject->id,
                                'class_schedule_id' => $scheduleId,
                                'teacher_id'        => $teacherId,
                                'room_id'           => $roomId,
                                'session_date'      => $dateStr,
                                'start_time'        => $startTime,
                                'end_time'          => $endTime,
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

        // 2. Thêm các buổi học bù cố định (extra_days)
        foreach ($extraDays as $extra) {
            $specDateStr = $extra['date'] ?? null;
            $specStart   = $extra['start_time'] ?? null;
            $specEnd     = $extra['end_time'] ?? null;

            if ($specDateStr && $specStart && $specEnd && $specDateStr >= $actualScanStart) {
                $key = "{$specDateStr}_{$specStart}";

                if (! isset($seenDateTime[$key]) && ! isset($existingPastKeys[$key])) {
                    $seenDateTime[$key] = true;
                    $sessions[]         = [
                        'class_subject_id'  => $classSubject->id,
                        'class_schedule_id' => $scheduleId,
                        'teacher_id'        => $teacherId,
                        'room_id'           => $roomId,
                        'session_date'      => $specDateStr,
                        'start_time'        => $specStart,
                        'end_time'          => $specEnd,
                        'status'            => 'scheduled',
                        'topic'             => 'Buổi học bổ sung / bù',
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

    /**
     * Tái sinh các ca học tương lai khi cấu hình lịch hoặc ngày lễ thay đổi.
     *
     * @param  ClassSchedule      $schedule
     * @return ClassSchedule|null
     */
    public function regenerateFutureSessions(ClassSchedule $schedule): ?ClassSchedule
    {
        $classSubject = $schedule->classSubject;

        if (! $classSubject || $schedule->status !== 'active') {
            return null;
        }

        return DB::transaction(function () use ($schedule, $classSubject) {
            $teacherId = $classSubject->teacher_id;
            $roomId    = $schedule->room_id;
            $startDate = $classSubject->start_date?->format('Y-m-d') ?: now()->toDateString();
            $endDate   = $classSubject->end_date?->format('Y-m-d');
            $subject   = $classSubject->subject;
            $today     = now()->toDateString();

            $pastSessionsCursor = $this->sessionRepository->getPastSessionsCursor($classSubject->id, $today);
            $pastSessionsCount  = 0;
            $pastSessionKeys    = [];

            foreach ($pastSessionsCursor as $ps) {
                $pastSessionsCount++;
                $pDate                                 = $ps->session_date instanceof \DateTimeInterface ? $ps->session_date->format('Y-m-d') : (string) $ps->session_date;
                $pStart                                = substr((string) $ps->start_time, 0, 5);
                $pastSessionKeys["{$pDate}_{$pStart}"] = true;
            }

            $scanStartDate = ($startDate && $startDate > $today) ? $startDate : $today;

            $totalSessions        = $subject?->total_sessions;
            $neededFutureSessions = null;

            if ($totalSessions && $totalSessions > 0) {
                $neededFutureSessions = max(0, $totalSessions - $pastSessionsCount);
            }

            $normalizedWeeks     = $schedule->weeks ?? [];
            $normalizedOffDays   = $schedule->off_days ?? [];
            $normalizedExtraDays = $schedule->extra_days ?? [];
            $autoHolidays        = (bool) ($schedule->auto_holidays ?? true);
            $excludedHolidayIds  = is_array($schedule->excluded_holiday_ids) ? $schedule->excluded_holiday_ids : [];

            $holidays = [];

            if ($autoHolidays) {
                $maxScanEnd      = ! empty($endDate) ? $endDate : now()->addYears(2)->toDateString();
                $holidaysInRange = $this->holidayRepository->getInRange($startDate, $maxScanEnd);
                $excludedSet     = array_flip(array_map('intval', $excludedHolidayIds));
                $holidays        = $holidaysInRange
                    ->filter(fn ($h) => ! isset($excludedSet[(int) $h->id]))
                    ->map(fn ($h) => [
                        'id'   => $h->id,
                        'name' => $h->name,
                        'date' => $h->date instanceof \DateTimeInterface ? $h->date->format('Y-m-d') : (string) $h->date,
                    ])->values()->toArray();

                $schedule->update(['holidays' => $holidays]);
            }

            $sessionResult = $this->calculateSessionsPayload(
                $classSubject,
                $schedule->id,
                $normalizedWeeks,
                $normalizedOffDays,
                $normalizedExtraDays,
                $startDate,
                $endDate,
                (int) $teacherId,
                $roomId,
                $neededFutureSessions,
                $scanStartDate,
                $pastSessionKeys,
                $holidays,
                $autoHolidays
            );

            $this->syncSessionsWithChunking(
                $classSubject->id,
                $sessionResult['sessions'],
                $scanStartDate
            );

            $lastSession = $this->sessionRepository->getLatestSession($classSubject->id);

            $finalEndDate = ! empty($endDate)
                ? $endDate
                : ($lastSession?->session_date instanceof \DateTimeInterface
                    ? $lastSession->session_date->format('Y-m-d')
                    : ($lastSession?->session_date ?: $sessionResult['calculated_end_date']));

            $this->scheduleRepository->updateClassSubject($classSubject->id, [
                'end_date' => $finalEndDate,
            ]);

            if ($classSubject->schoolClass) {
                $this->syncSchoolClassDates($classSubject->schoolClass, $startDate, $finalEndDate);
            }

            return $schedule->refresh();
        });
    }
}
