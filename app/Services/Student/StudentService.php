<?php

namespace App\Services\Student;

use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Student\StudentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
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
            $classes         = \App\Models\SchoolClass::whereIn('id', $teacherClassIds)->get(['id', 'name', 'code', 'center_id']);
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
                $activeStudentsCount = Student::where('center_id', $centerId)
                    ->where('status', 1)
                    ->count();

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
                $activeStudentsCount = Student::where('center_id', $centerId)
                    ->where('id', '!=', $student->id)
                    ->where('status', 1)
                    ->count();

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

        $updateData = [
            'center_id'           => $data['center_id'] ?? $student->center_id,
            'username'            => array_key_exists('username', $data) ? (! empty($data['username']) ? trim($data['username']) : null) : $student->username,
            'email'               => array_key_exists('email', $data) ? (! empty($data['email']) ? trim($data['email']) : null) : $student->email,
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

        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        return $this->studentRepository->update($id, $updateData);
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
}
