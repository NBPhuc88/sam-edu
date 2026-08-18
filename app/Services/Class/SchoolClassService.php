<?php

namespace App\Services\Class;

use App\Models\Admin;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Subject\SubjectRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
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

        if ($allowedCenterIds !== null) {
            $centers  = $this->centerRepository->getByIds($allowedCenterIds, ['id', 'name', 'code']);
            $subjects = $this->subjectRepository->getByCenterIds($allowedCenterIds);
            $teachers = Teacher::query()->where('status', 'active')
                ->whereIn('center_id', $allowedCenterIds)
                ->orderBy('full_name')
                ->get(['id', 'full_name', 'teacher_code', 'center_id', 'phone']);
        } else {
            $centers  = $this->centerRepository->getActiveCenters();
            $subjects = Subject::where('status', 'active')->orderBy('name')->get(['id', 'name', 'code', 'center_id']);
            $teachers = Teacher::query()->where('status', 'active')
                ->orderBy('full_name')
                ->get(['id', 'full_name', 'teacher_code', 'center_id', 'phone']);
        }

        return [
            'centers'  => $centers,
            'subjects' => $subjects,
            'teachers' => $teachers,
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

    public function getClassWithCenter(int $classId): SchoolClass
    {
        return $this->schoolClassRepository->findWithCenter($classId);
    }

    public function getPaginatedClassStudents(int $classId, ?string $search = null, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        $schoolClass = $this->schoolClassRepository->findWithCenter($classId);

        return $this->schoolClassRepository->getPaginatedClassStudents($schoolClass, $search, $perPage, $page);
    }
}
