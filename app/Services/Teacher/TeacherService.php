<?php

namespace App\Services\Teacher;

use App\Mail\AccountCreatedMail;
use App\Mail\EmailChangedMail;
use App\Mail\PasswordChangedMail;
use App\Mail\UsernameChangedMail;
use App\Models\Admin;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Session\ClassSessionRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TeacherService implements TeacherServiceInterface
{
    public function __construct(
        protected TeacherRepositoryInterface $teacherRepository,
        protected CenterRepositoryInterface $centerRepository,
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
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedTeachers(
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

        return $this->teacherRepository->paginate(
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

        if ($allowedCenterIds !== null) {
            $centers = $this->centerRepository->getByIds($allowedCenterIds, ['id', 'name', 'code']);
        } else {
            $centers = $this->centerRepository->getActiveCenters();
        }

        return [
            'centers' => $centers,
        ];
    }

    /**
     * @param  int          $id
     * @param  ?Admin       $admin
     * @return Teacher|null
     */
    public function findTeacher(int $id, ?Admin $admin = null): ?Teacher
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $teacher          = $this->teacherRepository->find($id, $allowedCenterIds);

        if (! $teacher) {
            throw new NotFoundHttpException('Không tìm thấy giáo viên hoặc bạn không có quyền truy cập.');
        }

        return $teacher;
    }

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Teacher
     */
    public function createTeacher(array $data, ?Admin $admin = null): Teacher
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $centerId         = (int) $data['center_id'];

        if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền thêm giáo viên vào Trung tâm này.');
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

        // Tự sinh mã giáo viên nếu không nhập
        $teacherCode = trim($data['teacher_code'] ?? '');

        if (empty($teacherCode)) {
            $count       = $this->teacherRepository->countByCenterIds([$centerId]) + 1;
            $teacherCode = 'GV' . str_pad((string) $count, 3, '0', STR_PAD_LEFT);

            while ($this->teacherRepository->codeExists($centerId, $teacherCode)) {
                $count++;
                $teacherCode = 'GV' . str_pad((string) $count, 3, '0', STR_PAD_LEFT);
            }
        }

        $rawPassword = ! empty($data['password']) ? (string) $data['password'] : '12345678';
        $password    = Hash::make($rawPassword);

        $teacher = $this->teacherRepository->create([
            'username'       => trim($data['username']),
            'email'          => ! empty($data['email']) ? trim($data['email']) : null,
            'password'       => $password,
            'status'         => $data['status'] ?? 'active',
            'teacher_code'   => $teacherCode,
            'center_id'      => $centerId,
            'first_name'     => $data['first_name'] ?? $firstName,
            'last_name'      => $data['last_name'] ?? $lastName,
            'full_name'      => $fullName,
            'phone'          => $data['phone'] ?? null,
            'date_of_birth'  => $data['date_of_birth'] ?? null,
            'gender'         => $data['gender'] ?? null,
            'avatar'         => $data['avatar'] ?? null,
            'hire_date'      => $data['hire_date'] ?? null,
            'specialization' => $data['specialization'] ?? null,
            'note'           => $data['note'] ?? null,
        ]);

        if (! empty($teacher->email)) {
            $center = $this->centerRepository->find($centerId);
            Mail::to($teacher->email)->queue(
                new AccountCreatedMail(
                    fullName: $teacher->full_name,
                    username: $teacher->username,
                    roleLabel: 'Giáo viên',
                    userCode: $teacher->teacher_code ?? $teacherCode,
                    rawPassword: $rawPassword,
                    centerName: $center?->name,
                    loginUrl: url('/login')
                )
            );
        }

        return $teacher;
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Teacher
     */
    public function updateTeacher(int $id, array $data, ?Admin $admin = null): Teacher
    {
        $teacher = $this->findTeacher($id, $admin);

        if (isset($data['center_id'])) {
            $centerId         = (int) $data['center_id'];
            $allowedCenterIds = $this->getAllowedCenterIds($admin);

            if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                throw new AccessDeniedHttpException('Bạn không có quyền chuyển giáo viên sang Trung tâm này.');
            }
        }

        $oldEmail          = $teacher->email;
        $oldUsername       = $teacher->username;
        $isPassChanged     = ! empty($data['password']);
        $newEmail          = array_key_exists('email', $data) ? (! empty($data['email']) ? trim($data['email']) : null) : $teacher->email;
        $newUsername       = array_key_exists('username', $data) ? (! empty($data['username']) ? trim($data['username']) : null) : $teacher->username;
        $isEmailChanged    = $newEmail && $oldEmail !== $newEmail;
        $isUsernameChanged = $newUsername && $oldUsername !== $newUsername;

        $updateData = [
            'center_id'      => $data['center_id'] ?? $teacher->center_id,
            'username'       => $newUsername,
            'email'          => $newEmail,
            'status'         => $data['status'] ?? $teacher->status,
            'teacher_code'   => isset($data['teacher_code']) ? trim($data['teacher_code']) : $teacher->teacher_code,
            'phone'          => array_key_exists('phone', $data) ? $data['phone'] : $teacher->phone,
            'date_of_birth'  => array_key_exists('date_of_birth', $data) ? $data['date_of_birth'] : $teacher->date_of_birth,
            'gender'         => array_key_exists('gender', $data) ? $data['gender'] : $teacher->gender,
            'hire_date'      => array_key_exists('hire_date', $data) ? $data['hire_date'] : $teacher->hire_date,
            'specialization' => array_key_exists('specialization', $data) ? $data['specialization'] : $teacher->specialization,
            'note'           => array_key_exists('note', $data) ? $data['note'] : $teacher->note,
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

        $updatedTeacher = $this->teacherRepository->update($id, $updateData);
        $center         = $this->centerRepository->find((int) $updatedTeacher->center_id);

        if ($isPassChanged && ! empty($updatedTeacher->email)) {
            Mail::to($updatedTeacher->email)->queue(
                new PasswordChangedMail(
                    fullName: $updatedTeacher->full_name,
                    username: $updatedTeacher->username,
                    roleLabel: 'Giáo viên',
                    centerName: $center?->name,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: url('/teachers')
                )
            );
        }

        if ($isUsernameChanged && ! empty($updatedTeacher->email)) {
            Mail::to($updatedTeacher->email)->queue(
                new UsernameChangedMail(
                    fullName: $updatedTeacher->full_name,
                    oldUsername: (string) $oldUsername,
                    newUsername: (string) $newUsername,
                    roleLabel: 'Giáo viên',
                    centerName: $center?->name,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: url('/teachers')
                )
            );
        }

        if ($isEmailChanged) {
            Mail::to($newEmail)->queue(
                new EmailChangedMail(
                    fullName: $updatedTeacher->full_name,
                    username: $updatedTeacher->username,
                    oldEmail: (string) $oldEmail,
                    newEmail: (string) $newEmail,
                    roleLabel: 'Giáo viên',
                    centerName: $center?->name,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: url('/teachers')
                )
            );
        }

        return $updatedTeacher;
    }

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteTeacher(int $id, ?Admin $admin = null): bool
    {
        $teacher = $this->findTeacher($id, $admin);

        return $this->teacherRepository->delete($teacher->id);
    }

    /**
     * @param  int                  $teacherId
     * @param  ?string              $weekDate
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getTeacherTimetableData(int $teacherId, ?string $weekDate = null, ?Admin $admin = null): array
    {
        $teacher = $this->findTeacher($teacherId, $admin);

        $teacher->load(['center:id,name,code']);

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

        // Lấy danh sách ca dạy thực tế trong tuần
        $rawSessions = $this->teacherRepository->getTeacherSessionsBetweenDates(
            $teacherId,
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

                $sessionOrder = $this->sessionRepository->countPastSessions(
                    (int) $session->class_subject_id,
                    $session->session_date ? (string) $session->session_date : now()->toDateString(),
                    $session->start_time
                );

                $sessionArr['session_order']  = $sessionOrder;
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

                // Room info
                if ($session->room) {
                    $sessionArr['room_info'] = [
                        'id'         => $session->room->id,
                        'name'       => $session->room->name,
                        'code'       => $session->room->code,
                        'capacity'   => $session->room->capacity,
                        'location'   => $session->room->location,
                        'equipments' => $session->room->equipments ? $session->room->equipments->map(function ($eq) {
                            return [
                                'name'     => $eq->name,
                                'quantity' => $eq->quantity,
                                'unit'     => $eq->unit,
                                'status'   => $eq->status,
                            ];
                        })->toArray() : [],
                    ];
                } else {
                    $sessionArr['room_info'] = null;
                }

                $enrichedSessions[] = $sessionArr;
            }
        }

        // Lấy lịch dạy cố định hàng tuần
        $recurringSchedules = $this->teacherRepository->getTeacherWeeklySchedules($teacherId);

        // Trích xuất các khung giờ dạy (Time slots) duy nhất
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

        // Sắp xếp các time slots theo start_time
        uasort($timeSlotSet, function ($a, $b) {
            return strcmp($a['start_time'], $b['start_time']);
        });

        return [
            'teacher'            => $teacher,
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
