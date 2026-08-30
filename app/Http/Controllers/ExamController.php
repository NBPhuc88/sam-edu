<?php

namespace App\Http\Controllers;

use App\Http\Requests\Exam\FilterExamRequest;
use App\Http\Requests\Exam\StoreExamRequest;
use App\Http\Requests\Exam\UpdateExamRequest;
use App\Models\Admin;
use App\Models\Teacher;
use App\Services\Exam\ExamServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ExamController extends Controller
{
    public function __construct(
        protected ExamServiceInterface $examService
    ) {
    }

    protected function getAuthUser(): Admin|Teacher|null
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        if ($admin) {
            return $admin;
        }

        /** @var Teacher|null $teacher */
        $teacher = Auth::guard('teacher')->user();

        return $teacher;
    }

    public function index(FilterExamRequest $request): InertiaResponse
    {
        $user      = $this->getAuthUser();
        $search    = $request->input('search');
        $centerId  = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId   = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $subjectId = $request->input('subject_id') ? (int) $request->input('subject_id') : null;
        $status    = $request->input('status');
        $page      = $request->integer('page', 1);
        $perPage   = $request->integer('per_page', config('app.pagination_per_page', 15));

        $exams = $this->examService->getPaginatedExams(
            is_string($search) ? $search : null,
            $centerId,
            $classId,
            $subjectId,
            null,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $user
        );
        $formData = $this->examService->getFormData($user);
        $stats    = $this->examService->getStats($user);

        return Inertia::render('Admin/Exams/Index', [
            'exams'     => $exams,
            'centers'   => $formData['centers'],
            'classes'   => $formData['classes'],
            'subjects'  => $formData['subjects'],
            'all_exams' => $formData['exams'] ?? [],
            'stats'     => $stats,
            'filters'   => [
                'search'     => $search ?? '',
                'center_id'  => $centerId,
                'class_id'   => $classId,
                'subject_id' => $subjectId,
                'status'     => $status ?? '',
                'per_page'   => $perPage,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        $user     = $this->getAuthUser();
        $formData = $this->examService->getFormData($user);

        return Inertia::render('Admin/Exams/Create', [
            'centers'  => $formData['centers'],
            'classes'  => $formData['classes'],
            'subjects' => $formData['subjects'],
        ]);
    }

    public function store(StoreExamRequest $request): RedirectResponse
    {
        $user = $this->getAuthUser();
        $exam = $this->examService->createExam($request->validated(), $user);

        return redirect()->route('exams.index')
            ->with('success', "Tạo bài kiểm tra '{$exam->name}' thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        $user     = $this->getAuthUser();
        $exam     = $this->examService->findExam($id, $user);
        $formData = $this->examService->getFormData($user);

        return Inertia::render('Admin/Exams/Edit', [
            'exam'     => $exam,
            'centers'  => $formData['centers'],
            'classes'  => $formData['classes'],
            'subjects' => $formData['subjects'],
        ]);
    }

    public function update(UpdateExamRequest $request, int $id): RedirectResponse
    {
        $user = $this->getAuthUser();
        $exam = $this->examService->updateExam($id, $request->validated(), $user);

        return redirect()->route('exams.index')
            ->with('success', "Cập nhật bài kiểm tra '{$exam->name}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();
        $this->examService->deleteExam($id, $user);

        return redirect()->route('exams.index')
            ->with('success', 'Xóa bài kiểm tra thành công!');
    }
}
