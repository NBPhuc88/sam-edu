<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExamType\StoreExamTypeRequest;
use App\Http\Requests\ExamType\UpdateExamTypeRequest;
use App\Models\Admin;
use App\Services\ExamType\ExamTypeServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ExamTypeController extends Controller
{
    public function __construct(
        protected ExamTypeServiceInterface $examTypeService
    ) {
    }

    protected function getAuthAdmin(): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }

    public function index(Request $request): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $search   = $request->input('search');
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $status   = $request->input('status');
        $page     = $request->integer('page', 1);
        $perPage  = $request->integer('per_page', config('app.pagination_per_page', 20));

        $examTypes = $this->examTypeService->getPaginatedExamTypes(
            is_string($search) ? $search : null,
            $centerId,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $admin
        );

        $formData = $this->examTypeService->getFormData($admin);

        return Inertia::render('Admin/ExamTypes/Index', [
            'examTypes' => $examTypes,
            'centers'   => $formData['centers'],
            'filters'   => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
                'status'    => $status ?? 'all',
                'per_page'  => $perPage,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $formData = $this->examTypeService->getFormData($admin);

        return Inertia::render('Admin/ExamTypes/Create', [
            'centers' => $formData['centers'],
        ]);
    }

    public function store(StoreExamTypeRequest $request): RedirectResponse
    {
        $admin    = $this->getAuthAdmin();
        $examType = $this->examTypeService->createExamType($request->validated(), $admin);

        return redirect()->route('exam-types.index')->with('success', "Đã tạo loại đề thi '{$examType->name}' thành công.");
    }

    public function edit(int $id): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $examType = $this->examTypeService->findExamType($id, $admin);
        $formData = $this->examTypeService->getFormData($admin);

        return Inertia::render('Admin/ExamTypes/Edit', [
            'examType' => $examType,
            'centers'  => $formData['centers'],
        ]);
    }

    public function update(UpdateExamTypeRequest $request, int $id): RedirectResponse
    {
        $admin    = $this->getAuthAdmin();
        $examType = $this->examTypeService->updateExamType($id, $request->validated(), $admin);

        return redirect()->route('exam-types.index')->with('success', "Đã cập nhật loại đề thi '{$examType->name}' thành công.");
    }

    public function destroy(int $id): RedirectResponse
    {
        $admin    = $this->getAuthAdmin();
        $examType = $this->examTypeService->findExamType($id, $admin);
        $name     = $examType->name;

        $this->examTypeService->deleteExamType($id, $admin);

        return redirect()->route('exam-types.index')->with('success', "Đã xóa loại đề thi '{$name}' thành công.");
    }
}
