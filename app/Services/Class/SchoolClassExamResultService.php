<?php

namespace App\Services\Class;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SchoolClassExamResultService implements SchoolClassExamResultServiceInterface
{
    public function __construct(
        protected SchoolClassRepositoryInterface $schoolClassRepository
    ) {
    }

    /**
     * @param  SchoolClass $class
     * @param  ?Admin      $admin
     * @param  ?Teacher    $teacher
     * @param  ?Student    $student
     * @return void
     */
    protected function authorizeClassAccess(
        SchoolClass $class,
        ?Admin $admin = null,
        ?Teacher $teacher = null,
        ?Student $student = null
    ): void {
        if ($admin) {
            if ($admin->isSuperAdmin()) {
                return;
            }

            $allowedCenterIds = $admin->centers()->pluck('centers.id')->toArray();

            if (! in_array($class->center_id, $allowedCenterIds, true)) {
                throw new AccessDeniedHttpException('Bạn không có quyền truy cập lớp học này.');
            }

            return;
        }

        if ($teacher) {
            $isTeaching = $class->classSubjects()->where('teacher_id', $teacher->id)->exists();

            if (! $isTeaching && $class->center_id !== $teacher->center_id) {
                throw new AccessDeniedHttpException('Bạn không có quyền truy cập kết quả bài thi của lớp học này.');
            }

            return;
        }

        if ($student) {
            $isEnrolled = $class->students()->where('students.id', $student->id)->exists();

            if (! $isEnrolled) {
                throw new AccessDeniedHttpException('Học sinh chỉ được xem kết quả bài thi của các lớp mình theo học.');
            }

            return;
        }

        throw new AccessDeniedHttpException('Yêu cầu xác thực để xem kết quả bài thi.');
    }

