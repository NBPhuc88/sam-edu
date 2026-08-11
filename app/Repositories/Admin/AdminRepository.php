<?php

namespace App\Repositories\Admin;

use App\Models\Admin;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminRepository implements AdminRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Admin::where('username', $username)->orWhere('email', $username)->first();

        return $admin;
    }

    public function find(int $id): Admin
    {
        return Admin::findOrFail($id);
    }

    public function paginate(int $perPage = 15, ?string $search = null, ?string $role = null): LengthAwarePaginator
    {
        return Admin::query()
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
                $query->where('role', $role);
            })
            ->latest()
            ->paginate($perPage);
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
}
