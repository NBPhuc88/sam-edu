<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\FilterAdminRequest;
use App\Http\Requests\Admin\StoreAdminRequest;
use App\Http\Requests\Admin\UpdateAdminRequest;
use App\Models\Admin;
use App\Services\Admin\AdminServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __construct(
        protected AdminServiceInterface $adminService
    ) {
    }

    /**
     * Display a listing of system Administrators (Super Admin only).
     * @param FilterAdminRequest $request
     */
    public function index(FilterAdminRequest $request): Response
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if (! $currentAdmin || ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Bạn không có quyền truy cập quản lý Quản trị viên hệ thống.');
        }

        $search   = (string) $request->input('search', '');
        $role     = (string) $request->input('role', '');
        $perPage  = $request->integer('per_page', config('app.pagination_per_page', 20));
        $admins   = $this->adminService->getPaginatedAdmins($perPage, $search ?: null, $role ?: 'admin');
        $formData = $this->adminService->getFormData();

        return Inertia::render('Admin/Admins/Index', [
            'admins'        => $admins,
            'centers'       => $formData['centers'],
            'hasSuperAdmin' => $formData['hasSuperAdmin'],
            'filters'       => [
                'search'   => $search,
                'role'     => $role,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created Administrator in storage.
     * @param StoreAdminRequest $request
     */
    public function store(StoreAdminRequest $request): RedirectResponse
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if (! $currentAdmin || ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Bạn không có quyền tạo mới Quản trị viên.');
        }

        try {
            $this->adminService->createAdmin($request->validated());
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', 'Tạo tài khoản Quản trị viên thành công!');
    }

    /**
     * Update the specified Administrator in storage.
     * @param UpdateAdminRequest $request
     * @param int                $id
     */
    public function update(UpdateAdminRequest $request, int $id): RedirectResponse
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if (! $currentAdmin || ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Bạn không có quyền cập nhật Quản trị viên.');
        }

        try {
            $this->adminService->updateAdmin($id, $request->validated());
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', 'Cập nhật tài khoản Quản trị viên thành công!');
    }

    /**
     * Remove the specified Administrator from storage.
     * @param int $id
     */
    public function destroy(int $id): RedirectResponse
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if (! $currentAdmin || ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Bạn không có quyền xóa Quản trị viên.');
        }

        try {
            $this->adminService->deleteAdmin($id, $currentAdmin->id);
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', 'Xóa tài khoản Quản trị viên thành công!');
    }
}
