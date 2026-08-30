<?php

namespace App\Http\Controllers;

use App\Enums\Constant;
use App\Http\Requests\Permission\UpdateRolePermissionsRequest;
use App\Services\Permission\PermissionServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PermissionController extends Controller
{
    public function __construct(
        protected PermissionServiceInterface $permissionService
    ) {
    }

    /**
     * Hiển thị ma trận phân quyền hệ thống.
     */
    public function index(): Response
    {
        $matrixData = $this->permissionService->getMatrixData();

        return Inertia::render('Admin/Permissions/Index', [
            'modules'    => $matrixData['modules'],
            'roleGrants' => $matrixData['roleGrants'],
            'roles'      => $matrixData['roles'],
        ]);
    }

    /**
     * Cập nhật danh sách quyền cho vai trò.
     * @param UpdateRolePermissionsRequest $request
     */
    public function update(UpdateRolePermissionsRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->permissionService->updateRolePermissions(
            (int) $validated['role'],
            $validated['permissions']
        );

        return back()->with('success', 'Cập nhật phân quyền thành công.');
    }

    /**
     * Khôi phục phân quyền mặc định.
     * @param Request $request
     */
    public function reset(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['nullable', 'integer', Rule::in(Constant::ROLE_PERMISSION_ROLES)],
        ]);

        $role = $validated['role'] ?? null;

        $this->permissionService->resetToDefault($role !== null ? (int) $role : null);

        return back()->with('success', 'Khôi phục phân quyền mặc định thành công.');
    }

    /**
     * Tự động quét và đồng bộ permissions mới từ config/permissions.php.
     */
    public function sync(): RedirectResponse
    {
        $this->permissionService->syncPermissions();

        return back()->with('success', 'Đồng bộ danh mục quyền từ file cấu hình thành công.');
    }
}
