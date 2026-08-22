<?php

namespace App\Http\Controllers;

use App\Http\Requests\Exam\FilterExamRequest;
use App\Http\Requests\Exam\StoreExamRequest;
use App\Http\Requests\Exam\UpdateExamRequest;
use App\Models\Admin;
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

    protected function getAuthAdmin(): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }

    public function index(FilterExamRequest $request): InertiaResponse
    {
        $admin      = $this->getAuthAdmin();
        $search     = $request->input('search');
        $centerId   = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId    = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $subjectId  = $request->input('subject_id') ? (int) $request->input('subject_id') : null;
        $examTypeId = $request->input('exam_type_id') ?? $request->input('exam_type');
        $status     = $request->input('status');
        $page       = $request->integer('page', 1);
        $perPage    = $request->integer('per_page', config('app.pagination_per_page', 15));

        $exams = $this->examService->getPaginatedExams(
            is_string($search) ? $search : null,
            $centerId,
            $classId,
            $subjectId,
            $examTypeId,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $admin
        );
        $formData = $this->examService->getFormData($admin);
        $stats    = $this->examService->getStats($admin);

        return Inertia::render('Admin/Exams/Index', [
            'exams'      => $exams,
            'centers'    => $formData['centers'],
            'classes'    => $formData['classes'],
            'subjects'   => $formData['subjects'],
            'exam_types' => $formData['exam_types'],
            'stats'      => $stats,
            'filters'    => [
                'search'       => $search ?? '',
                'center_id'    => $centerId,
                'class_id'     => $classId,
                'subject_id'   => $subjectId,
                'exam_type_id' => $examTypeId ?? 'all',
                'exam_type'    => $examTypeId ?? 'all',
                'status'       => $status ?? 'all',
                'per_page'     => $perPage,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $formData = $this->examService->getFormData($admin);

        return Inertia::render('Admin/Exams/Create', [
            'centers'    => $formData['centers'],
            'classes'    => $formData['classes'],
            'subjects'   => $formData['subjects'],
            'exam_types' => $formData['exam_types'],
        ]);
    }

    public function store(StoreExamRequest $request): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $exam  = $this->examService->createExam($request->validated(), $admin);

        return redirect()->route('exams.index')
            ->with('success', "Tạo bài kiểm tra '{$exam->name}' thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $exam     = $this->examService->findExam($id, $admin);
        $formData = $this->examService->getFormData($admin);

        return Inertia::render('Admin/Exams/Edit', [
            'exam'       => $exam,
            'centers'    => $formData['centers'],
            'classes'    => $formData['classes'],
            'subjects'   => $formData['subjects'],
            'exam_types' => $formData['exam_types'],
        ]);
    }

    public function update(UpdateExamRequest $request, int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $exam  = $this->examService->updateExam($id, $request->validated(), $admin);

        return redirect()->route('exams.index')
            ->with('success', "Cập nhật bài kiểm tra '{$exam->name}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->examService->deleteExam($id, $admin);

        return redirect()->route('exams.index')
            ->with('success', 'Xóa bài kiểm tra thành công!');
    }
}
