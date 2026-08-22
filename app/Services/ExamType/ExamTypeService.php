<?php

namespace App\Services\ExamType;

use App\Models\Admin;
use App\Models\ExamType;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\ExamType\ExamTypeRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ExamTypeService implements ExamTypeServiceInterface
{
    public function __construct(
        protected ExamTypeRepositoryInterface $examTypeRepository,
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
            return null;
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
    public function getPaginatedExamTypes(
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
                $centerIds = [];
            } elseif ($centerId !== null) {
                $centerIds = $centerId;
            } else {
                $centerIds = $allowedCenterIds;
            }
        } else {
            $centerIds = $centerId;
        }

        return $this->examTypeRepository->paginate($search, $centerIds, $status, $perPage, $page);
    }

    /**
     * @param  ?int                      $centerId
     * @param  ?Admin                    $admin
     * @return Collection<int, ExamType>
     */
    public function getActiveExamTypes(?int $centerId = null, ?Admin $admin = null): Collection
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null) {
            $centerIds = $centerId ? (in_array($centerId, $allowedCenterIds, true) ? $centerId : $allowedCenterIds) : $allowedCenterIds;
        } else {
            $centerIds = $centerId;
        }

        return $this->examTypeRepository->getAllActive($centerIds);
    }

    /**
     * @param  int      $id
     * @param  ?Admin   $admin
     * @return ExamType
     */
    public function findExamType(int $id, ?Admin $admin = null): ExamType
    {
        $examType = $this->examTypeRepository->findById($id);

        if (! $examType) {
            throw new NotFoundHttpException('Loại đề thi không tồn tại.');
        }

        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null && $examType->center_id !== null && ! in_array($examType->center_id, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền truy cập Loại đề thi này.');
        }

        return $examType;
    }

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return ExamType
     */
    public function createExamType(array $data, ?Admin $admin = null): ExamType
    {
        $centerId = null;

        if ($admin && ! $admin->isSuperAdmin()) {
            $centerId = $admin->assignedCenterId();
        } elseif (! empty($data['center_id'])) {
            $centerId = (int) $data['center_id'];
        }

        $code = ! empty($data['code']) ? trim($data['code']) : $this->examTypeRepository->generateUniqueCode($centerId);

        if ($this->examTypeRepository->codeExists($centerId, $code)) {
            throw new AccessDeniedHttpException("Mã loại đề thi '{$code}' đã tồn tại.");
        }

        $payload = [
            'center_id'   => $centerId,
            'code'        => $code,
            'name'        => trim($data['name']),
            'description' => $data['description'] ?? null,
            'status'      => $data['status'] ?? 'active',
        ];

        return $this->examTypeRepository->create($payload);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return ExamType
     */
    public function updateExamType(int $id, array $data, ?Admin $admin = null): ExamType
    {
        $examType = $this->findExamType($id, $admin);

        $centerId = $examType->center_id;

        if ($admin && $admin->isSuperAdmin() && array_key_exists('center_id', $data) && ! empty($data['center_id'])) {
            $centerId = (int) $data['center_id'];
        }

        $payload = [
            'center_id'   => $centerId,
            'code'        => $examType->code,
            'name'        => isset($data['name']) ? trim($data['name']) : $examType->name,
            'description' => array_key_exists('description', $data) ? $data['description'] : $examType->description,
            'status'      => $data['status'] ?? $examType->status,
        ];

        return $this->examTypeRepository->update($id, $payload);
    }

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteExamType(int $id, ?Admin $admin = null): bool
    {
        $examType = $this->findExamType($id, $admin);

        return $this->examTypeRepository->delete($examType->id);
    }

    /**
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        $centers = $allowedCenterIds === null
            ? $this->centerRepository->getActiveCenters()
            : $this->centerRepository->getByIds($allowedCenterIds);

        return [
            'centers' => $centers,
        ];
    }
}
