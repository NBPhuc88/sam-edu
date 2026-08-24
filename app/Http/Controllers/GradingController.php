<?php

namespace App\Http\Controllers;

use App\Http\Requests\Grading\FilterGradingRequest;
use App\Http\Requests\Grading\GradeSubmissionRequest;
use App\Http\Requests\Grading\StoreOfflineExamRequest;
use App\Models\Admin;
use App\Models\Teacher;
use App\Services\Grading\GradingServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class GradingController extends Controller
{
    public function __construct(
        protected GradingServiceInterface $gradingService
    ) {
    }

    protected function getAuthUser(): array
    {
        /** @var Teacher|null $teacher */
        $teacher = Auth::guard('teacher')->user();
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return [$teacher, $admin];
    }

    /**
     * Danh sách bài thi và bài nộp theo lớp.
     * @param FilterGradingRequest $request
     */
    public function index(FilterGradingRequest $request): InertiaResponse
    {
        [$teacher, $admin] = $this->getAuthUser();

        $data = $this->gradingService->getGradingIndexData($request->validated(), $teacher, $admin);

        return Inertia::render('Teacher/Grading/Index', [
            'submissions' => $data['submissions'],
            'classes'     => $data['classes'],
            'classExams'  => $data['classExams'],
            'stats'       => $data['stats'],
            'filters'     => $data['filters'],
            'isTeacher'   => (bool) $teacher,
            'isAdmin'     => (bool) $admin,
        ]);
    }

    /**
     * Giao diện tạo bài thi giấy (Offline) và bảng nhập điểm cho lớp.
     */
    public function createOffline(): InertiaResponse
    {
        [$teacher, $admin] = $this->getAuthUser();

        $formData = $this->gradingService->getOfflineExamFormData($teacher, $admin);

        return Inertia::render('Teacher/Grading/OfflineCreate', $formData);
    }

    /**
     * Lưu bài thi giấy và bảng điểm học sinh.
     * @param StoreOfflineExamRequest $request
     */
    public function storeOffline(StoreOfflineExamRequest $request): RedirectResponse
    {
        [$teacher, $admin] = $this->getAuthUser();

        $classExam = $this->gradingService->createOfflineExamWithScores($request->validated(), $teacher, $admin);

        return redirect()->route('grading.index', [
            'class_id'      => $classExam->class_id,
            'class_exam_id' => $classExam->id,
        ])->with('success', "Đã tạo thành công bài thi '{$classExam->title}' và cập nhật bảng điểm cho lớp!");
    }

    /**
     * Chi tiết bài nộp của học sinh để chấm điểm.
     * @param int $id
     */
    public function show(int $id): InertiaResponse
    {
        [$teacher, $admin] = $this->getAuthUser();

        $data = $this->gradingService->getSubmissionForGrading($id, $teacher, $admin);

        return Inertia::render('Teacher/Grading/Show', [
            'submission' => $data['submission'],
            'classExam'  => $data['classExam'],
            'isTeacher'  => (bool) $teacher,
            'isAdmin'    => (bool) $admin,
        ]);
    }

    /**
     * Tiếp nhận điểm và nhận xét của giáo viên.
     * @param GradeSubmissionRequest $request
     * @param int                    $id
     */
    public function grade(GradeSubmissionRequest $request, int $id): RedirectResponse
    {
        [$teacher, $admin] = $this->getAuthUser();

        $submission = $this->gradingService->gradeSubmission($id, $request->validated(), $teacher, $admin);

        return redirect()->route('grading.index', [
            'class_id'      => $submission->classExam?->class_id,
            'class_exam_id' => $submission->class_exam_id,
        ])->with('success', "Đã chấm xong bài thi của học sinh {$submission->student?->full_name} với tổng điểm {$submission->score}đ!");
    }
}
