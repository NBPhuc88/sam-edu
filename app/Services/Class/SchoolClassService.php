<?php

namespace App\Services\Class;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\ClassSession;
use App\Models\SchoolClass;
use App\Models\SessionReschedule;
use App\Models\Student;
use App\Models\StudentTuition;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Subject\SubjectRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
     * @param  ?Student             $student
     * @return LengthAwarePaginator
     */
    public function getPaginatedClasses(
        ?string $search = null,
        ?int $centerId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        ?Admin $admin = null,
        ?Teacher $teacher = null,
        ?Student $student = null
    ): LengthAwarePaginator {
        if ($student) {
            return $this->schoolClassRepository->paginate(
                $search,
                $student->center_id ? [(int) $student->center_id] : null,
                $status,
                $perPage,
                $page,
                null,
                $student->id
            );
        }

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
     * @param  ?Student             $student
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null, ?Teacher $teacher = null, ?Student $student = null): array
    {
        if ($student) {
            $allowedCenterIds = $student->center_id ? [(int) $student->center_id] : [];

            return [
                'centers'  => $this->centerRepository->getByIds($allowedCenterIds, ['id', 'name', 'code']),
                'subjects' => [],
                'teachers' => [],
            ];
        }

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
        if (! $admin && ! $teacher) {
            /** @var Admin|null $authAdmin */
            $authAdmin = Auth::guard('admin')->user();
            $admin     = $authAdmin;

            if (! $admin) {
                /** @var Teacher|null $authTeacher */
                $authTeacher = Auth::guard('teacher')->user();
                $teacher     = $authTeacher;
            }
        }

        if ($admin) {
            $allowedCenterIds = $this->getAllowedCenterIds($admin);
            $schoolClass      = $this->schoolClassRepository->find($id, $allowedCenterIds);

            if (! $schoolClass) {
                throw new NotFoundHttpException('Không tìm thấy lớp học hoặc bạn không có quyền truy cập.');
            }

            return $schoolClass;
        }

        if ($teacher) {
            $schoolClass = $this->schoolClassRepository->find($id);

            if (! $schoolClass) {
                throw new NotFoundHttpException('Không tìm thấy lớp học hoặc bạn không có quyền truy cập.');
            }

            $isAssigned = $schoolClass->classSubjects()->where('teacher_id', $teacher->id)->exists()
                || ClassSession::where('teacher_id', $teacher->id)
                    ->whereHas('classSubject', fn ($q) => $q->where('class_id', $schoolClass->id))
                    ->exists()
                || SessionReschedule::where('new_teacher_id', $teacher->id)
                    ->whereHas('session.classSubject', fn ($q) => $q->where('class_id', $schoolClass->id))
                    ->exists();

            $isSameCenter = $teacher->center_id && (int) $schoolClass->center_id === (int) $teacher->center_id;

            if (! $isAssigned && ! $isSameCenter) {
                throw new NotFoundHttpException('Không tìm thấy lớp học hoặc bạn không có quyền truy cập.');
            }

            return $schoolClass;
        }

        $schoolClass = $this->schoolClassRepository->find($id);

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
            $count = $this->schoolClassRepository->nextId();
            $code  = Constant::PREFIX_CLASS . str_pad((string) $count, Constant::CODE_PAD_LENGTH, Constant::CODE_PAD_CHAR, STR_PAD_LEFT);

            while ($this->schoolClassRepository->codeExists($code)) {
                $count++;
                $code = Constant::PREFIX_CLASS . str_pad((string) $count, Constant::CODE_PAD_LENGTH, Constant::CODE_PAD_CHAR, STR_PAD_LEFT);
            }
        }

        $status = Constant::CLASS_STATUS_ACTIVE;

        if (isset($data['status'])) {
            if (is_numeric($data['status'])) {
                $status = (int) $data['status'];
            } elseif ($data['status'] === 'inactive' || $data['status'] === 'paused') {
                $status = Constant::CLASS_STATUS_INACTIVE;
            } elseif ($data['status'] === 'completed') {
                $status = Constant::CLASS_STATUS_COMPLETED;
            } elseif ($data['status'] === 'closed') {
                $status = Constant::CLASS_STATUS_CLOSED;
            } else {
                $status = Constant::CLASS_STATUS_ACTIVE;
            }
        }

        // Kiểm tra giới hạn số lớp đang hoạt động và tạm dừng không vượt quá max_classes
        if (in_array($status, [Constant::CLASS_STATUS_INACTIVE, Constant::CLASS_STATUS_ACTIVE], true)) {
            $center = $this->centerRepository->find($centerId);

            if ($center && $center->max_classes !== null) {
                $activePausedClassesCount = SchoolClass::where('center_id', $centerId)
                    ->whereIn('status', [Constant::CLASS_STATUS_INACTIVE, Constant::CLASS_STATUS_ACTIVE])
                    ->count();

                if ($activePausedClassesCount >= $center->max_classes) {
                    throw ValidationException::withMessages([
                        'name' => "Số lớp học đang hoạt động và tạm dừng ({$activePausedClassesCount}) đã đạt tối đa giới hạn ({$center->max_classes}) của gói dịch vụ. Vui lòng hoàn thành hoặc đóng lớp cũ để tạo thêm.",
                    ]);
                }
            }
        }

        if ($status !== Constant::CLASS_STATUS_ACTIVE && isset($data['subjects']) && is_array($data['subjects'])) {
            $hasSubject = false;

            foreach ($data['subjects'] as $row) {
                if (! empty($row['subject_id'])) {
                    $hasSubject = true;

                    break;
                }
            }

            if ($hasSubject) {
                throw ValidationException::withMessages([
                    'subjects' => 'Chỉ lớp học ở trạng thái Đang hoạt động mới có thể thêm môn học.',
                ]);
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
        if ($status === Constant::CLASS_STATUS_ACTIVE && isset($data['subjects']) && is_array($data['subjects'])) {
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
                $newStatus = Constant::CLASS_STATUS_INACTIVE;
            } elseif ($data['status'] === 'completed') {
                $newStatus = Constant::CLASS_STATUS_COMPLETED;
            } elseif ($data['status'] === 'closed') {
                $newStatus = Constant::CLASS_STATUS_CLOSED;
            } else {
                $newStatus = Constant::CLASS_STATUS_ACTIVE;
            }
        }

        // Kiểm tra không cho sửa môn khi lớp không ở trạng thái hoạt động
        if ($currentStatusInt !== Constant::CLASS_STATUS_ACTIVE && isset($data['subjects']) && is_array($data['subjects'])) {
            $existingSubjectIds = $schoolClass->classSubjects()->pluck('subject_id')->toArray();
            $newSubjectIds      = array_filter(array_map('intval', array_column($data['subjects'], 'subject_id')));
            sort($existingSubjectIds);
            sort($newSubjectIds);

            if ($existingSubjectIds !== $newSubjectIds) {
                throw ValidationException::withMessages([
                    'subjects' => 'Chỉ lớp học ở trạng thái Đang hoạt động mới có thể thêm hoặc thay đổi môn học.',
                ]);
            }
        }

        // Lớp học đã hoàn thành hoặc đã đóng không thể chuyển sang trạng thái khác (trừ Super Admin)
        if (in_array($currentStatusInt, [Constant::CLASS_STATUS_COMPLETED, Constant::CLASS_STATUS_CLOSED], true) && $newStatus !== $currentStatusInt) {
            if (! ($admin && $admin->isSuperAdmin())) {
                throw new AccessDeniedHttpException('Lớp học đã hoàn thành hoặc đã đóng chỉ có Admin hệ thống mới có quyền mở lại.');
            }
        }

        // Nếu chuyển từ Hoàn thành/Đóng sang Hoạt động/Tạm dừng, kiểm tra giới hạn max_classes
        $centerId = (int) ($data['center_id'] ?? $schoolClass->center_id);

        if (in_array($currentStatusInt, [Constant::CLASS_STATUS_COMPLETED, Constant::CLASS_STATUS_CLOSED], true) && in_array($newStatus, [Constant::CLASS_STATUS_INACTIVE, Constant::CLASS_STATUS_ACTIVE], true)) {
            $center = $this->centerRepository->find($centerId);

            if ($center && $center->max_classes !== null) {
                $activePausedClassesCount = SchoolClass::where('center_id', $centerId)
                    ->where('id', '!=', $schoolClass->id)
                    ->whereIn('status', [Constant::CLASS_STATUS_INACTIVE, Constant::CLASS_STATUS_ACTIVE])
                    ->count();

                if ($activePausedClassesCount >= $center->max_classes) {
                    throw ValidationException::withMessages([
                        'status' => "Số lớp học đang hoạt động và tạm dừng ({$activePausedClassesCount}) đã đạt tối đa giới hạn ({$center->max_classes}) của gói dịch vụ. Vui lòng hoàn thành hoặc đóng lớp cũ để mở lại lớp này.",
                    ]);
                }
            }
        }

        $updatedClass = DB::transaction(function () use ($id, $data, $schoolClass, $newStatus, $currentStatusInt, $centerId) {
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

            // Đồng bộ học phí cho học sinh nếu được yêu cầu
            if (! empty($data['update_student_tuitions'])) {
                $this->updateClassStudentsTuitions($updated->fresh());
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
            ->where('c.status', Constant::CLASS_STATUS_ACTIVE)
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
        if ($newClassStatus === Constant::CLASS_STATUS_INACTIVE || $newClassStatus === Constant::CLASS_STATUS_CLOSED) {
            DB::table('students')
                ->whereIn('id', $isolatedStudentIds)
                ->where('status', Constant::STUDENT_STATUS_ACTIVE)
                ->update(['status' => Constant::STUDENT_STATUS_INACTIVE]);
        } elseif ($newClassStatus === Constant::CLASS_STATUS_COMPLETED) {
            DB::table('students')
                ->whereIn('id', $isolatedStudentIds)
                ->where('status', Constant::STUDENT_STATUS_ACTIVE)
                ->update(['status' => Constant::STUDENT_STATUS_GRADUATED]);
        } elseif ($newClassStatus === Constant::CLASS_STATUS_ACTIVE) {
            DB::table('students')
                ->whereIn('id', $isolatedStudentIds)
                ->whereIn('status', [Constant::STUDENT_STATUS_INACTIVE, Constant::STUDENT_STATUS_GRADUATED])
                ->update(['status' => Constant::STUDENT_STATUS_ACTIVE]);
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

    public function getPaginatedClassStudents(int $classId, ?string $search = null, int $perPage = Constant::DEFAULT_PER_PAGE, int $page = Constant::DEFAULT_PAGE, ?Admin $admin = null, ?Teacher $teacher = null): LengthAwarePaginator
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

            $latestReschedule = ($session->reschedules && $session->reschedules->isNotEmpty())
                ? $session->reschedules->sortByDesc('changed_at')->first()
                : null;

            $isDateOrTimeChanged = false;
            $isTeacherOnlyChange = false;
            $oldDateStr          = '';
            $newDateStr          = '';
            $oldStartTime        = '';
            $oldEndTime          = '';
            $newStartTime        = '';
            $newEndTime          = '';

            if ($latestReschedule) {
                $oldDateStr   = $latestReschedule->old_date ? Carbon::parse($latestReschedule->old_date)->format('Y-m-d') : '';
                $newDateStr   = $latestReschedule->new_date ? Carbon::parse($latestReschedule->new_date)->format('Y-m-d') : '';
                $oldStartTime = substr((string) $latestReschedule->old_start_time, 0, 5);
                $oldEndTime   = substr((string) $latestReschedule->old_end_time, 0, 5);
                $newStartTime = substr((string) $latestReschedule->new_start_time, 0, 5);
                $newEndTime   = substr((string) $latestReschedule->new_end_time, 0, 5);

                $oldTeacherId = $latestReschedule->old_teacher_id ?? $session->teacher_id;
                $newTeacherId = $latestReschedule->new_teacher_id ?? $session->teacher_id;

                $isDateOrTimeChanged = ($oldDateStr !== $newDateStr)
                    || ($oldStartTime !== $newStartTime)
                    || ($oldEndTime !== $newEndTime);

                $isTeacherOnlyChange = (! $isDateOrTimeChanged) && ($oldTeacherId !== $newTeacherId);

                // 1. Chỉ tạo slot cũ trên lịch lớp nếu ngày hoặc giờ THỰC SỰ THAY ĐỔI
                if ($isDateOrTimeChanged && $oldDateStr >= $startDateStr && $oldDateStr <= $endDateStr) {
                    $oldTeacher = $latestReschedule->oldTeacher ?? $session->teacher ?? $session->classSubject?->teacher;
                    $oldRoom    = $latestReschedule->oldRoom ?? $session->room;
                    $oldRoomId  = $latestReschedule->old_room_id ?? $session->room_id;

                    $newTeacher = $latestReschedule->newTeacher ?? $session->teacher ?? $session->classSubject?->teacher;
                    $newRoom    = $latestReschedule->newRoom ?? $session->room;

                    $processedSessions[] = [
                        'id'                      => "rescheduled-old-{$session->id}-{$latestReschedule->id}",
                        'original_session_id'     => $session->id,
                        'class_subject_id'        => $session->class_subject_id,
                        'teacher_id'              => $oldTeacherId,
                        'room_id'                 => $oldRoomId,
                        'session_date'            => $oldDateStr,
                        'start_time'              => $oldStartTime,
                        'end_time'                => $oldEndTime,
                        'status'                  => 'rescheduled',
                        'change_type'             => 'schedule',
                        'topic'                   => $session->topic,
                        'note'                    => $session->note,
                        'is_rescheduled_old_slot' => true,
                        'reschedule_info'         => [
                            'change_type'    => 'schedule',
                            'new_date'       => Carbon::parse($newDateStr)->format('d-m-Y'),
                            'new_start_time' => $newStartTime,
                            'new_end_time'   => $newEndTime,
                            'new_room'       => $newRoom?->name,
                            'new_teacher'    => $newTeacher?->full_name,
                            'old_room'       => $oldRoom?->name,
                            'old_teacher'    => $oldTeacher?->full_name,
                            'reason'         => $latestReschedule->reason,
                        ],
                        'class_subject' => $session->classSubject,
                        'teacher'       => $oldTeacher,
                        'room'          => $oldRoom,
                        'room_info'     => $oldRoom,
                        'class_name'    => $session->classSubject?->schoolClass?->name ?? 'Lớp học',
                        'class_code'    => $session->classSubject?->schoolClass?->code ?? '',
                        'subject_name'  => $session->classSubject?->subject?->name ?? 'Môn học',
                        'subject_code'  => $session->classSubject?->subject?->code ?? '',
                    ];
                }
            }

            // 2. Thêm ca học ở session_date (nếu nằm trong tuần này)
            if ($sessionDateStr >= $startDateStr && $sessionDateStr <= $endDateStr) {
                $sessionArr = $session->toArray();

                if ($latestReschedule) {
                    $changeType                = $isDateOrTimeChanged ? 'schedule' : ($isTeacherOnlyChange ? 'teacher_only' : 'info_only');
                    $sessionArr['change_type'] = $changeType;

                    if ($isDateOrTimeChanged) {
                        $sessionArr['is_rescheduled_new_slot'] = true;

                        // Tại ngày mới (new_date), ca học là ca dự kiến diễn ra
                        if ($sessionArr['status'] === 'rescheduled') {
                            $sessionArr['status'] = 'scheduled';
                        }
                    }

                    $sessionArr['reschedule_from_info'] = [
                        'change_type'    => $changeType,
                        'old_date'       => Carbon::parse($oldDateStr)->format('d-m-Y'),
                        'old_start_time' => $oldStartTime,
                        'old_end_time'   => $oldEndTime,
                        'old_teacher'    => $latestReschedule->oldTeacher?->full_name,
                        'new_teacher'    => $latestReschedule->newTeacher?->full_name ?? $session->teacher?->full_name,
                        'old_room'       => $latestReschedule->oldRoom?->name,
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

    public function getAvailableStudents(int $classId, ?string $search = null, ?Admin $admin = null, ?Teacher $teacher = null): \Illuminate\Database\Eloquent\Collection
    {
        $schoolClass = $this->findClass($classId, $admin, $teacher);

        return $this->schoolClassRepository->getAvailableStudentsForClass($classId, (int) $schoolClass->center_id, $search);
    }

    public function addStudentsToClass(int $classId, array $studentIds, ?Admin $admin = null, ?Teacher $teacher = null, bool $createTuition = false, ?array $tuitionStudentIds = null): int
    {
        $schoolClass = $this->findClass($classId, $admin, $teacher);

        $classStatusInt = is_object($schoolClass->status) ? $schoolClass->status->value : (int) $schoolClass->status;

        if ($classStatusInt !== Constant::CLASS_STATUS_ACTIVE) {
            throw new AccessDeniedHttpException('Lớp học không ở trạng thái đang hoạt động. Không thể thêm học sinh vào lớp.');
        }

        // Lọc danh sách học sinh chỉ thuộc cùng trung tâm của lớp và đang ở trạng thái Đang theo học (ACTIVE)
        $validStudentIds = Student::where('center_id', $schoolClass->center_id)
            ->where('status', Constant::STUDENT_STATUS_ACTIVE)
            ->whereIn('id', $studentIds)
            ->pluck('id')
            ->toArray();

        $added = $this->schoolClassRepository->attachStudents($classId, $validStudentIds);

        if ($createTuition) {
            $totalTuitionFee = (float) ($schoolClass->total_tuition_fee > 0
                ? $schoolClass->total_tuition_fee
                : $schoolClass->classSubjects()->sum('tuition_fee'));

            $targetStudentIds = $tuitionStudentIds !== null
                ? array_values(array_intersect($validStudentIds, array_map('intval', $tuitionStudentIds)))
                : $validStudentIds;

            if ($totalTuitionFee > 0 && ! empty($targetStudentIds)) {
                foreach ($targetStudentIds as $studentId) {
                    StudentTuition::firstOrCreate(
                        [
                            'center_id'  => $schoolClass->center_id,
                            'student_id' => $studentId,
                            'class_id'   => $schoolClass->id,
                        ],
                        [
                            'title'            => 'Học phí ' . $schoolClass->name,
                            'total_amount'     => $totalTuitionFee,
                            'paid_amount'      => 0,
                            'remaining_amount' => $totalTuitionFee,
                            'status'           => Constant::TUITION_STATUS_PENDING,
                            'due_date'         => $schoolClass->end_date ?: null,
                            'created_by'       => $admin?->id,
                        ]
                    );
                }
            }
        }

        return $added;
    }

    public function removeStudentFromClass(int $classId, int $studentId, ?Admin $admin = null, ?Teacher $teacher = null): bool
    {
        $this->findClass($classId, $admin, $teacher);

        return $this->schoolClassRepository->detachStudent($classId, $studentId);
    }

    public function updateClassStudentStatus(int $classId, int $studentId, int|string $status, ?string $note = null, ?Admin $admin = null, ?Teacher $teacher = null): bool
    {
        $this->findClass($classId, $admin, $teacher);

        return $this->schoolClassRepository->updateClassStudentStatus($classId, $studentId, $status, $note);
    }

    /**
     * Đồng bộ và cập nhật lại học phí cho tất cả học sinh đang có hồ sơ học phí trong lớp
     *
     * @param  SchoolClass $schoolClass
     * @return void
     */
    public function updateClassStudentsTuitions(SchoolClass $schoolClass): void
    {
        $newClassTotal = (float) $schoolClass->total_tuition_fee;
        $tuitions      = StudentTuition::where('class_id', $schoolClass->id)->get();

        foreach ($tuitions as $tuition) {
            $discountType  = $tuition->discount_type ? (int) $tuition->discount_type : null;
            $discountValue = (float) ($tuition->discount_value ?? 0);

            if ($discountType === Constant::DISCOUNT_TYPE_DIRECT) {
                $newTotal = max(0.0, $newClassTotal - $discountValue);
            } elseif ($discountType === Constant::DISCOUNT_TYPE_PERCENTAGE) {
                $newTotal = max(0.0, round($newClassTotal * (1 - ($discountValue / 100)), 2));
            } else {
                $newTotal = $newClassTotal;
            }

            $paidAmount      = (float) $tuition->payments()->sum('amount');
            $remainingAmount = max(0.0, $newTotal - $paidAmount);
            $isOverdue       = $tuition->due_date && Carbon::parse($tuition->due_date)->isPast() && $remainingAmount > 0;

            if ($remainingAmount <= 0 && $newTotal > 0) {
                $status = Constant::TUITION_STATUS_COMPLETED;
            } elseif ($paidAmount > 0) {
                $status = $isOverdue ? Constant::TUITION_STATUS_OVERDUE : Constant::TUITION_STATUS_PARTIAL;
            } else {
                $status = $isOverdue ? Constant::TUITION_STATUS_OVERDUE : Constant::TUITION_STATUS_PENDING;
            }

            $tuition->update([
                'total_amount'     => $newTotal,
                'paid_amount'      => $paidAmount,
                'remaining_amount' => $remainingAmount,
                'status'           => $status,
            ]);
        }
    }
}
