<?php

namespace App\Repositories\Admin;

use App\Enums\Constant;
use App\Models\Admin;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminRepository implements AdminRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Admin
    {
        $isMysql = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'mysql';

        /** @var Admin|null $admin */
        $admin = Admin::where(function ($query) use ($username, $isMysql) {
            if ($isMysql) {
                $query->whereRaw('BINARY username = ?', [$username]);
            } else {
                $query->where('username', $username);
            }
            $query->orWhere('email', $username);
        })->first();

        return $admin;
    }

    public function find(int $id): Admin
    {
        return Admin::findOrFail($id);
    }

    public function paginate(int $perPage = Constant::DEFAULT_PER_PAGE, ?string $search = null, ?string $role = null): LengthAwarePaginator
    {
        return Admin::query()
            ->select(
                'id',
                'admin_code',
                'full_name',
                'username',
                'email',
                'phone',
                'role',
                'status',
                'created_at'
            )
            ->with('centers:id,name,code')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($role, function ($query, $role) {
                $roleVal = ($role === 'super_admin' || $role === 1 || $role === '1') ? Constant::ROLE_SUPER_ADMIN : (($role === 'admin' || $role === 2 || $role === '2') ? Constant::ROLE_ADMIN : $role);
                $query->where('role', $roleVal);
            })
            ->latest()
            ->deferredPaginate($perPage)
            ->withQueryString();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): Admin
    {
        return Admin::create($data);
    }

    /**
     * @param int                  $id
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): Admin
    {
        $admin = $this->find($id);
        $admin->update($data);

        return $admin->fresh();
    }

    public function delete(int $id): bool
    {
        $admin = $this->find($id);
        $admin->centers()->detach();

        return (bool) $admin->delete();
    }

    /**
     * @param Admin           $admin
     * @param array<int, int> $centerIds
     */
    public function syncCenters(Admin $admin, array $centerIds): void
    {
        $admin->centers()->sync($centerIds);
    }

    public function hasSuperAdmin(): bool
    {
        return Admin::where('role', Constant::ROLE_SUPER_ADMIN)->exists();
    }

    public function hasOtherSuperAdmin(int $id): bool
    {
        return Admin::where('role', Constant::ROLE_SUPER_ADMIN)->where('id', '!=', $id)->exists();
    }

    public function getNextAdminCode(): string
    {
        return Constant::PREFIX_ADMIN . str_pad((string) (Admin::max('id') + 1), Constant::CODE_PAD_LENGTH, Constant::CODE_PAD_CHAR, STR_PAD_LEFT);
    }
}
