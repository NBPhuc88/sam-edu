<?php

namespace App\Services\Class;

use App\Models\Admin;
use App\Models\SchoolClass;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Subject\SubjectRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SchoolClassService implements SchoolClassServiceInterface
{
    public function __construct(
        protected SchoolClassRepositoryInterface $schoolClassRepository,
        protected CenterRepositoryInterface $centerRepository,
        protected SubjectRepositoryInterface $subjectRepository,
        protected TeacherRepositoryInterface $teacherRepository
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
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedClasses(
        ?string $search = null,
        ?int $centerId = null,
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

        return $this->schoolClassRepository->paginate(
            $search,
            $centerIds,
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
            'centers'  => $allowedCenterIds !== null ? $this->centerRepository->getByIds($allowedCenterIds, ['id', 'name', 'code']) : $this->centerRepository->getActiveCenters(),
            'subjects' => $this->subjectRepository->getByCenterIds($allowedCenterIds),
            'teachers' => $this->teacherRepository->getActiveTeachers($allowedCenterIds, ['id', 'full_name', 'teacher_code', 'center_id', 'phone']),
        ];
    }

    /**
     * @param  int              $id
     * @param  ?Admin           $admin
     * @return SchoolClass|null
     */
    public function findClass(int $id, ?Admin $admin = null): ?SchoolClass
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $schoolClass      = $this->schoolClassRepository->find($id, $allowedCenterIds);

        if (! $schoolClass) {
            throw new NotFoundHttpException('Không tìm thấy lớp học hoặc bạn không có quyền truy cập.');
        }

        return $schoolClass;
    }

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return SchoolClass
     */
    public function createClass(array $data, ?Admin $admin = null): SchoolClass
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $centerId         = (int) $data['center_id'];

        if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền thêm lớp học vào Trung tâm này.');
        }

        $code = trim($data['code'] ?? '');

        if (empty($code)) {
            $count = $this->schoolClassRepository->countByCenterIds([$centerId]) + 1;
            $code  = 'LH' . str_pad((string) $count, 3, '0', STR_PAD_LEFT);

            while ($this->schoolClassRepository->codeExists($centerId, $code)) {
                $count++;
                $code = 'LH' . str_pad((string) $count, 3, '0', STR_PAD_LEFT);
            }
        }

        $status = 1;

        if (isset($data['status'])) {
            if (is_numeric($data['status'])) {
                $status = (int) $data['status'];
            } elseif ($data['status'] === 'inactive') {
                $status = 0;
            } elseif ($data['status'] === 'completed') {
                $status = 2;
            } else {
                $status = 1;
            }
        }

        $schoolClass = $this->schoolClassRepository->create([
            'center_id'    => $centerId,
            'code'         => $code,
            'name'         => trim($data['name']),
            'description'  => $data['description'] ?? null,
            'max_students' => ! empty($data['max_students']) ? (int) $data['max_students'] : null,
            'start_date'   => ! empty($data['start_date']) ? $data['start_date'] : null,
            'end_date'     => ! empty($data['end_date']) ? $data['end_date'] : null,
            'status'       => $status,
        ]);

        // Gán danh sách môn học và giáo viên phụ trách
        if (isset($data['subjects']) && is_array($data['subjects'])) {
            $this->schoolClassRepository->syncClassSubjects($schoolClass, $data['subjects']);
        }

        return $schoolClass;
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return SchoolClass
     */
    public function updateClass(int $id, array $data, ?Admin $admin = null): SchoolClass
    {
        $schoolClass = $this->findClass($id, $admin);

        if (isset($data['center_id'])) {
            $centerId         = (int) $data['center_id'];
            $allowedCenterIds = $this->getAllowedCenterIds($admin);

            if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                throw new AccessDeniedHttpException('Bạn không có quyền chuyển lớp học sang Trung tâm này.');
            }
        }

        $status = $schoolClass->status;

        if (isset($data['status'])) {
            if (is_numeric($data['status'])) {
                $status = (int) $data['status'];
            } elseif ($data['status'] === 'inactive') {
                $status = 0;
            } elseif ($data['status'] === 'completed') {
                $status = 2;
            } else {
                $status = 1;
            }
        }

        $updatedClass = $this->schoolClassRepository->update($id, [
            'center_id'    => $data['center_id'] ?? $schoolClass->center_id,
            'code'         => isset($data['code']) ? trim($data['code']) : $schoolClass->code,
            'name'         => isset($data['name']) ? trim($data['name']) : $schoolClass->name,
            'description'  => array_key_exists('description', $data) ? $data['description'] : $schoolClass->description,
            'max_students' => array_key_exists('max_students', $data) ? (! empty($data['max_students']) ? (int) $data['max_students'] : null) : $schoolClass->max_students,
            'start_date'   => array_key_exists('start_date', $data) ? (! empty($data['start_date']) ? $data['start_date'] : null) : $schoolClass->start_date,
            'end_date'     => array_key_exists('end_date', $data) ? (! empty($data['end_date']) ? $data['end_date'] : null) : $schoolClass->end_date,
            'status'       => $status,
        ]);

        // Cập nhật danh sách môn học và giáo viên phụ trách
        if (isset($data['subjects']) && is_array($data['subjects'])) {
            $this->schoolClassRepository->syncClassSubjects($updatedClass, $data['subjects']);
        }

        return $updatedClass;
    }

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteClass(int $id, ?Admin $admin = null): bool
    {
        $schoolClass = $this->findClass($id, $admin);

        return $this->schoolClassRepository->delete($schoolClass->id);
    }

    public function getClassWithCenter(int $classId, ?Admin $admin = null): SchoolClass
    {
        if ($admin !== null) {
            $schoolClass = $this->findClass($classId, $admin);

            return $this->schoolClassRepository->findWithCenter($schoolClass->id);
        }

        return $this->schoolClassRepository->findWithCenter($classId);
    }

    public function getPaginatedClassStudents(int $classId, ?string $search = null, int $perPage = 15, int $page = 1, ?Admin $admin = null): LengthAwarePaginator
    {
        $schoolClass = $this->getClassWithCenter($classId, $admin);

        return $this->schoolClassRepository->getPaginatedClassStudents($schoolClass, $search, $perPage, $page);
    }

    /**
     * @param  int                  $classId
     * @param  ?string              $weekDate
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getClassTimetableData(int $classId, ?string $weekDate = null, ?Admin $admin = null): array
    {
        $schoolClass = $this->findClass($classId, $admin);

        // Nạp đầy đủ thông tin môn học và giáo viên
        $schoolClass->load([
            'center:id,name,code',
            'classSubjects:id,class_id,subject_id,teacher_id,status',
            'classSubjects.subject:id,name,code,total_sessions,duration_minutes,tuition_fee',
            'classSubjects.teacher:id,full_name,teacher_code,phone',
        ]);

        $baseDate    = $weekDate ? Carbon::parse($weekDate) : Carbon::today();
        $startOfWeek = $baseDate->copy()->startOfWeek(Carbon::MONDAY);
        $endOfWeek   = $baseDate->copy()->endOfWeek(Carbon::SUNDAY);

        // 7 ngày trong tuần
        $weekDays = [];
        $dayNames = [
            1 => 'Thứ 2',
            2 => 'Thứ 3',
            3 => 'Thứ 4',
            4 => 'Thứ 5',
            5 => 'Thứ 6',
            6 => 'Thứ 7',
            7 => 'Chủ Nhật',
        ];

        for ($i = 0; $i < 7; $i++) {
            $day        = $startOfWeek->copy()->addDays($i);
            $isoWeekday = $day->dayOfWeekIso; // 1 to 7

            $weekDays[] = [
                'weekday_number' => $isoWeekday,
                'weekday_label'  => $dayNames[$isoWeekday] ?? "Thứ {$isoWeekday}",
                'date_formatted' => $day->format('d-m-Y'),
                'date_raw'       => $day->format('Y-m-d'),
                'is_today'       => $day->isToday(),
            ];
        }

        $startDateStr = $startOfWeek->format('Y-m-d');
        $endDateStr   = $endOfWeek->format('Y-m-d');

        // Lấy danh sách ca học thực tế trong tuần (bao gồm cả ca học có old_date thuộc tuần này)
        $rawSessions = $this->schoolClassRepository->getClassSessionsBetweenDates(
            $classId,
            $startDateStr,
            $endDateStr
        );

        $processedSessions = [];

        foreach ($rawSessions as $session) {
            $sessionDateStr = $session->session_date ? Carbon::parse($session->session_date)->format('Y-m-d') : '';

            // 1. Nếu có lịch sử đổi lịch mà old_date nằm trong tuần này, thêm slot cũ (đã dời) vào timetable
            if ($session->reschedules && $session->reschedules->isNotEmpty()) {
                foreach ($session->reschedules as $reschedule) {
                    $oldDateStr = $reschedule->old_date ? Carbon::parse($reschedule->old_date)->format('Y-m-d') : '';
                    $newDateStr = $reschedule->new_date ? Carbon::parse($reschedule->new_date)->format('Y-m-d') : '';

                    if ($oldDateStr >= $startDateStr && $oldDateStr <= $endDateStr) {
                        $oldStartTime = substr((string) $reschedule->old_start_time, 0, 5);
                        $oldEndTime   = substr((string) $reschedule->old_end_time, 0, 5);
                        $newStartTime = substr((string) $reschedule->new_start_time, 0, 5);
                        $newEndTime   = substr((string) $reschedule->new_end_time, 0, 5);

                        $processedSessions[] = [
                            'id'                      => "rescheduled-old-{$session->id}-{$reschedule->id}",
                            'original_session_id'     => $session->id,
                            'class_subject_id'        => $session->class_subject_id,
                            'teacher_id'              => $session->teacher_id,
                            'room_id'                 => $reschedule->old_room_id ?? $session->room_id,
                            'session_date'            => $oldDateStr,
                            'start_time'              => $oldStartTime,
                            'end_time'                => $oldEndTime,
                            'status'                  => 'rescheduled',
                            'topic'                   => $session->topic,
                            'note'                    => $session->note,
                            'is_rescheduled_old_slot' => true,
                            'reschedule_info'         => [
                                'new_date'       => Carbon::parse($newDateStr)->format('d-m-Y'),
                                'new_start_time' => $newStartTime,
                                'new_end_time'   => $newEndTime,
                                'reason'         => $reschedule->reason,
                            ],
                            'class_subject' => $session->classSubject,
                            'teacher'       => $session->teacher,
                            'room'          => $reschedule->oldRoom ?? $session->room,
                        ];
                    }
                }
            }

            // 2. Thêm ca học ở new_date (nếu session_date nằm trong tuần này)
            if ($sessionDateStr >= $startDateStr && $sessionDateStr <= $endDateStr) {
                $sessionArr = $session->toArray();

                if ($session->reschedules && $session->reschedules->isNotEmpty()) {
                    $latestReschedule = $session->reschedules->first();
                    $oldDateStr       = $latestReschedule->old_date ? Carbon::parse($latestReschedule->old_date)->format('Y-m-d') : '';
                    $oldStartTime     = substr((string) $latestReschedule->old_start_time, 0, 5);
                    $oldEndTime       = substr((string) $latestReschedule->old_end_time, 0, 5);

                    $sessionArr['is_rescheduled_new_slot'] = true;

                    // Tại ngày mới (new_date), ca học là ca dự kiến diễn ra
                    if ($sessionArr['status'] === 'rescheduled') {
                        $sessionArr['status'] = 'scheduled';
                    }

                    $sessionArr['reschedule_from_info'] = [
                        'old_date'       => Carbon::parse($oldDateStr)->format('d-m-Y'),
                        'old_start_time' => $oldStartTime,
                        'old_end_time'   => $oldEndTime,
                        'reason'         => $latestReschedule->reason,
                    ];
                }

                $processedSessions[] = $sessionArr;
            }
        }

        // Lấy lịch học cố định hàng tuần
        $recurringSchedules = $this->schoolClassRepository->getClassWeeklySchedules($classId);

        // Trích xuất các khung giờ học (Time slots) duy nhất
        $timeSlotSet = [];

        foreach ($processedSessions as $sessItem) {
            $start = substr((string) $sessItem['start_time'], 0, 5);
            $end   = substr((string) $sessItem['end_time'], 0, 5);
            $key   = "{$start} - {$end}";

            $timeSlotSet[$key] = [
                'start_time' => $start,
                'end_time'   => $end,
                'label'      => $key,
            ];
        }

        foreach ($recurringSchedules as $schedule) {
            $start = substr((string) $schedule->start_time, 0, 5);
            $end   = substr((string) $schedule->end_time, 0, 5);
            $key   = "{$start} - {$end}";

            $timeSlotSet[$key] = [
                'start_time' => $start,
                'end_time'   => $end,
                'label'      => $key,
            ];
        }

        // Sắp xếp các time slots theo start_time
        uasort($timeSlotSet, function ($a, $b) {
            return strcmp($a['start_time'], $b['start_time']);
        });

        return [
            'schoolClass'        => $schoolClass,
            'weekDays'           => $weekDays,
            'startOfWeek'        => $startOfWeek->format('Y-m-d'),
            'endOfWeek'          => $endOfWeek->format('Y-m-d'),
            'prevWeek'           => $startOfWeek->copy()->subWeek()->format('Y-m-d'),
            'nextWeek'           => $startOfWeek->copy()->addWeek()->format('Y-m-d'),
            'currentWeek'        => Carbon::today()->format('Y-m-d'),
            'selectedDate'       => $baseDate->format('Y-m-d'),
            'timeSlots'          => array_values($timeSlotSet),
            'sessions'           => $processedSessions,
            'recurringSchedules' => $recurringSchedules,
        ];
    }
}
