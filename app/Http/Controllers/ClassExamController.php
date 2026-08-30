<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClassExam\FilterClassExamRequest;
use App\Http\Requests\ClassExam\StoreClassExamRequest;
use App\Http\Requests\ClassExam\UpdateClassExamRequest;
use App\Models\Admin;
use App\Models\Teacher;
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

    protected function getAuthUser(): array
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();
        /** @var Teacher|null $teacher */
        $teacher = Auth::guard('teacher')->user();

        return [$admin, $teacher];
    }

    public function index(FilterClassExamRequest $request): InertiaResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $search            = $request->input('search');
        $centerId          = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId           = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $examId            = $request->input('exam_id') ? (int) $request->input('exam_id') : null;
        $status            = $request->input('status');
        $page              = $request->integer('page', 1);
        $perPage           = $request->integer('per_page', config('app.pagination_per_page', 15));

        $classExams = $this->classExamService->getPaginatedClassExams(
            is_string($search) ? $search : null,
            $centerId,
            $classId,
            $examId,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $admin,
            $teacher
        );
        $formData = $this->classExamService->getFormData($admin, $teacher);
        $stats    = $this->classExamService->getStats($admin, $teacher);

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
                'status'    => $status ?? '',
                'per_page'  => $perPage,
            ],
            'isTeacher' => (bool) $teacher,
        ]);
    }

    public function store(StoreClassExamRequest $request): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $classExam         = $this->classExamService->createClassExam($request->validated(), $admin, $teacher);

        return redirect()->back()
            ->with('success', "Gán bài thi '{$classExam->title}' cho lớp {$classExam->schoolClass?->name} thành công!");
    }

    public function update(UpdateClassExamRequest $request, int $id): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $classExam         = $this->classExamService->updateClassExam($id, $request->validated(), $admin, $teacher);

        return redirect()->back()
            ->with('success', "Cập nhật kỳ thi '{$classExam->title}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $this->classExamService->deleteClassExam($id, $admin, $teacher);

        return redirect()->back()
            ->with('success', 'Đã hủy / xóa kỳ thi của lớp thành công!');
    }
}
