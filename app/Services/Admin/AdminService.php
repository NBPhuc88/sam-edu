<?php

namespace App\Services\Admin;

use App\Enums\Constant;
use App\Mail\AccountCreatedMail;
use App\Mail\EmailChangedMail;
use App\Mail\PasswordChangedMail;
use App\Mail\UsernameChangedMail;
use App\Models\Admin;
use App\Repositories\Admin\AdminRepositoryInterface;
use App\Repositories\Center\CenterRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AdminService implements AdminServiceInterface
{
    public function __construct(
        protected AdminRepositoryInterface $adminRepository,
        protected CenterRepositoryInterface $centerRepository
    ) {
    }

    public function getPaginatedAdmins(int $perPage = Constant::DEFAULT_PER_PAGE, ?string $search = null, ?string $role = null): LengthAwarePaginator
    {
        return $this->adminRepository->paginate($perPage, $search, $role);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createAdmin(array $data): Admin
    {
        if ($data['role'] === Constant::ROLE_SUPER_ADMIN) {
            $hasSuperAdmin = $this->adminRepository->hasSuperAdmin();

            if ($hasSuperAdmin) {
                throw new \InvalidArgumentException('Hệ thống chỉ cho phép duy nhất 1 tài khoản Quản trị viên tối cao (Super Admin).');
            }
        }

        $adminCode = $this->adminRepository->getNextAdminCode();

        $admin = $this->adminRepository->create([
            'username'   => $data['username'],
            'full_name'  => $data['full_name'],
            'email'      => $data['email'] ?? null,
            'phone'      => $data['phone'] ?? null,
            'password'   => Hash::make((string) $data['password']),
            'role'       => $data['role'],
            'status'     => Constant::STATUS_ACTIVE,
            'admin_code' => $adminCode,
        ]);

        if ($data['role'] === Constant::ROLE_ADMIN) {
            $centerId = $data['center_id'] ?? ($data['center_ids'][0] ?? null);

            if ($centerId) {
                $this->adminRepository->syncCenters($admin, [(int) $centerId]);
            }
        }

        if (! empty($admin->email)) {
            $center      = $admin->centers()->first();
            $centerName  = $center ? $center->name : ($admin->isSuperAdmin() ? 'Toàn Hệ Thống' : null);
            $roleLabel   = $admin->isSuperAdmin() ? 'Quản trị viên Tối cao (Super Admin)' : 'Quản trị viên Trung tâm (Admin)';
            $rawPassword = ! empty($data['password']) ? (string) $data['password'] : null;

            Mail::to($admin->email)->queue(
                new AccountCreatedMail(
                    fullName: $admin->full_name,
                    username: $admin->username,
                    roleLabel: $roleLabel,
                    userCode: $admin->admin_code ?? $adminCode,
                    rawPassword: $rawPassword,
                    centerName: $centerName,
                    loginUrl: url('/admins')
                )
            );
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

        if ($targetAdmin->isSuperAdmin() && $data['role'] !== Constant::ROLE_SUPER_ADMIN) {
            throw new \InvalidArgumentException('Không thể hạ cấp tài khoản Quản trị viên tối cao (Super Admin). Hệ thống phải luôn duy trì 1 Super Admin.');
        }

        if (! $targetAdmin->isSuperAdmin() && $data['role'] === Constant::ROLE_SUPER_ADMIN) {
            $hasOtherSuperAdmin = $this->adminRepository->hasOtherSuperAdmin($id);

            if ($hasOtherSuperAdmin) {
                throw new \InvalidArgumentException('Hệ thống chỉ cho phép duy nhất 1 tài khoản Quản trị viên tối cao (Super Admin).');
            }
        }

        $oldEmail          = $targetAdmin->email;
        $oldUsername       = $targetAdmin->username;
        $isPassChanged     = ! empty($data['password']);
        $newEmail          = array_key_exists('email', $data) ? (! empty($data['email']) ? trim($data['email']) : null) : $targetAdmin->email;
        $newUsername       = array_key_exists('username', $data) ? (! empty($data['username']) ? trim($data['username']) : null) : $targetAdmin->username;
        $isEmailChanged    = $newEmail && $oldEmail !== $newEmail;
        $isUsernameChanged = $newUsername && $oldUsername !== $newUsername;

        $updateData = [
            'full_name' => $data['full_name'],
            'username'  => $newUsername,
            'email'     => $newEmail,
            'phone'     => $data['phone'] ?? null,
            'role'      => $data['role'],
        ];

        if ($isPassChanged) {
            $updateData['password'] = Hash::make((string) $data['password']);
        }

        $admin = $this->adminRepository->update($id, $updateData);

        if ($data['role'] === Constant::ROLE_ADMIN) {
            $centerId = $data['center_id'] ?? ($data['center_ids'][0] ?? null);
            $this->adminRepository->syncCenters($admin, $centerId ? [(int) $centerId] : []);
        } else {
            $this->adminRepository->syncCenters($admin, []);
        }

        $roleLabel  = $admin->role === Constant::ROLE_SUPER_ADMIN ? 'Quản trị viên tối cao' : 'Quản trị viên';
        $centerName = $admin->centers->first()?->name;

        if ($isPassChanged && ! empty($admin->email)) {
            Mail::to($admin->email)->queue(
                new PasswordChangedMail(
                    fullName: $admin->full_name,
                    username: $admin->username,
                    roleLabel: $roleLabel,
                    centerName: $centerName,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: url('/admins')
                )
            );
        }

        if ($isUsernameChanged && ! empty($admin->email)) {
            Mail::to($admin->email)->queue(
                new UsernameChangedMail(
                    fullName: $admin->full_name,
                    oldUsername: (string) $oldUsername,
                    newUsername: (string) $newUsername,
                    roleLabel: $roleLabel,
                    centerName: $centerName,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: url('/admins')
                )
            );
        }

        if ($isEmailChanged) {
            Mail::to($newEmail)->queue(
                new EmailChangedMail(
                    fullName: $admin->full_name,
                    username: $admin->username,
                    oldEmail: (string) $oldEmail,
                    newEmail: (string) $newEmail,
                    roleLabel: $roleLabel,
                    centerName: $centerName,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: url('/admins')
                )
            );
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

    /**
     * @return array<string, mixed>
     */
    public function getFormData(): array
    {
        return [
            'centers'       => $this->centerRepository->getCenterListForDropdown(),
            'hasSuperAdmin' => $this->adminRepository->hasSuperAdmin(),
        ];
    }
}
