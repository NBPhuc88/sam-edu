<?php

namespace App\Http\Controllers;

use App\Http\Requests\Center\FilterCenterRequest;
use App\Http\Requests\Center\RenewCenterSubscriptionRequest;
use App\Http\Requests\Center\StoreCenterRequest;
use App\Http\Requests\Center\UpdateCenterRequest;
use App\Models\Admin;
use App\Services\Center\CenterServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CenterController extends Controller
{
    public function __construct(
        protected CenterServiceInterface $centerService
    ) {
    }

    /**
     * Display list of centers.
     * Admin phụ sẽ được chuyển hướng thẳng tới trang chi tiết Trung tâm do mình quản lý.
     * @param FilterCenterRequest $request
     */
    public function index(FilterCenterRequest $request): Response|RedirectResponse
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if ($currentAdmin && ! $currentAdmin->isSuperAdmin()) {
            $assignedCenterId = $currentAdmin->assignedCenterId();

            if ($assignedCenterId) {
                return redirect()->route('centers.edit', ['id' => $assignedCenterId]);
            }

            abort(403, 'Tài khoản của bạn chưa được phân công quản lý trung tâm nào.');
        }

        $search            = $request->query('search');
        $perPage           = $request->integer('per_page', config('app.pagination_per_page', 20));
        $centers           = $this->centerService->getPaginatedCenters($perPage, is_string($search) ? $search : null);
        $subscriptionPlans = $this->centerService->getSubscriptionPlans();

        return Inertia::render('Admin/Centers/Index', [
            'centers'           => $centers,
            'subscriptionPlans' => $subscriptionPlans,
            'filters'           => [
                'search'   => $search ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show center creation form. (Chỉ dành cho Super Admin)
     */
    public function create(): Response
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if ($currentAdmin && ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Quản trị viên phụ không có quyền thêm mới trung tâm.');
        }

        $subscriptionPlans = $this->centerService->getSubscriptionPlans();

        return Inertia::render('Admin/Centers/Create', [
            'subscriptionPlans' => $subscriptionPlans,
        ]);
    }

    /**
     * Store a newly created center. (Chỉ dành cho Super Admin)
     * @param StoreCenterRequest $request
     */
    public function store(StoreCenterRequest $request): RedirectResponse
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if ($currentAdmin && ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Quản trị viên phụ không có quyền thêm mới trung tâm.');
        }

        $validated = $request->validated();
        $this->centerService->createCenter($validated);

        return redirect()->route('centers.index')->with('success', 'Tạo trung tâm mới thành công!');
    }

    /**
     * Show edit center form.
     * @param int $id
     */
    public function edit(int $id): Response
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if ($currentAdmin && ! $currentAdmin->isSuperAdmin()) {
            $assignedCenterId = $currentAdmin->assignedCenterId();

            if (! $assignedCenterId || $assignedCenterId !== $id) {
                abort(403, 'Bạn chỉ có quyền xem/chỉnh sửa thông tin trung tâm do mình quản lý.');
            }
        }

        $center            = $this->centerService->getCenterById($id);
        $subscriptionPlans = $this->centerService->getSubscriptionPlans();
        $subscriptions     = $this->centerService->getCenterSubscriptions($id);

        return Inertia::render('Admin/Centers/Edit', [
            'center'            => $center,
            'subscriptionPlans' => $subscriptionPlans,
            'subscriptions'     => $subscriptions,
        ]);
    }

    /**
     * Update center (only modified/changed fields).
     * @param UpdateCenterRequest $request
     * @param int                 $id
     */
    public function update(UpdateCenterRequest $request, int $id): RedirectResponse
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if ($currentAdmin && ! $currentAdmin->isSuperAdmin()) {
            $assignedCenterId = $currentAdmin->assignedCenterId();

            if (! $assignedCenterId || $assignedCenterId !== $id) {
                abort(403, 'Bạn chỉ có quyền cập nhật thông tin trung tâm do mình quản lý.');
            }
        }

        $validated = $request->validated();
        $this->centerService->updateCenter($id, $validated);

        $redirectRoute = ($currentAdmin && ! $currentAdmin->isSuperAdmin())
            ? redirect()->route('centers.edit', ['id' => $id])
            : redirect()->route('centers.index');

        return $redirectRoute->with('success', 'Cập nhật thông tin trung tâm thành công!');
    }

    /**
     * Renew or change subscription for a center (Super Admin only).
     * @param RenewCenterSubscriptionRequest $request
     * @param int                            $id
     */
    public function renewSubscription(RenewCenterSubscriptionRequest $request, int $id): RedirectResponse
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if ($currentAdmin && ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Chỉ Admin hệ thống mới có quyền gia hạn hoặc đổi gói cước cho trung tâm.');
        }

        $validated = $request->validated();
        $this->centerService->renewOrChangeSubscription($id, $validated);

        return back()->with('success', 'Xử lý gia hạn / đổi gói cước cho trung tâm thành công!');
    }

    /**
     * Delete center by ID. (Chỉ dành cho Super Admin)
     * @param int $id
     */
    public function destroy(int $id): RedirectResponse
    {
        /** @var Admin|null $currentAdmin */
        $currentAdmin = Auth::guard('admin')->user();

        if ($currentAdmin && ! $currentAdmin->isSuperAdmin()) {
            abort(403, 'Quản trị viên phụ không có quyền xóa trung tâm.');
        }

        $this->centerService->deleteCenter($id);

        return back()->with('success', 'Xóa trung tâm thành công!');
    }
}
