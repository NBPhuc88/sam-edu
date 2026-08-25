<?php

namespace App\Services\Grading;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\Exam;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Repositories\Exam\ExamResultRepositoryInterface;
use App\Repositories\Grading\GradingRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class GradingService implements GradingServiceInterface
{
    public function __construct(
        protected GradingRepositoryInterface $gradingRepository,
        protected ExamResultRepositoryInterface $examResultRepository
    ) {
    }

    public function getGradingIndexData(array $filters, ?Teacher $teacher = null, ?Admin $admin = null): array
    {
        $classId      = ! empty($filters['class_id']) ? (int) $filters['class_id'] : null;
        $classExamId  = ! empty($filters['class_exam_id']) ? (int) $filters['class_exam_id'] : null;
        $gradedStatus = ! empty($filters['status']) && $filters['status'] !== 'all' ? (string) $filters['status'] : null;
        $search       = ! empty($filters['search']) ? (string) $filters['search'] : null;
        $page         = ! empty($filters['page']) ? (int) $filters['page'] : 1;
        $perPage      = ! empty($filters['per_page']) ? (int) $filters['per_page'] : (int) config('app.pagination_per_page', 15);

        $classes     = $this->gradingRepository->getClassesForGrading($teacher, $admin);
        $classExams  = $this->gradingRepository->getClassExamsForGrading($classId, $teacher, $admin);
        $submissions = $this->gradingRepository->getPaginatedSubmissions(
            $classId,
            $classExamId,
            $gradedStatus,
            $search,
            $perPage,
            $page,
            $teacher,
            $admin
        );
        $stats = $this->gradingRepository->getGradingStats($classId, $classExamId, $teacher, $admin);

        return [
            'submissions' => $submissions,
            'classes'     => $classes,
            'classExams'  => $classExams,
            'stats'       => $stats,
            'filters'     => [
                'class_id'      => $classId,
                'class_exam_id' => $classExamId,
                'status'        => $filters['status'] ?? 'all',
                'search'        => $search ?? '',
                'per_page'      => $perPage,
            ],
        ];
    }

    public function getSubmissionForGrading(int $submissionId, ?Teacher $teacher = null, ?Admin $admin = null): array
    {
        $submission = $this->gradingRepository->findSubmissionWithDetails($submissionId);

        if (! $submission) {
            throw new ModelNotFoundException("Không tìm thấy bài nộp với ID #{$submissionId}");
        }

        $this->authorizeAccess($submission, $teacher, $admin);

        return [
            'submission' => $submission,
            'classExam'  => $submission->classExam,
        ];
    }

    public function gradeSubmission(int $submissionId, array $data, ?Teacher $teacher = null, ?Admin $admin = null): ClassExamSubmission
    {
        $submission = $this->gradingRepository->findSubmissionWithDetails($submissionId);

        if (! $submission) {
            throw new ModelNotFoundException("Không tìm thấy bài nộp với ID #{$submissionId}");
        }

        $this->authorizeAccess($submission, $teacher, $admin);

        return DB::transaction(function () use ($submission, $data, $teacher, $admin) {
            $questionGrades  = $data['question_grades'] ?? []; // Map question_id => ['score_earned' => float, 'comment' => string]
            $teacherFeedback = $data['teacher_feedback'] ?? null;

            $currentGradingDetails = $submission->grading_details ?? [];
            $totalScore            = 0.0;
            $totalCorrect          = 0;

            $exam = $submission->classExam?->exam;

            // Xử lý cập nhật điểm cho từng câu hỏi
            if ($exam && $exam->sections) {
                foreach ($exam->sections as $section) {
                    foreach ($section->questions as $question) {
                        $qId       = $question->id;
                        $qScore    = (float) ($question->score ?: 1.0);
                        $itemGrade = $currentGradingDetails[$qId] ?? [
                            'question_id'    => $qId,
                            'question_type'  => $question->question_type,
                            'user_answer'    => ($submission->answers ?? [])[$qId] ?? null,
                            'correct_answer' => $question->correct_answer,
                            'is_correct'     => false,
                            'score_earned'   => 0.0,
                            'max_score'      => $qScore,
                            'explanation'    => $question->explanation,
                        ];

                        // Nếu giáo viên có chấm điểm riêng cho câu hỏi này
                        if (isset($questionGrades[$qId])) {
                            $earnedScore = max(0.0, min($qScore, (float) ($questionGrades[$qId]['score_earned'] ?? 0.0)));
                            $comment     = trim((string) ($questionGrades[$qId]['comment'] ?? ''));

                            $itemGrade['score_earned']    = round($earnedScore, 2);
                            $itemGrade['is_correct']      = $earnedScore >= ($qScore * 0.99); // Coi như đúng nếu đạt trọn điểm
                            $itemGrade['teacher_comment'] = ! empty($comment) ? $comment : null;
                        }

                        if (! empty($itemGrade['is_correct']) || ((float) ($itemGrade['score_earned'] ?? 0)) > 0) {
                            $totalCorrect++;
                        }

                        $totalScore += (float) ($itemGrade['score_earned'] ?? 0.0);
                        $currentGradingDetails[$qId] = $itemGrade;
                    }
                }
            }

            $now = Carbon::now();

            $updatePayload = [
                'score'            => round($totalScore, 2),
                'total_correct'    => $totalCorrect,
                'is_graded'        => true,
                'graded_at'        => $now,
                'teacher_feedback' => $teacherFeedback,
                'grading_details'  => $currentGradingDetails,
            ];

            if ($teacher) {
                $updatePayload['graded_by_teacher_id'] = $teacher->id;
            } elseif ($admin) {
                $updatePayload['graded_by_admin_id'] = $admin->id;
            }

            $updatedSubmission = $this->gradingRepository->updateSubmissionGrading($submission, $updatePayload);

            // Đồng bộ điểm sang bảng exam_results nếu có liên kết kỳ thi
            if ($submission->classExam?->exam_id && $submission->student_id) {
                $this->examResultRepository->updateOrCreate(
                    [
                        'exam_id'    => $submission->classExam->exam_id,
                        'student_id' => $submission->student_id,
                    ],
                    [
                        'score'                 => round($totalScore, 2),
                        'grade'                 => $this->calculateGradeLabel($totalScore, (float) ($submission->classExam->max_score ?: 10.0)),
                        'comment'               => $teacherFeedback,
                        'entered_by_teacher_id' => $teacher?->id,
                        'entered_by_admin_id'   => $admin?->id,
                        'entered_at'            => $now,
                    ]
                );
            }

            return $updatedSubmission;
        });
    }

    protected function calculateGradeLabel(float $score, float $maxScore): string
    {
        $percent = $maxScore > 0 ? ($score / $maxScore) * 100 : 0;

        if ($percent >= 85) {
            return 'Xuất sắc';
        }

        if ($percent >= 70) {
            return 'Giỏi';
        }

        if ($percent >= 50) {
            return 'Đạt';
        }

        return 'Chưa đạt';
    }

    protected function authorizeAccess(ClassExamSubmission $submission, ?Teacher $teacher = null, ?Admin $admin = null): void
    {
        if ($admin) {
            if ($admin->isSuperAdmin()) {
                return;
            }
            $centerId = $submission->classExam?->schoolClass?->center_id;

            if ($centerId && $admin->centers()->where('centers.id', $centerId)->exists()) {
                return;
            }

            throw new \Symfony\Component\HttpKernel\Exception\NotFoundHttpException('Không tìm thấy bài thi hoặc bạn không có quyền truy cập.');
        }

        if ($teacher) {
            $class      = $submission->classExam?->schoolClass;
            $isAssigned = $class && (
                $submission->classExam?->created_by_teacher_id === $teacher->id ||
                $class->classSubjects()->where('teacher_id', $teacher->id)->exists()
            );

            if ($isAssigned) {
                return;
            }

            throw new \Symfony\Component\HttpKernel\Exception\NotFoundHttpException('Không tìm thấy bài thi hoặc bạn không có quyền truy cập.');
        }

        throw new \Symfony\Component\HttpKernel\Exception\NotFoundHttpException('Vui lòng đăng nhập với tư cách giáo viên hoặc quản trị viên.');
    }

    /**
     * Lấy dữ liệu cấu hình để tạo đợt chấm bài thi giấy (Offline).
     *
     * @param  Teacher|null         $teacher
     * @param  Admin|null           $admin
     * @return array<string, mixed>
     */
    public function getOfflineExamFormData(?Teacher $teacher = null, ?Admin $admin = null): array
    {
        $classesQuery = SchoolClass::query()
            ->select('id', 'center_id', 'name', 'code', 'status')
            ->whereIn('status', [1, 2])
            ->with([
                'center:id,name,code',
                'classSubjects' => function ($q) use ($teacher) {
                    $q->select('id', 'class_id', 'subject_id', 'teacher_id')
                        ->with(['subject:id,name,code', 'teacher:id,full_name,teacher_code']);

                    if ($teacher) {
                        $q->where('teacher_id', $teacher->id);
                    }
                },
                'students' => function ($q) {
                    $q->select('students.id', 'students.student_code', 'students.full_name', 'students.phone', 'students.gender', 'students.avatar')
                        ->where('students.status', 1)
                        ->orderBy('students.full_name');
                },
            ]);

        if ($admin) {
            if (! $admin->isSuperAdmin()) {
                $allowedCenterIds = $admin->centers()->pluck('centers.id')->toArray();
                $classesQuery->whereIn('center_id', $allowedCenterIds);
            }
        } elseif ($teacher) {
            $classesQuery->whereHas('classSubjects', function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            });
        } else {
            throw new AccessDeniedHttpException('Vui lòng đăng nhập để truy cập tính năng này.');
        }

        $classes = $classesQuery->orderBy('name')->get();

        $formattedClasses = $classes->map(function (SchoolClass $cls) use ($teacher) {
            $subjects = $cls->classSubjects->map(function ($cs) {
                return [
                    'id'   => $cs->subject?->id,
                    'name' => $cs->subject?->name,
                    'code' => $cs->subject?->code,
                ];
            })->filter(fn ($s) => ! empty($s['id']))->unique('id')->values();

            $students = $cls->students->map(function ($std) {
                return [
                    'id'           => $std->id,
                    'student_code' => $std->student_code,
                    'full_name'    => $std->full_name,
                    'phone'        => $std->phone,
                    'gender'       => $std->gender,
                    'avatar'       => $std->avatar,
                ];
            })->values();

            return [
                'id'        => $cls->id,
                'name'      => $cls->name,
                'code'      => $cls->code,
                'center_id' => $cls->center_id,
                'center'    => $cls->center ? [
                    'id'   => $cls->center->id,
                    'name' => $cls->center->name,
                    'code' => $cls->center->code,
                ] : null,
                'subjects' => $subjects,
                'students' => $students,
            ];
        });

        return [
            'classes'   => $formattedClasses,
            'isTeacher' => (bool) $teacher,
            'isAdmin'   => (bool) $admin,
        ];
    }

    /**
     * Tạo bài thi giấy (Offline), kỳ thi lớp và lưu toàn bộ bảng điểm học sinh.
     *
     * @param  array<string, mixed> $data
     * @param  Teacher|null         $teacher
     * @param  Admin|null           $admin
     * @return ClassExam
     */
    public function createOfflineExamWithScores(array $data, ?Teacher $teacher = null, ?Admin $admin = null): ClassExam
    {
        $classId   = (int) $data['class_id'];
        $subjectId = (int) $data['subject_id'];

        /** @var SchoolClass|null $class */
        $class = SchoolClass::with(['classSubjects'])->find($classId);

        if (! $class) {
            throw new NotFoundHttpException('Không tìm thấy lớp học.');
        }

        // Authorize access
        if ($admin) {
            if (! $admin->isSuperAdmin()) {
                $allowedCenterIds = $admin->centers()->pluck('centers.id')->toArray();

                if (! in_array($class->center_id, $allowedCenterIds, true)) {
                    throw new AccessDeniedHttpException('Bạn không có quyền quản lý lớp học thuộc Trung tâm này.');
                }
            }
        } elseif ($teacher) {
            $isAssigned = $class->classSubjects()
                ->where('subject_id', $subjectId)
                ->where('teacher_id', $teacher->id)
                ->exists();

            if (! $isAssigned) {
                throw new AccessDeniedHttpException('Bạn chỉ được tạo bài thi cho môn học và lớp học do mình trực tiếp giảng dạy.');
            }
        } else {
            throw new AccessDeniedHttpException('Yêu cầu đăng nhập để tạo bài thi.');
        }

        return DB::transaction(function () use ($data, $class, $subjectId, $teacher, $admin) {
            $maxScore  = (float) $data['max_score'];
            $passScore = isset($data['pass_score']) && $data['pass_score'] !== null && $data['pass_score'] !== ''
                ? (float) $data['pass_score']
                : round($maxScore * 0.5, 2);

            // Auto-generate unique Exam Code EX0000001
            $nextId   = (int) (Exam::max('id') ?? 0) + 1;
            $examCode = sprintf('EX%0' . Constant::CODE_PAD_LENGTH . 'd', $nextId);

            while (Exam::where('code', $examCode)->exists()) {
                $nextId++;
                $examCode = sprintf('EX%0' . Constant::CODE_PAD_LENGTH . 'd', $nextId);
            }

            // 1. Tạo Exam
            $exam = Exam::create([
                'center_id'             => $class->center_id,
                'class_id'              => $class->id,
                'subject_id'            => $subjectId,
                'code'                  => $examCode,
                'name'                  => trim($data['title']),
                'description'           => $data['description'] ?? null,
                'max_score'             => $maxScore,
                'pass_score'            => $passScore,
                'status'                => 'published',
                'is_practice'           => false,
                'created_by_teacher_id' => $teacher?->id,
                'created_by_admin_id'   => $admin?->id,
            ]);

            // 2. Tạo ClassExam
            $classExam = ClassExam::create([
                'class_id'              => $class->id,
                'exam_id'               => $exam->id,
                'title'                 => trim($data['title']),
                'exam_date'             => $data['exam_date'],
                'max_score'             => $maxScore,
                'pass_score'            => $passScore,
                'status'                => 'completed',
                'created_by_teacher_id' => $teacher?->id,
                'created_by_admin_id'   => $admin?->id,
            ]);

            // 3. Tạo Submissions và cập nhật Exam Results
            $scoresInput = $data['scores'] ?? [];
            $now         = Carbon::now();

            foreach ($scoresInput as $item) {
                if (empty($item['student_id'])) {
                    continue;
                }

                $studentId = (int) $item['student_id'];
                $hasScore  = isset($item['score']) && $item['score'] !== '' && $item['score'] !== null;
                $score     = $hasScore ? (float) $item['score'] : null;
                $comment   = ! empty($item['comment']) ? trim($item['comment']) : null;

                $isPassed = $score !== null && $score >= $passScore;
                $status   = Constant::SUBMISSION_STATUS_SUBMITTED;
                $isGraded = $score !== null;

                ClassExamSubmission::create([
                    'class_exam_id'           => $classExam->id,
                    'student_id'              => $studentId,
                    'score'                   => $score,
                    'total_correct'           => 0,
                    'status'                  => $status,
                    'is_graded'               => $isGraded,
                    'requires_manual_grading' => false,
                    'graded_at'               => $isGraded ? $now : null,
                    'graded_by_teacher_id'    => $isGraded ? $teacher?->id : null,
                    'graded_by_admin_id'      => $isGraded ? $admin?->id : null,
                    'teacher_feedback'        => $comment,
                    'submitted_at'            => $now,
                ]);

                if ($score !== null) {
                    $this->examResultRepository->updateOrCreate(
                        [
                            'exam_id'    => $exam->id,
                            'student_id' => $studentId,
                        ],
                        [
                            'score'                 => $score,
                            'grade'                 => $this->calculateGradeLabel($score, $maxScore),
                            'comment'               => $comment,
                            'entered_by_teacher_id' => $teacher?->id,
                            'entered_by_admin_id'   => $admin?->id,
                            'entered_at'            => $now,
                        ]
                    );
                }
            }

            return $classExam;
        });
    }
}
