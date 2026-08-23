<?php

namespace App\Services\Grading;

use App\Models\Admin;
use App\Models\ClassExamSubmission;
use App\Models\Teacher;
use App\Repositories\Exam\ExamResultRepositoryInterface;
use App\Repositories\Grading\GradingRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

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
}
