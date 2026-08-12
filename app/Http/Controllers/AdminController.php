<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Center;
use App\Services\Admin\AdminServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
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
     * @param Request $request
     */
    public function index(Request $request): Response
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if (! $currentAdmin || ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Bạn không có quyền truy cập quản lý Quản trị viên hệ thống.');
        }

        $search  = (string) $request->input('search', '');
        $role    = (string) $request->input('role', '');
        $admins  = $this->adminService->getPaginatedAdmins(15, $search ?: null, $role ?: null);
        $centers = Center::select('id', 'name', 'code')->orderBy('name')->get();

        return Inertia::render('Admin/Admins/Index', [
            'admins'        => $admins,
            'centers'       => $centers,
            'hasSuperAdmin' => Admin::where('role', 'super_admin')->exists(),
            'filters'       => [
                'search' => $search,
                'role'   => $role,
            ],
        ]);
    }

    /**
     * Store a newly created Administrator in storage.
     * @param Request $request
     */
    public function store(Request $request): RedirectResponse
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if (! $currentAdmin || ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Bạn không có quyền tạo mới Quản trị viên.');
        }

        $validated = $request->validate([
            'username'     => ['required', 'string', 'max:50', 'unique:admins,username'],
            'full_name'    => ['required', 'string', 'max:100'],
            'email'        => ['nullable', 'email', 'max:100', 'unique:admins,email'],
            'phone'        => ['nullable', 'string', 'max:20'],
            'password'     => ['required', 'string', 'min:6'],
            'role'         => ['required', Rule::in(['super_admin', 'admin'])],
            'center_ids'   => ['array'],
            'center_ids.*' => ['exists:centers,id'],
        ]);

        try {
            $this->adminService->createAdmin($validated);
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', 'Tạo tài khoản Quản trị viên thành công!');
    }

    /**
     * Update the specified Administrator in storage.
     * @param Request $request
     * @param int     $id
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if (! $currentAdmin || ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Bạn không có quyền cập nhật Quản trị viên.');
        }

        $validated = $request->validate([
            'full_name'    => ['required', 'string', 'max:100'],
            'email'        => ['nullable', 'email', 'max:100', Rule::unique('admins', 'email')->ignore($id)],
            'phone'        => ['nullable', 'string', 'max:20'],
            'password'     => ['nullable', 'string', 'min:6'],
            'role'         => ['required', Rule::in(['super_admin', 'admin'])],
            'center_ids'   => ['array'],
            'center_ids.*' => ['exists:centers,id'],
        ]);

        try {
            $this->adminService->updateAdmin($id, $validated);
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
