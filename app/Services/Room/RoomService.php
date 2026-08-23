<?php

namespace App\Services\Room;

use App\Models\Admin;
use App\Models\Room;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Room\RoomRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class RoomService implements RoomServiceInterface
{
    public function __construct(
        protected RoomRepositoryInterface $roomRepository,
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
            $admin = \Illuminate\Support\Facades\Auth::guard('admin')->user();
        }

        if (! $admin) {
            return null;
        }

        if ($admin->isSuperAdmin()) {
            return null;
        }

        return $admin->centers()->pluck('centers.id')->toArray();
    }

    public function getPaginatedRooms(
        ?string $search,
        ?int $centerId,
        ?string $status,
        int $perPage,
        int $page,
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

        return $this->roomRepository->paginate(
            $search,
            $centerIds,
            $status,
            $perPage,
            $page
        );
    }

    public function getRoomById(int $id, ?Admin $admin = null): ?Room
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $room             = $this->roomRepository->find($id, $allowedCenterIds);

        if (! $room) {
            throw new NotFoundHttpException('Không tìm thấy phòng học hoặc bạn không có quyền truy cập.');
        }

        return $room;
    }

    public function createRoom(array $data, ?Admin $admin = null): Room
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $centerId         = (int) $data['center_id'];

        if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền tạo phòng học cho trung tâm này.');
        }

        $status = $data['status'] ?? 'active';

        // Kiểm tra giới hạn số phòng học đang hoạt động và tạm dừng không được vượt quá max_classes
        if (in_array($status, ['active', 'paused'], true)) {
            $center = $this->centerRepository->find($centerId);

            if ($center && $center->max_classes !== null) {
                $activePausedCount = $this->roomRepository->countActiveAndPaused($centerId);

                if ($activePausedCount >= $center->max_classes) {
                    throw new \InvalidArgumentException("Số phòng học đang hoạt động và tạm dừng ({$activePausedCount}) đã đạt tối đa bằng số lớp học cho phép ({$center->max_classes}) của trung tâm. Vui lòng đóng bớt phòng cũ hoặc nâng cấp gói dịch vụ.");
                }
            }
        }

        if (empty($data['code'])) {
            $data['code'] = $this->generateRoomCode($centerId);
        }

        return $this->roomRepository->create($data);
    }

    protected function generateRoomCode(int $centerId): string
    {
        $count   = $this->roomRepository->countByCenterId($centerId);
        $nextNum = $count + 1;
        $code    = sprintf('R%09d', $nextNum);

        while ($this->roomRepository->codeExists($centerId, $code)) {
            $nextNum++;
            $code = sprintf('R%09d', $nextNum);
        }

        return $code;
    }

    public function updateRoom(int $id, array $data, ?Admin $admin = null): Room
    {
        $room = $this->getRoomById($id, $admin);

        if (isset($data['center_id'])) {
            $allowedCenterIds = $this->getAllowedCenterIds($admin);

            if ($allowedCenterIds !== null && ! in_array((int) $data['center_id'], $allowedCenterIds, true)) {
                throw new AccessDeniedHttpException('Bạn không có quyền chuyển phòng học sang trung tâm này.');
            }
        }

        // Phòng học đã đóng (closed) không thể đổi trạng thái khác (trừ Super Admin)
        if ($room->status === 'closed' && isset($data['status']) && $data['status'] !== 'closed') {
            if (! ($admin && $admin->isSuperAdmin())) {
                throw new AccessDeniedHttpException('Phòng học đã đóng chỉ có Super Admin mới có quyền mở lại.');
            }
        }

        // Nếu chuyển từ closed sang active hoặc paused, kiểm tra giới hạn phòng
        $newStatus = $data['status'] ?? $room->status;
        $centerId  = (int) ($data['center_id'] ?? $room->center_id);

        if ($room->status === 'closed' && in_array($newStatus, ['active', 'paused'], true)) {
            $center = $this->centerRepository->find($centerId);

            if ($center && $center->max_classes !== null) {
                $activePausedCount = $this->roomRepository->countActiveAndPaused($centerId, $room->id);

                if ($activePausedCount >= $center->max_classes) {
                    throw new \InvalidArgumentException("Số phòng học đang hoạt động và tạm dừng ({$activePausedCount}) đã đạt tối đa bằng số lớp học cho phép ({$center->max_classes}) của trung tâm. Vui lòng đóng bớt phòng cũ hoặc nâng cấp gói dịch vụ.");
                }
            }
        }

        return $this->roomRepository->update($room->id, $data);
    }

    public function deleteRoom(int $id, ?Admin $admin = null): bool
    {
        $room = $this->getRoomById($id, $admin);

        return $this->roomRepository->delete($room->id);
    }

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

    public function getStats(?Admin $admin = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        return $this->roomRepository->getStats($allowedCenterIds);
    }
}
