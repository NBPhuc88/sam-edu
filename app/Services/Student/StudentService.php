<?php

namespace App\Services\Student;

use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Student\StudentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class StudentService implements StudentServiceInterface
{
    public function __construct(
        protected StudentRepositoryInterface $studentRepository,
        protected CenterRepositoryInterface $centerRepository,
        protected SchoolClassRepositoryInterface $schoolClassRepository
    ) {
    }

    /**
     * @param  ?Admin          $admin
     * @param  ?Teacher        $teacher
     * @return array<int>|null Null nghĩa là Super Admin (truy cập toàn bộ)
     */
    protected function getAllowedCenterIds(?Admin $admin, ?Teacher $teacher = null): ?array
    {
        if ($admin) {
            if ($admin->isSuperAdmin()) {
                return null; // All centers
            }

            return $admin->centers()->pluck('centers.id')->toArray();
        }

        if ($teacher) {
            return $teacher->center_id ? [(int) $teacher->center_id] : [];
        }

        return [];
    }

    /**
     * @param  Teacher    $teacher
     * @return array<int>
     */
    protected function getTeacherClassIds(Teacher $teacher): array
    {
        return $teacher->classSubjects()->pluck('class_id')->unique()->toArray();
    }

    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @return LengthAwarePaginator
     */
    public function getPaginatedStudents(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null,
        ?Teacher $teacher = null
    ): LengthAwarePaginator {
        $allowedCenterIds = $this->getAllowedCenterIds($admin, $teacher);
        $allowedClassIds  = null;

        if ($teacher) {
            $allowedClassIds = $this->getTeacherClassIds($teacher);

            if (empty($allowedClassIds)) {
                $allowedClassIds = [-1]; // No classes assigned
            }

            if ($classId !== null) {
                if (!in_array($classId, $allowedClassIds, true)) {
                    $allowedClassIds = [-1]; // No permission for this class
                }
            }
        }

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

        return $this->studentRepository->paginate(
            $search,
            $centerIds,
            $classId,
            $status,
            $perPage,
            $page,
            $allowedClassIds
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
            $teacherClassIds = $this->getTeacherClassIds($teacher);
            $classes         = $this->schoolClassRepository->getByIds($teacherClassIds, ['id', 'name', 'code', 'center_id']);
            $centers         = $teacher->center_id ? $this->centerRepository->getByIds([(int) $teacher->center_id], ['id', 'name', 'code']) : [];

            return [
                'centers' => $centers,
                'classes' => $classes,
            ];
        }

        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null) {
            $centers = $this->centerRepository->getByIds($allowedCenterIds, ['id', 'name', 'code']);
            $classes = $this->schoolClassRepository->getClassesByCenterIds($allowedCenterIds);
        } else {
            $centers = $this->centerRepository->getActiveCenters();
            $classes = $this->schoolClassRepository->getClassesByCenterIds();
        }

        return [
            'centers' => $centers,
            'classes' => $classes,
        ];
    }

    /**
     * @param  int          $id
     * @param  ?Admin       $admin
     * @param  ?Teacher     $teacher
     * @return Student|null
     */
    public function findStudent(int $id, ?Admin $admin = null, ?Teacher $teacher = null): ?Student
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin, $teacher);
        $student          = $this->studentRepository->find($id, $allowedCenterIds);

        if (! $student) {
            throw new NotFoundHttpException('Không tìm thấy học sinh hoặc bạn không có quyền truy cập.');
        }

        if ($teacher) {
            $teacherClassIds = $this->getTeacherClassIds($teacher);
            $hasAccess       = $student->classes()->whereIn('classes.id', $teacherClassIds)->exists();

            if (! $hasAccess) {
                throw new NotFoundHttpException('Không tìm thấy học sinh hoặc bạn không có quyền truy cập.');
            }
        }

        return $student;
    }

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Student
     */
    public function createStudent(array $data, ?Admin $admin = null): Student
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $centerId         = (int) $data['center_id'];

        if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền thêm học sinh vào Trung tâm này.');
        }

        // Tách hoặc gộp Họ và Tên
        $fullName = trim($data['full_name'] ?? '');
        $parts    = explode(' ', $fullName);

        if (count($parts) > 1) {
            $firstName = array_pop($parts);
            $lastName  = implode(' ', $parts);
        } else {
            $firstName = $fullName;
            $lastName  = $fullName;
        }

        // Tự sinh mã học sinh nếu không nhập
        $studentCode = trim($data['student_code'] ?? '');

        if (empty($studentCode)) {
            $count       = $this->studentRepository->countByCenterIds([$centerId]) + 1;
            $studentCode = 'HS' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);

            while ($this->studentRepository->codeExists($centerId, $studentCode)) {
                $count++;
                $studentCode = 'HS' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
            }
        }

        $status    = $data['status'] ?? 1;
        $statusInt = 1;

        if (is_numeric($status)) {
            $statusInt = (int) $status;
        } elseif ($status === 'inactive' || $status === 'paused') {
            $statusInt = 0;
        } elseif ($status === 'graduated' || $status === 'completed') {
            $statusInt = 2;
        }

        // Kiểm tra giới hạn số học sinh đang hoạt động không vượt quá max_students
        if ($statusInt === 1) {
            $center = $this->centerRepository->find($centerId);

            if ($center && $center->max_students !== null) {
                $activeStudentsCount = $this->studentRepository->countActiveByCenterId($centerId);

                if ($activeStudentsCount >= $center->max_students) {
                    throw new \InvalidArgumentException("Số học sinh đang hoạt động ({$activeStudentsCount}) đã đạt tối đa giới hạn ({$center->max_students}) của gói dịch vụ. Vui lòng nâng cấp gói hoặc chuyển trạng thái học sinh cũ.");
                }
            }
        }

        $rawPassword = ! empty($data['password']) ? (string) $data['password'] : null;
        $password    = $rawPassword ? Hash::make($rawPassword) : null;

        $dateOfBirth   = $this->parseDate($data['date_of_birth'] ?? null);
        $admissionDate = $this->parseDate($data['admission_date'] ?? null);

        $student = $this->studentRepository->create([
            'username'            => ! empty($data['username']) ? trim($data['username']) : null,
            'email'               => ! empty($data['email']) ? trim($data['email']) : null,
            'password'            => $password,
            'status'              => $statusInt,
            'student_code'        => $studentCode,
            'center_id'           => $centerId,
            'first_name'          => $data['first_name'] ?? $firstName,
            'last_name'           => $data['last_name'] ?? $lastName,
            'full_name'           => $fullName,
            'phone'               => $data['phone'] ?? null,
            'date_of_birth'       => $dateOfBirth,
            'gender'              => $data['gender'] ?? null,
            'address'             => $data['address'] ?? null,
            'avatar'              => $data['avatar'] ?? null,
            'parent_name'         => $data['parent_name'] ?? null,
            'parent_phone'        => $data['parent_phone'] ?? null,
            'parent_relationship' => $data['parent_relationship'] ?? null,
            'admission_date'      => $admissionDate,
            'note'                => $data['note'] ?? null,
        ]);

        if (! empty($data['class_ids']) && is_array($data['class_ids'])) {
            $validClassIds = $this->studentRepository->filterValidClassIds($centerId, $data['class_ids']);

            if (! empty($validClassIds)) {
                $this->studentRepository->syncClasses($student, $validClassIds);
            }
        }

        if (! empty($student->email) && ! empty($student->username)) {
            $center = $this->centerRepository->find($centerId);
            \Illuminate\Support\Facades\Mail::to($student->email)->queue(
                new \App\Mail\AccountCreatedMail(
                    fullName: $student->full_name,
                    username: $student->username,
                    roleLabel: 'Học sinh',
                    userCode: $student->student_code ?? $studentCode,
                    rawPassword: $rawPassword,
                    centerName: $center?->name,
                    loginUrl: url('/login')
                )
            );
        }

        return $student;
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Student
     */
    public function updateStudent(int $id, array $data, ?Admin $admin = null): Student
    {
        $student = $this->findStudent($id, $admin);

        if (isset($data['center_id'])) {
            $centerId         = (int) $data['center_id'];
            $allowedCenterIds = $this->getAllowedCenterIds($admin);

            if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                throw new AccessDeniedHttpException('Bạn không có quyền chuyển học sinh sang Trung tâm này.');
            }
        }

        $currentStatusInt = is_object($student->status) ? $student->status->value : (int) $student->status;
        $newStatus        = $currentStatusInt;

        if (isset($data['status'])) {
            if (is_numeric($data['status'])) {
                $newStatus = (int) $data['status'];
            } elseif ($data['status'] === 'inactive' || $data['status'] === 'paused') {
                $newStatus = 0;
            } elseif ($data['status'] === 'graduated' || $data['status'] === 'completed') {
                $newStatus = 2;
            } else {
                $newStatus = 1;
            }
        }

        $centerId = (int) ($data['center_id'] ?? $student->center_id);

        if ($currentStatusInt !== 1 && $newStatus === 1) {
            $center = $this->centerRepository->find($centerId);

            if ($center && $center->max_students !== null) {
                $activeStudentsCount = $this->studentRepository->countActiveByCenterId($centerId, $student->id);

                if ($activeStudentsCount >= $center->max_students) {
                    throw new \InvalidArgumentException("Số học sinh đang hoạt động ({$activeStudentsCount}) đã đạt tối đa giới hạn ({$center->max_students}) của gói dịch vụ. Vui lòng nâng cấp gói hoặc chuyển trạng thái học sinh cũ.");
                }
            }
        }

        $dateOfBirth = array_key_exists('date_of_birth', $data)
            ? $this->parseDate($data['date_of_birth'])
            : $student->getRawOriginal('date_of_birth');

        $admissionDate = array_key_exists('admission_date', $data)
            ? $this->parseDate($data['admission_date'])
            : $student->getRawOriginal('admission_date');

        $oldEmail          = $student->email;
        $oldUsername       = $student->username;
        $isPassChanged     = ! empty($data['password']);
        $newEmail          = array_key_exists('email', $data) ? (! empty($data['email']) ? trim($data['email']) : null) : $student->email;
        $newUsername       = array_key_exists('username', $data) ? (! empty($data['username']) ? trim($data['username']) : null) : $student->username;
        $isEmailChanged    = $newEmail && $oldEmail !== $newEmail;
        $isUsernameChanged = $newUsername && $oldUsername !== $newUsername;

        $updateData = [
            'center_id'           => $data['center_id'] ?? $student->center_id,
            'username'            => $newUsername,
            'email'               => $newEmail,
            'status'              => $newStatus,
            'student_code'        => isset($data['student_code']) ? trim($data['student_code']) : $student->student_code,
            'phone'               => array_key_exists('phone', $data) ? $data['phone'] : $student->phone,
            'date_of_birth'       => $dateOfBirth,
            'gender'              => array_key_exists('gender', $data) ? $data['gender'] : $student->gender,
            'address'             => array_key_exists('address', $data) ? $data['address'] : $student->address,
            'parent_name'         => array_key_exists('parent_name', $data) ? $data['parent_name'] : $student->parent_name,
            'parent_phone'        => array_key_exists('parent_phone', $data) ? $data['parent_phone'] : $student->parent_phone,
            'parent_relationship' => array_key_exists('parent_relationship', $data) ? $data['parent_relationship'] : $student->parent_relationship,
            'admission_date'      => $admissionDate,
            'note'                => array_key_exists('note', $data) ? $data['note'] : $student->note,
        ];

        if (! empty($data['full_name'])) {
            $fullName = trim($data['full_name']);
            $parts    = explode(' ', $fullName);

            if (count($parts) > 1) {
                $firstName = array_pop($parts);
                $lastName  = implode(' ', $parts);
            } else {
                $firstName = $fullName;
                $lastName  = $fullName;
            }
            $updateData['full_name']  = $fullName;
            $updateData['first_name'] = $data['first_name'] ?? $firstName;
            $updateData['last_name']  = $data['last_name'] ?? $lastName;
        }

        if ($isPassChanged) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $updatedStudent = $this->studentRepository->update($id, $updateData);
        $center         = $this->centerRepository->find((int) $updatedStudent->center_id);

        if (array_key_exists('class_ids', $data) && is_array($data['class_ids'])) {
            $validClassIds = $this->studentRepository->filterValidClassIds($centerId, $data['class_ids']);
            $this->studentRepository->syncClasses($updatedStudent, $validClassIds);
        }

        if ($isPassChanged && ! empty($updatedStudent->email)) {
            \Illuminate\Support\Facades\Mail::to($updatedStudent->email)->queue(
                new \App\Mail\PasswordChangedMail(
                    fullName: $updatedStudent->full_name,
                    username: (string) ($updatedStudent->username ?? $updatedStudent->student_code),
                    roleLabel: 'Học sinh',
                    centerName: $center?->name,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: url('/login')
                )
            );
        }

        if ($isUsernameChanged && ! empty($updatedStudent->email)) {
            \Illuminate\Support\Facades\Mail::to($updatedStudent->email)->queue(
                new \App\Mail\UsernameChangedMail(
                    fullName: $updatedStudent->full_name,
                    oldUsername: (string) $oldUsername,
                    newUsername: (string) $newUsername,
                    roleLabel: 'Học sinh',
                    centerName: $center?->name,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: url('/login')
                )
            );
        }

        if ($isEmailChanged) {
            \Illuminate\Support\Facades\Mail::to($newEmail)->queue(
                new \App\Mail\EmailChangedMail(
                    fullName: $updatedStudent->full_name,
                    username: (string) ($updatedStudent->username ?? $updatedStudent->student_code),
                    oldEmail: (string) $oldEmail,
                    newEmail: (string) $newEmail,
                    roleLabel: 'Học sinh',
                    centerName: $center?->name,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: url('/login')
                )
            );
        }

        return $updatedStudent;
    }

    /**
     * Chuẩn hóa ngày tháng về định dạng Y-m-d cho MySQL.
     * @param mixed $value
     */
    protected function parseDate(mixed $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        try {
            return \Carbon\Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteStudent(int $id, ?Admin $admin = null): bool
    {
        $student = $this->findStudent($id, $admin);

        return $this->studentRepository->delete($student->id);
    }

    public function assignClassesToStudent(int $studentId, array $classIds, ?Admin $admin = null): void
    {
        $student  = $this->findStudent($studentId, $admin);
        $centerId = (int) $student->center_id;

        $validClassIds = $this->studentRepository->filterValidClassIds($centerId, $classIds);

        $this->studentRepository->syncClasses($student, $validClassIds);
    }

    public function bulkAssignStudentsToClass(int $classId, array $studentIds, ?Admin $admin = null): array
    {
        $class = $this->schoolClassRepository->find($classId);

        if (! $class) {
            throw new NotFoundHttpException('Không tìm thấy lớp học.');
        }

        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null && ! in_array($class->center_id, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền thao tác trên lớp học này.');
        }

        $validStudents = $this->studentRepository->getActiveStudents([(int) $class->center_id])
            ->whereIn('id', $studentIds);

        $successCount = 0;

        foreach ($validStudents as $student) {
            $this->studentRepository->attachClasses($student, [$classId]);
            $successCount++;
        }

        return [
            'success_count' => $successCount,
            'message'       => "Đã phân {$successCount} học sinh vào lớp '{$class->name}'.",
        ];
    }

    public function removeStudentFromClass(int $studentId, int $classId, ?Admin $admin = null): bool
    {
        $student = $this->findStudent($studentId, $admin);

        return $this->studentRepository->detachClass($student, $classId);
    }

    /**
     * @param  int                  $studentId
     * @param  ?string              $weekDate
     * @param  ?Student             $student
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getStudentTimetableData(int $studentId, ?string $weekDate = null, ?Student $student = null, ?Admin $admin = null): array
    {
        $targetStudent = $student;

        if (! $targetStudent) {
            $targetStudent = $this->findStudent($studentId, $admin);
        }

        $targetStudent->load(['center:id,name,code']);

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
            $isoWeekday = $day->dayOfWeekIso;

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

        // Lấy danh sách ca học thực tế của các lớp học sinh tham gia trong tuần
        $rawSessions = $this->studentRepository->getStudentSessionsBetweenDates(
            $targetStudent->id,
            $startDateStr,
            $endDateStr
        );

        $enrichedSessions = [];

        foreach ($rawSessions as $session) {
            $sessionDateStr = $session->session_date ? Carbon::parse($session->session_date)->format('Y-m-d') : '';

            // 1. Slot cũ đã dời đi
            if ($session->reschedules && $session->reschedules->isNotEmpty()) {
                foreach ($session->reschedules as $reschedule) {
                    $oldDateStr = $reschedule->old_date ? Carbon::parse($reschedule->old_date)->format('Y-m-d') : '';
                    $newDateStr = $reschedule->new_date ? Carbon::parse($reschedule->new_date)->format('Y-m-d') : '';

                    if ($oldDateStr >= $startDateStr && $oldDateStr <= $endDateStr) {
                        $oldStartTime = substr((string) $reschedule->old_start_time, 0, 5);
                        $oldEndTime   = substr((string) $reschedule->old_end_time, 0, 5);
                        $newStartTime = substr((string) $reschedule->new_start_time, 0, 5);
                        $newEndTime   = substr((string) $reschedule->new_end_time, 0, 5);

                        $enrichedSessions[] = [
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
                            'class_name'    => $session->classSubject?->schoolClass?->name ?? 'Lớp học',
                            'class_code'    => $session->classSubject?->schoolClass?->code ?? '',
                            'subject_name'  => $session->classSubject?->subject?->name ?? 'Môn học',
                            'subject_code'  => $session->classSubject?->subject?->code ?? '',
                        ];
                    }
                }
            }

            // 2. Ca học ở new_date (nếu nằm trong tuần)
            if ($sessionDateStr >= $startDateStr && $sessionDateStr <= $endDateStr) {
                $sessionArr = $session->toArray();

                $sessionArr['total_sessions'] = $session->classSubject?->subject?->total_sessions;
                $sessionArr['student_count']  = $session->classSubject?->schoolClass?->students_count ?? 0;
                $sessionArr['max_students']   = $session->classSubject?->schoolClass?->max_students;
                $sessionArr['class_name']     = $session->classSubject?->schoolClass?->name ?? 'Lớp học';
                $sessionArr['class_code']     = $session->classSubject?->schoolClass?->code ?? '';
                $sessionArr['subject_name']   = $session->classSubject?->subject?->name ?? 'Môn học';
                $sessionArr['subject_code']   = $session->classSubject?->subject?->code ?? '';

                if ($session->reschedules && $session->reschedules->isNotEmpty()) {
                    $latestReschedule = $session->reschedules->first();
                    $oldDateStr       = $latestReschedule->old_date ? Carbon::parse($latestReschedule->old_date)->format('Y-m-d') : '';
                    $oldStartTime     = substr((string) $latestReschedule->old_start_time, 0, 5);
                    $oldEndTime       = substr((string) $latestReschedule->old_end_time, 0, 5);

                    $sessionArr['is_rescheduled_new_slot'] = true;

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

                // Room info
                if ($session->room) {
                    $sessionArr['room_info'] = [
                        'id'       => $session->room->id,
                        'name'     => $session->room->name,
                        'code'     => $session->room->code ?? '',
                        'capacity' => $session->room->capacity ?? 0,
                        'location' => $session->room->location ?? '',
                    ];
                } else {
                    $sessionArr['room_info'] = null;
                }

                $enrichedSessions[] = $sessionArr;
            }
        }

        // Lấy lịch học cố định hàng tuần của học sinh
        $recurringSchedules = $this->studentRepository->getStudentWeeklySchedules($targetStudent->id);

        // Trích xuất các khung giờ học (Time slots) duy nhất
        $timeSlotSet = [];

        foreach ($enrichedSessions as $sessItem) {
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

        // Sắp xếp time slots theo start_time
        uasort($timeSlotSet, function ($a, $b) {
            return strcmp($a['start_time'], $b['start_time']);
        });

        return [
            'student'            => $targetStudent,
            'weekDays'           => $weekDays,
            'startOfWeek'        => $startOfWeek->format('Y-m-d'),
            'endOfWeek'          => $endOfWeek->format('Y-m-d'),
            'prevWeek'           => $startOfWeek->copy()->subWeek()->format('Y-m-d'),
            'nextWeek'           => $startOfWeek->copy()->addWeek()->format('Y-m-d'),
            'currentWeek'        => Carbon::today()->format('Y-m-d'),
            'selectedDate'       => $baseDate->format('Y-m-d'),
            'timeSlots'          => array_values($timeSlotSet),
            'sessions'           => $enrichedSessions,
            'recurringSchedules' => $recurringSchedules,
        ];
    }
}
