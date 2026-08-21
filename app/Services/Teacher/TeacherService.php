<?php

namespace App\Services\Teacher;

use App\Models\Admin;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Session\ClassSessionRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
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

        $password = ! empty($data['password']) ? Hash::make($data['password']) : Hash::make('12345678');

        return $this->teacherRepository->create([
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

        $updateData = [
            'center_id'      => $data['center_id'] ?? $teacher->center_id,
            'username'       => isset($data['username']) ? trim($data['username']) : $teacher->username,
            'email'          => array_key_exists('email', $data) ? (! empty($data['email']) ? trim($data['email']) : null) : $teacher->email,
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

        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        return $this->teacherRepository->update($id, $updateData);
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

        // Lấy danh sách ca dạy thực tế trong tuần
        $sessions = $this->teacherRepository->getTeacherSessionsBetweenDates(
            $teacherId,
            $startOfWeek->format('Y-m-d'),
            $endOfWeek->format('Y-m-d')
        );

        // Tính toán thứ tự buổi học cho từng session
        $enrichedSessions = [];

        foreach ($sessions as $session) {
            $sessionArr = $session->toArray();

            // Tính số thứ tự buổi học của môn này trong lớp
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

        // Lấy lịch dạy cố định hàng tuần
        $recurringSchedules = $this->teacherRepository->getTeacherWeeklySchedules($teacherId);

        // Trích xuất các khung giờ dạy (Time slots) duy nhất
        $timeSlotSet = [];

        foreach ($sessions as $session) {
            $start = substr((string) $session->start_time, 0, 5);
            $end   = substr((string) $session->end_time, 0, 5);
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
