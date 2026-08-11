<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Center;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Display a listing of system Administrators (Super Admin only).
     * @param Request $request
     */
    public function index(Request $request): Response
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        // Chỉ Super Admin mới có quyền quản lý danh sách Admins
        if (! $currentAdmin || ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Bạn không có quyền truy cập quản lý Quản trị viên hệ thống.');
        }

        $search = (string) $request->input('search', '');
        $role   = (string) $request->input('role', '');

        $admins = Admin::query()
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
            ->paginate(15)
            ->withQueryString();

        $centers = Center::select('id', 'name', 'code')->orderBy('name')->get();

        return Inertia::render('Admin/Admins/Index', [
            'admins'  => $admins,
            'centers' => $centers,
            'filters' => [
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

        $admin = Admin::create([
            'username'   => $validated['username'],
            'full_name'  => $validated['full_name'],
            'email'      => $validated['email'] ?? null,
            'phone'      => $validated['phone'] ?? null,
            'password'   => Hash::make($validated['password']),
            'role'       => $validated['role'],
            'status'     => 'active',
            'admin_code' => 'ADM' . str_pad((string) (Admin::max('id') + 1), 4, '0', STR_PAD_LEFT),
        ]);

        if (! empty($validated['center_ids']) && $validated['role'] === 'admin') {
            $admin->centers()->sync($validated['center_ids']);
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

        $admin = Admin::findOrFail($id);

        $validated = $request->validate([
            'full_name'    => ['required', 'string', 'max:100'],
            'email'        => ['nullable', 'email', 'max:100', Rule::unique('admins', 'email')->ignore($admin->id)],
            'phone'        => ['nullable', 'string', 'max:20'],
            'password'     => ['nullable', 'string', 'min:6'],
            'role'         => ['required', Rule::in(['super_admin', 'admin'])],
            'center_ids'   => ['array'],
            'center_ids.*' => ['exists:centers,id'],
        ]);

        $updateData = [
            'full_name' => $validated['full_name'],
            'email'     => $validated['email'] ?? null,
            'phone'     => $validated['phone'] ?? null,
            'role'      => $validated['role'],
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $admin->update($updateData);

        if ($validated['role'] === 'admin') {
            $admin->centers()->sync($validated['center_ids'] ?? []);
        } else {
            // Super admin quản lý tất cả, gỡ phân công riêng
            $admin->centers()->detach();
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

        if ($currentAdmin->id === $id) {
            return redirect()->back()->with('error', 'Bạn không thể tự xóa tài khoản Quản trị viên của chính mình.');
        }

        $admin = Admin::findOrFail($id);
        $admin->centers()->detach();
        $admin->delete();

        return redirect()->back()->with('success', 'Xóa tài khoản Quản trị viên thành công!');
    }
}
