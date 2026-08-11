<?php

namespace App\Http\Controllers;

use App\Http\Requests\Center\StoreCenterRequest;
use App\Http\Requests\Center\UpdateCenterRequest;
use App\Models\SubscriptionPlan;
use App\Services\Center\CenterServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
     * @param Request $request
     */
    public function index(Request $request): Response
    {
        $search  = $request->query('search');
        $centers = $this->centerService->getPaginatedCenters(15, is_string($search) ? $search : null);

        return Inertia::render('Admin/Centers/Index', [
            'centers' => $centers,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Show center creation form.
     */
    public function create(): Response
    {
        $subscriptionPlans = SubscriptionPlan::orderBy('price', 'asc')->get();

        return Inertia::render('Admin/Centers/Create', [
            'subscriptionPlans' => $subscriptionPlans,
        ]);
    }

    /**
     * Store a newly created center.
     * @param StoreCenterRequest $request
     */
    public function store(StoreCenterRequest $request): RedirectResponse
    {
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
        $center            = $this->centerService->getCenterById($id);
        $subscriptionPlans = SubscriptionPlan::orderBy('price', 'asc')->get();

        return Inertia::render('Admin/Centers/Edit', [
            'center'            => $center,
            'subscriptionPlans' => $subscriptionPlans,
        ]);
    }

    /**
     * Update center (only modified/changed fields).
     * @param UpdateCenterRequest $request
     * @param int                 $id
     */
    public function update(UpdateCenterRequest $request, int $id): RedirectResponse
    {
        $validated = $request->validated();
        $this->centerService->updateCenter($id, $validated);

        return redirect()->route('centers.index')->with('success', 'Cập nhật thông tin trung tâm thành công!');
    }

    /**
     * Delete center by ID.
     * @param int $id
     */
    public function destroy(int $id): RedirectResponse
    {
        $this->centerService->deleteCenter($id);

        return back()->with('success', 'Xóa trung tâm thành công!');
    }
}
