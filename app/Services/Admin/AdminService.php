<?php

namespace App\Services\Admin;

use App\Models\Admin;
use App\Repositories\Admin\AdminRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class AdminService implements AdminServiceInterface
{
    public function __construct(
        protected AdminRepositoryInterface $adminRepository
    ) {
    }

    public function getPaginatedAdmins(int $perPage = 15, ?string $search = null, ?string $role = null): LengthAwarePaginator
    {
        return $this->adminRepository->paginate($perPage, $search, $role);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createAdmin(array $data): Admin
    {
        if ($data['role'] === 'super_admin') {
            $hasSuperAdmin = Admin::where('role', 'super_admin')->exists();

            if ($hasSuperAdmin) {
                throw new \InvalidArgumentException('Hệ thống chỉ cho phép duy nhất 1 tài khoản Quản trị viên tối cao (Super Admin).');
            }
        }

        $adminCode = 'ADM' . str_pad((string) (Admin::max('id') + 1), 4, '0', STR_PAD_LEFT);

        $admin = $this->adminRepository->create([
            'username'   => $data['username'],
            'full_name'  => $data['full_name'],
            'email'      => $data['email'] ?? null,
            'phone'      => $data['phone'] ?? null,
            'password'   => Hash::make((string) $data['password']),
            'role'       => $data['role'],
            'status'     => 'active',
            'admin_code' => $adminCode,
        ]);

        if (! empty($data['center_ids']) && $data['role'] === 'admin') {
            $this->adminRepository->syncCenters($admin, (array) $data['center_ids']);
        }

        return $admin;
    }

    /**
     * @param int                  $id
     * @param array<string, mixed> $data
     */
    public function updateAdmin(int $id, array $data): Admin
    {
        $targetAdmin = $this->adminRepository->find($id);

        if ($targetAdmin->isSuperAdmin() && $data['role'] !== 'super_admin') {
            throw new \InvalidArgumentException('Không thể hạ cấp tài khoản Quản trị viên tối cao (Super Admin). Hệ thống phải luôn duy trì 1 Super Admin.');
        }

        if (! $targetAdmin->isSuperAdmin() && $data['role'] === 'super_admin') {
            $hasOtherSuperAdmin = Admin::where('role', 'super_admin')->where('id', '!=', $id)->exists();

            if ($hasOtherSuperAdmin) {
                throw new \InvalidArgumentException('Hệ thống chỉ cho phép duy nhất 1 tài khoản Quản trị viên tối cao (Super Admin).');
            }
        }

        $updateData = [
            'full_name' => $data['full_name'],
            'email'     => $data['email'] ?? null,
            'phone'     => $data['phone'] ?? null,
            'role'      => $data['role'],
        ];

        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make((string) $data['password']);
        }

        $admin = $this->adminRepository->update($id, $updateData);

        if ($data['role'] === 'admin') {
            $this->adminRepository->syncCenters($admin, (array) ($data['center_ids'] ?? []));
        } else {
            $this->adminRepository->syncCenters($admin, []);
        }

        return $admin;
    }

    public function deleteAdmin(int $id, int $currentAdminId): bool
    {
        $targetAdmin = $this->adminRepository->find($id);

        if ($targetAdmin->isSuperAdmin()) {
            throw new \InvalidArgumentException('Tài khoản Quản trị viên tối cao (Super Admin) không thể bị xóa.');
        }

        if ($currentAdminId === $id) {
            throw new \InvalidArgumentException('Bạn không thể tự xóa tài khoản Quản trị viên của chính mình.');
        }

        return $this->adminRepository->delete($id);
    }
}
