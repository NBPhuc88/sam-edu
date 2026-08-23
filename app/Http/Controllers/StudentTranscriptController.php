<?php

namespace App\Http\Controllers;

use App\Models\ExamResult;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class StudentTranscriptController extends Controller
{
    /**
     * Lấy thông tin học sinh đang đăng nhập hoặc học sinh được chỉ định (nếu admin xem).
     * @param ?int $studentId
     */
    protected function resolveStudent(?int $studentId = null): ?Student
    {
        /** @var Student|null $authStudent */
        $authStudent = Auth::guard('student')->user();

        if ($authStudent) {
            return $authStudent;
        }

        if ($studentId) {
            return Student::with('center')->find($studentId);
        }

        return null;
    }

    /**
     * Hiển thị trang In / Xuất PDF Bảng Điểm (Chuẩn A4).
     * @param Request $request
     */
    public function print(Request $request): InertiaResponse
    {
        $studentId = $request->input('student_id') ? (int) $request->input('student_id') : null;
        $student   = $this->resolveStudent($studentId);

        if (! $student) {
            abort(404, 'Không tìm thấy thông tin học sinh.');
        }

        $classId = $request->input('class_id') ? (int) $request->input('class_id') : null;

        $student->load('center');
        $center = $student->center;

        // Danh sách các lớp học sinh đã/đang tham gia
        $enrolledClasses = $student->classes()
            ->select(['classes.id', 'classes.name', 'classes.code', 'classes.start_date', 'classes.end_date', 'classes.status'])
            ->get();

        // Lấy danh sách kết quả bài thi
        $query = ExamResult::query()
            ->with(['exam:id,title,subject_id,max_score', 'exam.subject:id,name,code', 'classExam.schoolClass:id,name,code'])
            ->where('student_id', $student->id);

        if ($classId) {
            $query->whereHas('classExam', function ($q) use ($classId) {
                $q->where('class_id', $classId);
            });
        }

        $results = $query->orderBy('created_at', 'desc')->get()->map(function ($r) {
            return [
                'id'           => $r->id,
                'exam_name'    => $r->exam?->title ?? 'Bài kiểm tra',
                'subject_name' => $r->exam?->subject?->name ?? 'Môn học chung',
                'class_name'   => $r->classExam?->schoolClass?->name ?? 'Toàn trung tâm',
                'class_code'   => $r->classExam?->schoolClass?->code ?? '',
                'score'        => (float) $r->score,
                'grade'        => $r->grade ?: ($r->score >= 8.5 ? 'Xuất sắc' : ($r->score >= 7.0 ? 'Khá' : ($r->score >= 5.0 ? 'Trung bình' : 'Chưa đạt'))),
                'exam_date'    => $r->created_at ? $r->created_at->format('d/m/Y') : 'N/A',
                'note'         => $r->note ?? '',
            ];
        });

        // Tính điểm trung bình và xếp loại
        $totalScore = $results->sum('score');
        $count      = $results->count();
        $gpa        = $count > 0 ? round($totalScore / $count, 2) : 0;

        $academicRanking = 'Chưa xếp loại';

        if ($count > 0) {
            if ($gpa >= 9.0) {
                $academicRanking = 'Xuất Sắc';
            } elseif ($gpa >= 8.0) {
                $academicRanking = 'Giỏi';
            } elseif ($gpa >= 6.5) {
                $academicRanking = 'Khá';
            } elseif ($gpa >= 5.0) {
                $academicRanking = 'Trung Bình';
            } else {
                $academicRanking = 'Yếu';
            }
        }

        $selectedClass = $classId ? $enrolledClasses->firstWhere('id', $classId) : null;

        return Inertia::render('Student/TranscriptPrint', [
            'student' => [
                'id'            => $student->id,
                'full_name'     => $student->full_name,
                'student_code'  => $student->student_code,
                'date_of_birth' => $student->date_of_birth,
                'email'         => $student->email,
                'phone'         => $student->phone,
                'gender'        => $student->gender,
                'address'       => $student->address,
                'status'        => is_object($student->status) ? $student->status->value : $student->status,
            ],
            'center' => [
                'name'    => $center?->name ?? 'Trung Tâm Giáo Dục Sam Edu',
                'code'    => $center?->code ?? 'SAM-EDU',
                'phone'   => $center?->phone ?? '1900 8888',
                'email'   => $center?->email ?? 'contact@sam-edu.vn',
                'address' => $center?->address ?? 'Hà Nội, Việt Nam',
            ],
            'enrolledClasses' => $enrolledClasses,
            'selectedClassId' => $classId,
            'selectedClass'   => $selectedClass,
            'results'         => $results,
            'gpa'             => $gpa,
            'academicRanking' => $academicRanking,
            'totalExams'      => $count,
            'printDate'       => date('d/m/Y H:i'),
        ]);
    }
}
