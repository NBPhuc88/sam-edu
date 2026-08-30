<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubscriptionPlan\FilterSubscriptionPlanRequest;
use App\Http\Requests\SubscriptionPlan\StoreSubscriptionPlanRequest;
use App\Http\Requests\SubscriptionPlan\UpdateSubscriptionPlanRequest;
use App\Models\Admin;
use App\Services\Subscription\SubscriptionPlanServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SubscriptionPlanController extends Controller
{
    public function __construct(
        protected SubscriptionPlanServiceInterface $planService
    ) {
    }

    protected function getAuthAdmin(): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }

    public function index(FilterSubscriptionPlanRequest $request): InertiaResponse
    {
        $search  = $request->input('search');
        $type    = $request->input('type');
        $page    = $request->integer('page', 1);
        $perPage = $request->integer('per_page', config('app.pagination_per_page', 20));

        $plans = $this->planService->getPaginatedPlans(
            is_string($search) && $search !== '' ? $search : null,
            is_string($type) && $type !== '' ? $type : null,
            $perPage,
            $page
        );

        $stats = $this->planService->getStats();

        return Inertia::render('Admin/Plans/Index', [
            'plans'   => $plans,
            'stats'   => $stats,
            'filters' => [
                'search'   => $search ?? '',
                'type'     => $type ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('Admin/Plans/Create');
    }

    public function store(StoreSubscriptionPlanRequest $request): RedirectResponse
    {
        $plan = $this->planService->createPlan($request->validated());

        return redirect()->route('plans.index')
            ->with('success', "Tạo mới gói cước '{$plan->name}' thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        $plan = $this->planService->getPlanById($id);

        return Inertia::render('Admin/Plans/Edit', [
            'plan' => $plan,
        ]);
    }

    public function update(UpdateSubscriptionPlanRequest $request, int $id): RedirectResponse
    {
        $plan = $this->planService->updatePlan($id, $request->validated());

        return redirect()->route('plans.index')
            ->with('success', "Cập nhật gói cước '{$plan->name}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->planService->deletePlan($id);

        return redirect()->route('plans.index')
            ->with('success', 'Xóa gói cước thành công!');
    }
}
