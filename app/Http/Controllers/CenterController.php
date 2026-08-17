<?php

namespace App\Http\Controllers;

use App\Http\Requests\Center\FilterCenterRequest;
use App\Http\Requests\Center\StoreCenterRequest;
use App\Http\Requests\Center\UpdateCenterRequest;
use App\Services\Center\CenterServiceInterface;
use Illuminate\Http\RedirectResponse;
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
     * @param FilterCenterRequest $request
     */
    public function index(FilterCenterRequest $request): Response
    {
        $search  = $request->query('search');
        $perPage = $request->integer('per_page', config('app.pagination_per_page', 20));
        $centers = $this->centerService->getPaginatedCenters($perPage, is_string($search) ? $search : null);

        return Inertia::render('Admin/Centers/Index', [
            'centers' => $centers,
            'filters' => [
                'search'   => $search ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show center creation form.
     */
    public function create(): Response
    {
        $subscriptionPlans = $this->centerService->getSubscriptionPlans();

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
        $subscriptionPlans = $this->centerService->getSubscriptionPlans();

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
