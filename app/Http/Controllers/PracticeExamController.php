<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Center;
use App\Models\ExamType;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\Exam\PracticeExamServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class PracticeExamController extends Controller
{
    public function __construct(
        protected PracticeExamServiceInterface $practiceExamService
    ) {
    }

    protected function getAuthUser(): array
    {
        /** @var Student|null $student */
        $student = Auth::guard('student')->user();
        /** @var Teacher|null $teacher */
        $teacher = Auth::guard('teacher')->user();
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return [$student, $teacher, $admin];
    }

    /**
     * Danh sách đề thi được phép thi thử / luyện tập (is_practice = true)
     * @param Request $request
     */
    public function index(Request $request): InertiaResponse
    {
        [$student, $teacher, $admin] = $this->getAuthUser();

        if ($student) {
            $studentStatus = is_object($student->status) ? $student->status->value : (int) $student->status;

            if ($studentStatus !== 1) {
                abort(403, 'Tài khoản học sinh không ở trạng thái hoạt động.');
            }
        }

        $filters = [
            'search'       => $request->query('search'),
            'center_id'    => $request->query('center_id'),
            'subject_id'   => $request->query('subject_id'),
            'exam_type_id' => $request->query('exam_type_id') ?? $request->query('exam_type'),
            'exam_type'    => $request->query('exam_type_id') ?? $request->query('exam_type'),
        ];

        $exams = $this->practiceExamService->getPracticeExams($filters, $student, $teacher, $admin, 12);

        // Danh sách Trung tâm (chỉ Super Admin được chọn, Admin/Teacher/Student đã bị scope)
        $centers = [];

        if ($admin && $admin->role === 'super_admin') {
            $centers = Center::select(['id', 'name', 'code'])->where('status', 'active')->orderBy('name')->get();
        }

        // Danh sách Môn học cho bộ lọc
        $subjectsQuery = Subject::select(['id', 'name', 'code', 'center_id']);

        if ($admin && ! $admin->isSuperAdmin()) {
            $adminCenterIds = $admin->centers()->pluck('centers.id')->toArray();
            $subjectsQuery->whereIn('center_id', $adminCenterIds);
        } elseif ($teacher && ! empty($teacher->center_id)) {
            $subjectsQuery->where('center_id', $teacher->center_id);
        } elseif ($student && ! empty($student->center_id)) {
            $subjectsQuery->where('center_id', $student->center_id);
        }
        $subjects = $subjectsQuery->orderBy('name')->get();

        // Danh sách Loại bài kiểm tra cho bộ lọc
        $examTypesQuery = ExamType::select(['id', 'name', 'code', 'center_id'])->where('status', 'active');

        if ($admin && ! $admin->isSuperAdmin()) {
            $adminCenterIds = $admin->centers()->pluck('centers.id')->toArray();
            $examTypesQuery->whereIn('center_id', $adminCenterIds);
        } elseif ($teacher && ! empty($teacher->center_id)) {
            $examTypesQuery->where('center_id', $teacher->center_id);
        } elseif ($student && ! empty($student->center_id)) {
            $examTypesQuery->where('center_id', $student->center_id);
        }
        $examTypes = $examTypesQuery->orderBy('name')->get();

        return Inertia::render('ExamRoom/PracticeList', [
            'exams'      => $exams,
            'centers'    => $centers,
            'subjects'   => $subjects,
            'exam_types' => $examTypes,
            'filters'    => $filters,
        ]);
    }

    /**
     * Giao diện làm bài thi thử trực tiếp
     * @param int $id
     */
    public function show(int $id): InertiaResponse
    {
        [$student, $teacher, $admin] = $this->getAuthUser();

        $data = $this->practiceExamService->getPracticeExamDetail($id, $student, $teacher, $admin);

        return Inertia::render('ExamRoom/PracticeExam', [
            'exam'       => $data['exam'],
            'serverTime' => $data['serverTime'],
            'user'       => $student ?? $teacher ?? $admin,
        ]);
    }

    /**
     * Nộp bài thi thử và nhận kết quả chấm điểm tức thì (Instant Auto-Grading)
     * @param int     $id
     * @param Request $request
     */
    public function submit(int $id, Request $request): JsonResponse
    {
        $userAnswers = $request->input('answers', []);

        if (! is_array($userAnswers)) {
            $userAnswers = [];
        }

        $result = $this->practiceExamService->gradePracticeExam($id, $userAnswers);

        return response()->json($result);
    }
}
