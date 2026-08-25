<?php

namespace App\Services\Subject;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Subject;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Subject\SubjectRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SubjectService implements SubjectServiceInterface
{
    public function __construct(
        protected SubjectRepositoryInterface $subjectRepository,
        protected CenterRepositoryInterface $centerRepository
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
    public function getPaginatedSubjects(
        ?string $search = null,
        ?int $centerId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
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

        return $this->subjectRepository->paginate(
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
     * @return Subject|null
     */
    public function findSubject(int $id, ?Admin $admin = null): ?Subject
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $subject          = $this->subjectRepository->find($id, $allowedCenterIds);

        if (! $subject) {
            throw new NotFoundHttpException('Không tìm thấy môn học hoặc bạn không có quyền truy cập.');
        }

        return $subject;
    }

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Subject
     */
    public function createSubject(array $data, ?Admin $admin = null): Subject
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $centerId         = (int) $data['center_id'];

        if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền thêm môn học vào Trung tâm này.');
        }

        $code = trim($data['code'] ?? '');

        if (empty($code)) {
            $count = $this->subjectRepository->nextId();
            $code  = Constant::PREFIX_SUBJECT . str_pad((string) $count, Constant::CODE_PAD_LENGTH, Constant::CODE_PAD_CHAR, STR_PAD_LEFT);

            while ($this->subjectRepository->codeExists($code)) {
                $count++;
                $code = Constant::PREFIX_SUBJECT . str_pad((string) $count, Constant::CODE_PAD_LENGTH, Constant::CODE_PAD_CHAR, STR_PAD_LEFT);
            }
        }

        return $this->subjectRepository->create([
            'center_id'        => $centerId,
            'code'             => $code,
            'name'             => trim($data['name']),
            'description'      => $data['description'] ?? null,
            'total_sessions'   => ! empty($data['total_sessions']) ? (int) $data['total_sessions'] : null,
            'duration_minutes' => ! empty($data['duration_minutes']) ? (int) $data['duration_minutes'] : null,
            'tuition_fee'      => isset($data['tuition_fee']) ? (float) $data['tuition_fee'] : null,
            'status'           => $data['status'] ?? Constant::STATUS_ACTIVE,
        ]);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Subject
     */
    public function updateSubject(int $id, array $data, ?Admin $admin = null): Subject
    {
        $subject = $this->findSubject($id, $admin);

        if (isset($data['center_id'])) {
            $centerId         = (int) $data['center_id'];
            $allowedCenterIds = $this->getAllowedCenterIds($admin);

            if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                throw new AccessDeniedHttpException('Bạn không có quyền chuyển môn học sang Trung tâm này.');
            }
        }

        return $this->subjectRepository->update($id, [
            'center_id'        => $data['center_id'] ?? $subject->center_id,
            'code'             => isset($data['code']) ? trim($data['code']) : $subject->code,
            'name'             => isset($data['name']) ? trim($data['name']) : $subject->name,
            'description'      => array_key_exists('description', $data) ? $data['description'] : $subject->description,
            'total_sessions'   => array_key_exists('total_sessions', $data) ? (! empty($data['total_sessions']) ? (int) $data['total_sessions'] : null) : $subject->total_sessions,
            'duration_minutes' => array_key_exists('duration_minutes', $data) ? (! empty($data['duration_minutes']) ? (int) $data['duration_minutes'] : null) : $subject->duration_minutes,
            'tuition_fee'      => array_key_exists('tuition_fee', $data) ? (isset($data['tuition_fee']) ? (float) $data['tuition_fee'] : null) : $subject->tuition_fee,
            'status'           => $data['status'] ?? $subject->status,
        ]);
    }

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteSubject(int $id, ?Admin $admin = null): bool
    {
        $subject = $this->findSubject($id, $admin);

        return $this->subjectRepository->delete($subject->id);
    }
}
