<?php

namespace App\Http\Controllers;

use App\Http\Requests\Subject\StoreSubjectRequest;
use App\Http\Requests\Subject\UpdateSubjectRequest;
use App\Models\Admin;
use App\Services\Subject\SubjectServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SubjectController extends Controller
{
    public function __construct(
        protected SubjectServiceInterface $subjectService
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

        $subjects = $this->subjectService->getPaginatedSubjects(
            is_string($search) ? $search : null,
            $centerId,
            is_string($status) ? $status : null,
            15,
            $page,
            $admin
        );

        $formData = $this->subjectService->getFormData($admin);

        return Inertia::render('Admin/Subjects/Index', [
            'subjects' => $subjects,
            'centers'  => $formData['centers'],
            'filters'  => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
                'status'    => $status ?? 'all',
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $formData = $this->subjectService->getFormData($admin);

        return Inertia::render('Admin/Subjects/Create', [
            'centers' => $formData['centers'],
        ]);
    }

    public function store(StoreSubjectRequest $request): RedirectResponse
    {
        $admin   = $this->getAuthAdmin();
        $subject = $this->subjectService->createSubject($request->validated(), $admin);

        return redirect()->route('subjects.index')
            ->with('success', "Thêm môn học '{$subject->name}' thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $subject  = $this->subjectService->findSubject($id, $admin);
        $formData = $this->subjectService->getFormData($admin);

        return Inertia::render('Admin/Subjects/Edit', [
            'subject' => $subject,
            'centers' => $formData['centers'],
        ]);
    }

    public function update(UpdateSubjectRequest $request, int $id): RedirectResponse
    {
        $admin   = $this->getAuthAdmin();
        $subject = $this->subjectService->updateSubject($id, $request->validated(), $admin);

        return redirect()->route('subjects.index')
            ->with('success', "Cập nhật môn học '{$subject->name}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->subjectService->deleteSubject($id, $admin);

        return redirect()->route('subjects.index')
            ->with('success', 'Xóa môn học thành công!');
    }
}
