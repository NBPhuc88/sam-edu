<?php

namespace App\Services\Teacher;

use App\Models\Admin;
use App\Models\Center;
use App\Models\Teacher;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TeacherService implements TeacherServiceInterface
{
    public function __construct(
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

        $centersQuery = Center::query()->where('status', 'active');

        if ($allowedCenterIds !== null) {
            $centersQuery->whereIn('id', $allowedCenterIds);
        }
        $centers = $centersQuery->orderBy('name')->get(['id', 'name', 'code']);

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
            $count       = Teacher::withTrashed()->where('center_id', $centerId)->count() + 1;
            $teacherCode = 'GV' . str_pad((string) $count, 3, '0', STR_PAD_LEFT);

            while (Teacher::where('center_id', $centerId)->where('teacher_code', $teacherCode)->exists()) {
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
}
