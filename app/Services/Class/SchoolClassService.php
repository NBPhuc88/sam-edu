<?php

namespace App\Services\Class;

use App\Models\Admin;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
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
     * @param  ?Teacher        $teacher
     * @return array<int>|null Null nghĩa là Super Admin (truy cập toàn bộ)
     */
    protected function getAllowedCenterIds(?Admin $admin, ?Teacher $teacher = null): ?array
    {
        if (! $admin && ! $teacher) {
            $admin = \Illuminate\Support\Facades\Auth::guard('admin')->user();

            if (! $admin) {
                $teacher = \Illuminate\Support\Facades\Auth::guard('teacher')->user();
            }
        }

        if ($admin) {
            if ($admin->isSuperAdmin()) {
                return null; // All centers
            }

            return $admin->centers()->pluck('centers.id')->toArray();
        }

        if ($teacher) {
            return $teacher->center_id ? [(int) $teacher->center_id] : [];
        }

        return null;
    }

    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @return LengthAwarePaginator
     */
    public function getPaginatedClasses(
        ?string $search = null,
        ?int $centerId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null,
        ?Teacher $teacher = null
    ): LengthAwarePaginator {
        $allowedCenterIds = $this->getAllowedCenterIds($admin, $teacher);

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
            $page,
            $teacher?->id
        );
    }

    /**
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null, ?Teacher $teacher = null): array
    {
        if ($teacher) {
            $allowedCenterIds = $teacher->center_id ? [(int) $teacher->center_id] : [];

            return [
                'centers'  => $this->centerRepository->getByIds($allowedCenterIds, ['id', 'name', 'code']),
                'subjects' => $this->subjectRepository->getByCenterIds($allowedCenterIds),
                'teachers' => $this->teacherRepository->getActiveTeachers($allowedCenterIds, ['id', 'full_name', 'teacher_code', 'center_id', 'phone']),
            ];
        }

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
     * @param  ?Teacher         $teacher
     * @return SchoolClass|null
     */
    public function findClass(int $id, ?Admin $admin = null, ?Teacher $teacher = null): ?SchoolClass
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin, $teacher);
        $schoolClass      = $this->schoolClassRepository->find($id, $allowedCenterIds);

        if (! $schoolClass) {
            throw new NotFoundHttpException('Không tìm thấy lớp học hoặc bạn không có quyền truy cập.');
        }

        if ($teacher) {
            $isAssigned = $schoolClass->classSubjects()->where('teacher_id', $teacher->id)->exists();

            if (! $isAssigned) {
                throw new NotFoundHttpException('Không tìm thấy lớp học hoặc bạn không có quyền truy cập.');
            }
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
            } elseif ($data['status'] === 'inactive' || $data['status'] === 'paused') {
                $status = 0;
            } elseif ($data['status'] === 'completed') {
                $status = 2;
            } elseif ($data['status'] === 'closed') {
                $status = 3;
            } else {
                $status = 1;
            }
        }

        // Kiểm tra giới hạn số lớp đang hoạt động và tạm dừng (status 0, 1) không vượt quá max_classes
        if (in_array($status, [0, 1], true)) {
            $center = $this->centerRepository->find($centerId);

            if ($center && $center->max_classes !== null) {
                $activePausedClassesCount = SchoolClass::where('center_id', $centerId)
                    ->whereIn('status', [0, 1])
                    ->count();

                if ($activePausedClassesCount >= $center->max_classes) {
                    throw new \InvalidArgumentException("Số lớp học đang hoạt động và tạm dừng ({$activePausedClassesCount}) đã đạt tối đa giới hạn ({$center->max_classes}) của gói dịch vụ. Vui lòng hoàn thành hoặc đóng lớp cũ để tạo thêm.");
                }
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

        $currentStatusInt = is_object($schoolClass->status) ? $schoolClass->status->value : (int) $schoolClass->status;
        $newStatus        = $currentStatusInt;

        if (isset($data['status'])) {
            if (is_numeric($data['status'])) {
                $newStatus = (int) $data['status'];
            } elseif ($data['status'] === 'inactive' || $data['status'] === 'paused') {
                $newStatus = 0;
            } elseif ($data['status'] === 'completed') {
                $newStatus = 2;
            } elseif ($data['status'] === 'closed') {
                $newStatus = 3;
            } else {
                $newStatus = 1;
            }
        }

        // Lớp học đã hoàn thành (2) hoặc đã đóng (3) không thể chuyển sang trạng thái khác (trừ Super Admin)
        if (in_array($currentStatusInt, [2, 3], true) && $newStatus !== $currentStatusInt) {
            if (! ($admin && $admin->isSuperAdmin())) {
                throw new AccessDeniedHttpException('Lớp học đã hoàn thành hoặc đã đóng chỉ có Super Admin mới có quyền mở lại.');
            }
        }

        // Nếu chuyển từ Hoàn thành/Đóng (2, 3) sang Hoạt động/Tạm dừng (0, 1), kiểm tra giới hạn max_classes
        $centerId = (int) ($data['center_id'] ?? $schoolClass->center_id);

        if (in_array($currentStatusInt, [2, 3], true) && in_array($newStatus, [0, 1], true)) {
            $center = $this->centerRepository->find($centerId);

            if ($center && $center->max_classes !== null) {
                $activePausedClassesCount = SchoolClass::where('center_id', $centerId)
                    ->where('id', '!=', $schoolClass->id)
                    ->whereIn('status', [0, 1])
                    ->count();

                if ($activePausedClassesCount >= $center->max_classes) {
                    throw new \InvalidArgumentException("Số lớp học đang hoạt động và tạm dừng ({$activePausedClassesCount}) đã đạt tối đa giới hạn ({$center->max_classes}) của gói dịch vụ. Vui lòng hoàn thành hoặc đóng lớp cũ để mở lại lớp này.");
                }
            }
        }

        $updatedClass = \Illuminate\Support\Facades\DB::transaction(function () use ($id, $data, $schoolClass, $newStatus, $currentStatusInt, $centerId) {
            $updated = $this->schoolClassRepository->update($id, [
                'center_id'    => $data['center_id'] ?? $schoolClass->center_id,
                'code'         => isset($data['code']) ? trim($data['code']) : $schoolClass->code,
                'name'         => isset($data['name']) ? trim($data['name']) : $schoolClass->name,
                'description'  => array_key_exists('description', $data) ? $data['description'] : $schoolClass->description,
                'max_students' => array_key_exists('max_students', $data) ? (! empty($data['max_students']) ? (int) $data['max_students'] : null) : $schoolClass->max_students,
                'start_date'   => array_key_exists('start_date', $data) ? (! empty($data['start_date']) ? $data['start_date'] : null) : $schoolClass->start_date,
                'end_date'     => array_key_exists('end_date', $data) ? (! empty($data['end_date']) ? $data['end_date'] : null) : $schoolClass->end_date,
                'status'       => $newStatus,
            ]);

            // Cập nhật danh sách môn học và giáo viên phụ trách
            if (isset($data['subjects']) && is_array($data['subjects'])) {
                $this->schoolClassRepository->syncClassSubjects($updated, $data['subjects']);
            }

            // Tự động đồng bộ trạng thái học sinh nếu trạng thái lớp thay đổi
            if ($newStatus !== $currentStatusInt) {
                $this->cascadeClassStatusToStudents($id, $centerId, $newStatus);
            }

            return $updated;
        });

        return $updatedClass;
    }

    /**
     * Đồng bộ trạng thái lớp học sang các học sinh cô lập (chỉ học lớp này, không học lớp active nào khác).
     * @param int $classId
     * @param int $centerId
     * @param int $newClassStatus
     */
    protected function cascadeClassStatusToStudents(int $classId, int $centerId, int $newClassStatus): void
    {
        $studentIdsInClass = \Illuminate\Support\Facades\DB::table('class_students')
            ->where('class_id', $classId)
            ->pluck('student_id')
            ->toArray();

        if (empty($studentIdsInClass)) {
            return;
        }

        // Tìm các học sinh CÒN đang học ở lớp khác ĐANG HOẠT ĐỘNG (status = 1)
        $multiActiveStudentIds = \Illuminate\Support\Facades\DB::table('class_students as cs')
            ->join('classes as c', 'c.id', '=', 'cs.class_id')
            ->whereIn('cs.student_id', $studentIdsInClass)
            ->where('c.id', '!=', $classId)
            ->where('c.center_id', $centerId)
            ->where('c.status', 1)
            ->whereNull('c.deleted_at')
            ->pluck('cs.student_id')
            ->unique()
            ->toArray();

        // Danh sách học sinh chỉ thuộc duy nhất lớp này
        $isolatedStudentIds = array_values(array_diff($studentIdsInClass, $multiActiveStudentIds));

        if (empty($isolatedStudentIds)) {
            return;
        }

        // 1 câu lệnh SQL duy nhất cập nhật trạng thái học sinh tương ứng
        if ($newClassStatus === 0 || $newClassStatus === 3) {
            \Illuminate\Support\Facades\DB::table('students')
                ->whereIn('id', $isolatedStudentIds)
                ->where('status', 1)
                ->update(['status' => 0]);
        } elseif ($newClassStatus === 2) {
            \Illuminate\Support\Facades\DB::table('students')
                ->whereIn('id', $isolatedStudentIds)
                ->where('status', 1)
                ->update(['status' => 2]);
        } elseif ($newClassStatus === 1) {
            \Illuminate\Support\Facades\DB::table('students')
                ->whereIn('id', $isolatedStudentIds)
                ->whereIn('status', [0, 2])
                ->update(['status' => 1]);
        }
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

    public function getClassWithCenter(int $classId, ?Admin $admin = null, ?Teacher $teacher = null): SchoolClass
    {
        if ($admin !== null || $teacher !== null) {
            $schoolClass = $this->findClass($classId, $admin, $teacher);

            return $this->schoolClassRepository->findWithCenter($schoolClass->id);
        }

        return $this->schoolClassRepository->findWithCenter($classId);
    }

    public function getPaginatedClassStudents(int $classId, ?string $search = null, int $perPage = 15, int $page = 1, ?Admin $admin = null, ?Teacher $teacher = null): LengthAwarePaginator
    {
        $schoolClass = $this->getClassWithCenter($classId, $admin, $teacher);

        return $this->schoolClassRepository->getPaginatedClassStudents($schoolClass, $search, $perPage, $page);
    }

    /**
     * @param  int                  $classId
     * @param  ?string              $weekDate
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @return array<string, mixed>
     */
    public function getClassTimetableData(int $classId, ?string $weekDate = null, ?Admin $admin = null, ?Teacher $teacher = null): array
    {
        $schoolClass = $this->findClass($classId, $admin, $teacher);

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

        if ($teacher !== null) {
            $schoolClass->setRelation(
                'classSubjects',
                $schoolClass->classSubjects->filter(fn ($cs) => (int) $cs->teacher_id === (int) $teacher->id)->values()
            );

            $rawSessions = $rawSessions->filter(function ($s) use ($teacher) {
                $sessionTeacherId = $s->teacher_id ?: $s->classSubject?->teacher_id;

                return (int) $sessionTeacherId === (int) $teacher->id;
            });
        }

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

        if ($teacher !== null) {
            $recurringSchedules = $recurringSchedules->filter(function ($sc) use ($teacher) {
                $scTeacherId = $sc->class_subject?->teacher_id ?? $sc->classSubject?->teacher_id;

                return (int) $scTeacherId === (int) $teacher->id;
            });
        }

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

    public function getAvailableStudents(int $classId, ?string $search = null, ?Admin $admin = null): \Illuminate\Database\Eloquent\Collection
    {
        $schoolClass = $this->findClass($classId, $admin);

        return $this->schoolClassRepository->getAvailableStudentsForClass($classId, (int) $schoolClass->center_id, $search);
    }

    public function addStudentsToClass(int $classId, array $studentIds, ?Admin $admin = null): int
    {
        $schoolClass = $this->findClass($classId, $admin);

        // Lọc danh sách học sinh chỉ thuộc cùng trung tâm của lớp
        $validStudentIds = Student::where('center_id', $schoolClass->center_id)
            ->whereIn('id', $studentIds)
            ->pluck('id')
            ->toArray();

        return $this->schoolClassRepository->attachStudents($classId, $validStudentIds);
    }

    public function removeStudentFromClass(int $classId, int $studentId, ?Admin $admin = null): bool
    {
        $this->findClass($classId, $admin);

        return $this->schoolClassRepository->detachStudent($classId, $studentId);
    }
}
