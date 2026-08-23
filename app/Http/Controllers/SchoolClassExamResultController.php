<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\Class\SchoolClassExamResultServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SchoolClassExamResultController extends Controller
{
    public function __construct(
        protected SchoolClassExamResultServiceInterface $examResultService
    ) {
    }

    protected function getAuthUser(): array
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();
        /** @var Teacher|null $teacher */
        $teacher = Auth::guard('teacher')->user();
        /** @var Student|null $student */
        $student = Auth::guard('student')->user();

        return [$admin, $teacher, $student];
    }

    /**
     * Danh sách bài thi đã thi & bảng điểm của lớp
     * @param Request $request
     * @param int     $classId
     */
    public function index(Request $request, int $classId): InertiaResponse
    {
        [$admin, $teacher, $student] = $this->getAuthUser();
        $search                      = $request->input('search');
        $classExamId                 = $request->input('class_exam_id') ? (int) $request->input('class_exam_id') : null;

        $data = $this->examResultService->getClassExamResultsData(
            $classId,
            is_string($search) ? $search : null,
            $classExamId,
            $admin,
            $teacher,
            $student
        );

        return Inertia::render('Admin/Classes/ExamResults', $data);
    }

    /**
     * Xuất bảng điểm bài thi của lớp sang file CSV
     * @param Request $request
     * @param int     $classId
     */
    public function export(Request $request, int $classId): StreamedResponse
    {
        [$admin, $teacher, $student] = $this->getAuthUser();
        $classExamId                 = $request->input('class_exam_id') ? (int) $request->input('class_exam_id') : null;

        return $this->examResultService->exportClassExamResultsCsv(
            $classId,
            $classExamId,
            $admin,
            $teacher
        );
    }
}