    /**
     * @param  int                  $classId
     * @param  ?string              $search
     * @param  ?int                 $classExamId
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @param  ?Student             $student
     * @return array<string, mixed>
     */
    public function getClassExamResultsData(
        int $classId,
        ?string $search = null,
        ?int $classExamId = null,
        ?Admin $admin = null,
        ?Teacher $teacher = null,
        ?Student $student = null
    ): array {
        /** @var SchoolClass|null $class */
        $class = SchoolClass::query()
            ->with([
                'center:id,name,code',
                'classSubjects.subject:id,name,code',
                'classSubjects.teacher:id,full_name,teacher_code',
            ])
            ->withCount([
                'students' => function ($q) {
                    $q->where('class_students.status', 'active');
                },
            ])
            ->find($classId);

        if (! $class) {
            throw new NotFoundHttpException('Không tìm thấy lớp học.');
        }

        $this->authorizeClassAccess($class, $admin, $teacher, $student);

        // Lấy danh sách kỳ thi chính thức của lớp (loại trừ thi thử / practice)
        $classExamsQuery = ClassExam::query()
            ->where('class_id', $classId)
            ->where('status', '!=', Constant::CLASS_EXAM_STATUS_CANCELLED)
            ->whereDoesntHave('exam.examType', function ($q) {
                $q->where('code', 'trial')->orWhere('code', 'practice');
            })
            ->with(['exam.subject:id,name,code'])
            ->orderBy('exam_date', 'desc')
            ->orderBy('id', 'desc');

        $classExams   = $classExamsQuery->get();
        $classExamIds = $classExams->pluck('id')->toArray();

        // Lấy danh sách bài làm / nộp bài thi
        $submissionsQuery = ClassExamSubmission::query()
            ->whereIn('class_exam_id', $classExamIds)
            ->where('status', '!=', Constant::CLASS_EXAM_SUBMISSION_STATUS_IN_PROGRESS) // Chỉ lấy bài đã nộp hoặc đã chấm
            ->with([
                'student:id,full_name,student_code,phone',
                'classExam:id,class_id,exam_id,title,exam_date,max_score,pass_score',
                'classExam.exam.subject:id,name,code',
            ]);

        // Nếu người xem là học sinh: chỉ xem điểm của chính mình
        if ($student) {
            $submissionsQuery->where('student_id', $student->id);
        }

        if ($classExamId !== null && $classExamId > 0) {
            $submissionsQuery->where('class_exam_id', $classExamId);
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $submissionsQuery->where(function ($q) use ($term) {
                $q->whereHas('student', function ($sq) use ($term) {
                    $sq->where('full_name', 'like', "%{$term}%")
                        ->orWhere('student_code', 'like', "%{$term}%");
                })->orWhereHas('classExam', function ($eq) use ($term) {
                    $eq->where('title', 'like', "%{$term}%")
                        ->orWhereHas('exam.subject', function ($subq) use ($term) {
                            $subq->where('name', 'like', "%{$term}%");
                        });
                });
            });
        }

        $submissions = $submissionsQuery
            ->orderBy('submitted_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(config('app.pagination_per_page', 20));

        // Thống kê tổng quan lớp học
        $allClassSubmissions = ClassExamSubmission::query()
            ->whereIn('class_exam_id', $classExamIds)
            ->where('status', '!=', Constant::CLASS_EXAM_SUBMISSION_STATUS_IN_PROGRESS)
            ->get();

        $totalSubmissions = $allClassSubmissions->count();
        $scores           = $allClassSubmissions->pluck('score')->filter(fn ($s) => $s !== null)->map(fn ($s) => (float) $s);
        $avgScore         = $scores->isNotEmpty() ? round($scores->avg(), 2) : 0;
        $highestScore     = $scores->isNotEmpty() ? $scores->max() : 0;
        $passedCount      = $allClassSubmissions->filter(function ($sub) {
            $passScore = (float) ($sub->classExam?->pass_score ?? 5.0);

            return (float) ($sub->score ?? 0) >= $passScore;
        })->count();
        $passRate = $totalSubmissions > 0 ? round(($passedCount / $totalSubmissions) * 100, 1) : 0;

        $stats = [
            'total_exams'       => $classExams->count(),
            'total_submissions' => $totalSubmissions,
            'average_score'     => $avgScore,
            'highest_score'     => $highestScore,
            'pass_rate'         => $passRate,
            'passed_count'      => $passedCount,
        ];

        return [
            'schoolClass' => $class,
            'classExams'  => $classExams,
            'submissions' => $submissions,
            'stats'       => $stats,
            'filters'     => [
                'search'        => $search ?? '',
                'class_exam_id' => $classExamId,
            ],
            'isStudent' => (bool) $student,
            'isTeacher' => (bool) $teacher,
            'isAdmin'   => (bool) $admin,
        ];
    }

    /**
     * @param  int              $classId
     * @param  ?int             $classExamId
     * @param  ?Admin           $admin
     * @param  ?Teacher         $teacher
     * @return StreamedResponse
     */
    public function exportClassExamResultsCsv(
        int $classId,
        ?int $classExamId = null,
        ?Admin $admin = null,
        ?Teacher $teacher = null
    ): StreamedResponse {
        /** @var SchoolClass|null $class */
        $class = SchoolClass::query()->with(['center'])->find($classId);

        if (! $class) {
            throw new NotFoundHttpException('Không tìm thấy lớp học.');
        }

        $this->authorizeClassAccess($class, $admin, $teacher, null);

        $fileName = "bang_diem_lop_{$class->code}_" . date('Ymd_His') . '.csv';
        $headers  = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($classId, $classExamId, $class) {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            // UTF-8 BOM for Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            // Header row
            fputcsv($handle, [
                'STT',
                'Mã Học Sinh',
                'Họ Và Tên',
                'Số Điện Thoại',
                'Lớp Học',
                'Tên Bài Thi',
                'Môn Học',
                'Ngày Thi',
                'Điểm Số',
                'Điểm Tối Đa',
                'Điểm Đạt Chuẩn',
                'Kết Quả',
                'Xếp Loại / Đánh Giá',
                'Thời Gian Nộp',
            ]);

            $classExamsQuery = ClassExam::query()
                ->where('class_id', $classId)
                ->where('status', '!=', Constant::CLASS_EXAM_STATUS_CANCELLED)
                ->whereDoesntHave('exam.examType', function ($q) {
                    $q->where('code', 'trial')->orWhere('code', 'practice');
                });

            if ($classExamId !== null && $classExamId > 0) {
                $classExamsQuery->where('id', $classExamId);
            }

            $classExamIds = $classExamsQuery->pluck('id')->toArray();

            $submissions = ClassExamSubmission::query()
                ->whereIn('class_exam_id', $classExamIds)
                ->where('status', '!=', Constant::CLASS_EXAM_SUBMISSION_STATUS_IN_PROGRESS)
                ->with([
                    'student:id,full_name,student_code,phone',
                    'classExam:id,class_id,exam_id,title,exam_date,max_score,pass_score',
                    'classExam.exam.subject:id,name,code',
                ])
                ->orderBy('submitted_at', 'asc')
                ->get();

            $stt = 1;

            foreach ($submissions as $sub) {
                $score     = $sub->score !== null ? (float) $sub->score : 0;
                $passScore = (float) ($sub->classExam?->pass_score ?? 5.0);
                $isPassed  = $score >= $passScore;

                $grade = 'Chưa đạt';

                if ($score >= 9.0) {
                    $grade = 'Xuất sắc';
                } elseif ($score >= 8.0) {
                    $grade = 'Giỏi';
                } elseif ($score >= 6.5) {
                    $grade = 'Khá';
                } elseif ($score >= 5.0) {
                    $grade = 'Trung bình';
                }

                fputcsv($handle, [
                    $stt++,
                    $sub->student?->student_code ?? '',
                    $sub->student?->full_name ?? '',
                    $sub->student?->phone ?? '',
                    $class->name,
                    $sub->classExam?->title ?? 'Bài thi',
                    $sub->classExam?->exam?->subject?->name ?? 'Môn học',
                    $sub->classExam?->exam_date ? (string) $sub->classExam->exam_date : '',
                    $sub->score !== null ? (string) $sub->score : 'Chưa chấm',
                    (string) ($sub->classExam?->max_score ?? 10),
                    (string) $passScore,
                    $isPassed ? 'ĐẠT' : 'CHƯA ĐẠT',
                    $grade,
                    $sub->submitted_at ? (string) $sub->submitted_at : '',
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
