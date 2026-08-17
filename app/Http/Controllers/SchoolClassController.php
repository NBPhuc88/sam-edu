<?php

namespace App\Http\Controllers;

use App\Http\Requests\Class\StoreSchoolClassRequest;
use App\Http\Requests\Class\UpdateSchoolClassRequest;
use App\Models\Admin;
use App\Services\Class\SchoolClassServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SchoolClassController extends Controller
{
    public function __construct(
        protected SchoolClassServiceInterface $schoolClassService
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

        $classes = $this->schoolClassService->getPaginatedClasses(
            is_string($search) ? $search : null,
            $centerId,
            is_string($status) ? $status : null,
            15,
            $page,
            $admin
        );

        $formData = $this->schoolClassService->getFormData($admin);

        return Inertia::render('Admin/Classes/Index', [
            'classes' => $classes,
            'centers' => $formData['centers'],
            'filters' => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
                'status'    => $status ?? 'all',
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $formData = $this->schoolClassService->getFormData($admin);

        return Inertia::render('Admin/Classes/Create', [
            'centers'  => $formData['centers'],
            'subjects' => $formData['subjects'],
            'teachers' => $formData['teachers'],
        ]);
    }

    public function store(StoreSchoolClassRequest $request): RedirectResponse
    {
        $admin       = $this->getAuthAdmin();
        $schoolClass = $this->schoolClassService->createClass($request->validated(), $admin);

        return redirect()->route('classes.index')
            ->with('success', "Tạo lớp học '{$schoolClass->name}' thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        $admin       = $this->getAuthAdmin();
        $schoolClass = $this->schoolClassService->findClass($id, $admin);
        $formData    = $this->schoolClassService->getFormData($admin);

        return Inertia::render('Admin/Classes/Edit', [
            'schoolClass' => $schoolClass,
            'centers'     => $formData['centers'],
            'subjects'    => $formData['subjects'],
            'teachers'    => $formData['teachers'],
        ]);
    }

    public function update(UpdateSchoolClassRequest $request, int $id): RedirectResponse
    {
        $admin       = $this->getAuthAdmin();
        $schoolClass = $this->schoolClassService->updateClass($id, $request->validated(), $admin);

        return redirect()->route('classes.index')
            ->with('success', "Cập nhật thông tin lớp học '{$schoolClass->name}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->schoolClassService->deleteClass($id, $admin);

        return redirect()->route('classes.index')
            ->with('success', 'Xóa lớp học thành công!');
    }
}
