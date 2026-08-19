<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClassExam\FilterClassExamRequest;
use App\Http\Requests\ClassExam\StoreClassExamRequest;
use App\Http\Requests\ClassExam\UpdateClassExamRequest;
use App\Models\Admin;
use App\Services\ClassExam\ClassExamServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ClassExamController extends Controller
{
    public function __construct(
        protected ClassExamServiceInterface $classExamService
    ) {
    }

    protected function getAuthAdmin(): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }

    public function index(FilterClassExamRequest $request): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $search   = $request->input('search');
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId  = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $examId   = $request->input('exam_id') ? (int) $request->input('exam_id') : null;
        $status   = $request->input('status');
        $page     = $request->integer('page', 1);
        $perPage  = $request->integer('per_page', config('app.pagination_per_page', 15));

        $classExams = $this->classExamService->getPaginatedClassExams(
            is_string($search) ? $search : null,
            $centerId,
            $classId,
            $examId,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $admin
        );
        $formData = $this->classExamService->getFormData($admin);
        $stats    = $this->classExamService->getStats($admin);

        return Inertia::render('Admin/ClassExams/Index', [
            'classExams' => $classExams,
            'centers'    => $formData['centers'],
            'classes'    => $formData['classes'],
            'exams'      => $formData['exams'],
            'stats'      => $stats,
            'filters'    => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
                'class_id'  => $classId,
                'exam_id'   => $examId,
                'status'    => $status ?? 'all',
                'per_page'  => $perPage,
            ],
        ]);
    }

    public function store(StoreClassExamRequest $request): RedirectResponse
    {
        $admin     = $this->getAuthAdmin();
        $classExam = $this->classExamService->createClassExam($request->validated(), $admin);

        return redirect()->back()
            ->with('success', "Gán bài thi '{$classExam->title}' cho lớp {$classExam->schoolClass?->name} thành công!");
    }

    public function update(UpdateClassExamRequest $request, int $id): RedirectResponse
    {
        $admin     = $this->getAuthAdmin();
        $classExam = $this->classExamService->updateClassExam($id, $request->validated(), $admin);

        return redirect()->back()
            ->with('success', "Cập nhật kỳ thi '{$classExam->title}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->classExamService->deleteClassExam($id, $admin);

        return redirect()->back()
            ->with('success', 'Đã hủy / xóa kỳ thi của lớp thành công!');
    }
}
