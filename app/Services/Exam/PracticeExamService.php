<?php

namespace App\Services\Exam;

use App\Models\Admin;
use App\Models\Exam;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PracticeExamService implements PracticeExamServiceInterface
{
    /**
     * Lấy danh sách đề thi đánh dấu thi thử (is_practice = true)
     *
     * @param  array<string, mixed>            $filters
     * @param  Student|null                    $student
     * @param  Teacher|null                    $teacher
     * @param  Admin|null                      $admin
     * @param  int                             $perPage
     * @return LengthAwarePaginator<int, Exam>
     */
    public function getPracticeExams(
        array $filters,
        ?Student $student = null,
        ?Teacher $teacher = null,
        ?Admin $admin = null,
        int $perPage = 12
    ): LengthAwarePaginator {
        $query = Exam::query()
            ->where('is_practice', true)
            ->where('status', 'published')
            ->with([
                'center:id,name,code',
                'subject:id,name,code',
                'examType:id,name,code',
            ])
            ->withCount(['sections', 'questions']);

        // Phân quyền theo Trung tâm
        if ($admin && ! $admin->isSuperAdmin()) {
            $centerIds = $admin->centers()->pluck('centers.id')->toArray();
            $query->whereIn('center_id', array_unique($centerIds));
        } elseif ($teacher && ! empty($teacher->center_id)) {
            $query->where('center_id', $teacher->center_id);
        } elseif ($student && ! empty($student->center_id)) {
            $query->where('center_id', $student->center_id);
        }

        // Tìm kiếm theo từ khóa (tên đề thi, mã đề thi)
        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Lọc theo Center
        if (! empty($filters['center_id'])) {
            $query->where('center_id', (int) $filters['center_id']);
        }

        // Lọc theo Subject
        if (! empty($filters['subject_id'])) {
            $query->where('subject_id', (int) $filters['subject_id']);
        }

        // Lọc theo Loại đề thi (exam_type_id hoặc exam_type code)
        $examTypeFilter = $filters['exam_type_id'] ?? ($filters['exam_type'] ?? null);

        if (! empty($examTypeFilter) && $examTypeFilter !== 'all') {
            if (is_numeric($examTypeFilter)) {
                $query->where('exam_type_id', (int) $examTypeFilter);
            } else {
                $query->whereHas('examType', function ($q) use ($examTypeFilter) {
                    $q->where('code', $examTypeFilter);
                });
            }
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();
    }

    /**
     * Lấy thông tin chi tiết đề thi thử để làm bài
     *
     * @param  int                  $examId
     * @param  Student|null         $student
     * @param  Teacher|null         $teacher
     * @param  Admin|null           $admin
     * @return array<string, mixed>
     */
    public function getPracticeExamDetail(
        int $examId,
        ?Student $student = null,
        ?Teacher $teacher = null,
        ?Admin $admin = null
    ): array {
        /** @var Exam|null $exam */
        $exam = Exam::with([
            'center:id,name,code',
            'subject:id,name,code',
            'examType:id,name,code',
            'sections' => function ($q) {
                $q->orderBy('order_index');
            },
            'sections.questions' => function ($q) {
                $q->orderBy('order_index');
            },
        ])->find($examId);

        if (! $exam) {
            throw new NotFoundHttpException('Đề thi không tồn tại.');
        }

        // Tạo cấu trúc sanitized exam questions (không lộ đáp án chuẩn lúc đang làm bài)
        $sanitizedSections = $exam->sections->map(function ($section) use ($exam) {
            $questions = $section->questions->map(function ($question) use ($exam) {
                $options = $question->options;

                if (is_string($options)) {
                    $options = json_decode($options, true) ?: $options;
                }

                // Xáo trộn đáp án nếu đề thi bật shuffle_options
                if ($exam->shuffle_options && is_array($options) && in_array($question->question_type, ['single_choice', 'multiple_choice'])) {
                    shuffle($options);
                }

                return [
                    'id'            => $question->id,
                    'section_id'    => $question->section_id,
                    'code'          => $question->code,
                    'question_type' => $question->question_type,
                    'skill'         => $question->skill,
                    'content'       => $question->content,
                    'score'         => (float) $question->score,
                    'image_url'     => $question->image_url,
                    'audio_url'     => $question->audio_url,
                    'options'       => $options,
                    'metadata'      => $question->metadata,
                    'order_index'   => $question->order_index,
                ];
            });

            if ($exam->shuffle_questions) {
                $questions = $questions->shuffle();
            }

            return [
                'id'          => $section->id,
                'title'       => $section->title,
                'description' => $section->description,
                'skill'       => $section->skill,
                'order_index' => $section->order_index,
                'questions'   => $questions->values(),
            ];
        });

        return [
            'exam' => [
                'id'               => $exam->id,
                'code'             => $exam->code,
                'name'             => $exam->name,
                'exam_type_id'     => $exam->exam_type_id,
                'exam_type'        => $exam->examType?->name ?? $exam->examType?->code ?? 'general',
                'duration_minutes' => $exam->duration_minutes ?? 45,
                'max_score'        => (float) $exam->max_score,
                'pass_score'       => (float) ($exam->pass_score ?? 0),
                'description'      => $exam->description,
                'center'           => $exam->center,
                'subject'          => $exam->subject,
                'sections'         => $sanitizedSections,
                'total_questions'  => $exam->questions->count(),
            ],
            'serverTime' => now()->toIso8601String(),
        ];
    }

    /**
     * Chấm điểm tự động bài thi thử
     *
     * @param  int                  $examId
     * @param  array<string, mixed> $userAnswers
     * @return array<string, mixed>
     */
    public function gradePracticeExam(int $examId, array $userAnswers): array
    {
        /** @var Exam|null $exam */
        $exam = Exam::with(['sections.questions'])->find($examId);

        if (! $exam) {
            throw new NotFoundHttpException('Đề thi không tồn tại.');
        }

        $allQuestions     = $exam->questions;
        $totalQuestions   = $allQuestions->count();
        $totalMaxScore    = 0;
        $totalEarnedScore = 0;
        $correctCount     = 0;
        $incorrectCount   = 0;
        $skippedCount     = 0;
        $gradedQuestions  = [];

        foreach ($allQuestions as $question) {
            $qId    = (int) $question->id;
            $qScore = (float) $question->score;
            $totalMaxScore += $qScore;

            $userAns    = $userAnswers[$qId] ?? $userAnswers[(string) $qId] ?? null;
            $correctAns = $question->correct_answer;

            if (is_string($correctAns)) {
                $decoded = json_decode($correctAns, true);

                if (json_last_error() === JSON_ERROR_NONE) {
                    $correctAns = $decoded;
                }
            }

            $options = $question->options;

            if (is_string($options)) {
                $options = json_decode($options, true) ?: $options;
            }

            $isCorrect   = false;
            $isSkipped   = ($userAns === null || $userAns === '' || $userAns === []);
            $earnedScore = 0.00;

            if (! $isSkipped) {
                switch ($question->question_type) {
                    case 'single_choice':
                    case 'true_false_not_given':
                    case 'find_mistake':
                        $cleanUser    = trim(strtoupper((string) $userAns));
                        $cleanCorrect = trim(strtoupper((string) $correctAns));

                        if ($cleanUser === $cleanCorrect) {
                            $isCorrect   = true;
                            $earnedScore = $qScore;
                        }

                        break;

                    case 'multiple_choice':
                        $userArr    = is_array($userAns) ? array_map('strval', $userAns) : [strval($userAns)];
                        $correctArr = is_array($correctAns) ? array_map('strval', $correctAns) : [strval($correctAns)];
                        sort($userArr);
                        sort($correctArr);

                        if ($userArr == $correctArr) {
                            $isCorrect   = true;
                            $earnedScore = $qScore;
                        }

                        break;

                    case 'fill_in_blank':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $totalBlanks   = count($correctAns);
                            $correctBlanks = 0;

                            foreach ($correctAns as $blankKey => $correctVal) {
                                $uVal = trim(mb_strtolower((string) ($userAns[$blankKey] ?? '')));
                                $cVal = trim(mb_strtolower((string) $correctVal));

                                if ($uVal === $cVal && $uVal !== '') {
                                    $correctBlanks++;
                                }
                            }

                            if ($totalBlanks > 0 && $correctBlanks === $totalBlanks) {
                                $isCorrect   = true;
                                $earnedScore = $qScore;
                            } elseif ($totalBlanks > 0 && $correctBlanks > 0) {
                                $earnedScore = round(($correctBlanks / $totalBlanks) * $qScore, 2);
                            }
                        }

                        break;

                    case 'matching':
                    case 'matching_image':
                    case 'matching_sentences':
                    case 'diagram_labelling':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $totalPairs   = count($correctAns);
                            $correctPairs = 0;

                            foreach ($correctAns as $k => $v) {
                                if (isset($userAns[$k]) && (string) $userAns[$k] === (string) $v) {
                                    $correctPairs++;
                                }
                            }

                            if ($totalPairs > 0 && $correctPairs === $totalPairs) {
                                $isCorrect   = true;
                                $earnedScore = $qScore;
                            } elseif ($totalPairs > 0 && $correctPairs > 0) {
                                $earnedScore = round(($correctPairs / $totalPairs) * $qScore, 2);
                            }
                        }

                        break;

                    case 'ordering':
                        $userOrder    = is_array($userAns) ? array_map('strval', $userAns) : [];
                        $correctOrder = is_array($correctAns) ? array_map('strval', $correctAns) : [];

                        if ($userOrder === $correctOrder && ! empty($userOrder)) {
                            $isCorrect   = true;
                            $earnedScore = $qScore;
                        }

                        break;

                    case 'essay':
                    case 'audio_record':
                        // Tự luận & Ghi âm: Ghi nhận bài nộp
                        $isCorrect   = false;
                        $earnedScore = 0.00;

                        break;
                }
            }

            if ($isCorrect) {
                $correctCount++;
            } elseif ($isSkipped) {
                $skippedCount++;
            } else {
                $incorrectCount++;
            }

            $totalEarnedScore += $earnedScore;

            $gradedQuestions[] = [
                'id'             => $question->id,
                'section_id'     => $question->section_id,
                'code'           => $question->code,
                'question_type'  => $question->question_type,
                'skill'          => $question->skill,
                'content'        => $question->content,
                'image_url'      => $question->image_url,
                'audio_url'      => $question->audio_url,
                'options'        => $options,
                'max_score'      => $qScore,
                'earned_score'   => $earnedScore,
                'user_answer'    => $userAns,
                'correct_answer' => $correctAns,
                'is_correct'     => $isCorrect,
                'is_skipped'     => $isSkipped,
                'explanation'    => $question->explanation,
            ];
        }

        $percentage = $totalMaxScore > 0 ? round(($totalEarnedScore / $totalMaxScore) * 100, 1) : 0;
        $isPassed   = $percentage >= 50.0;

        return [
            'exam' => [
                'id'               => $exam->id,
                'code'             => $exam->code,
                'name'             => $exam->name,
                'exam_type_id'     => $exam->exam_type_id,
                'exam_type'        => $exam->examType?->name ?? $exam->examType?->code ?? 'general',
                'duration_minutes' => $exam->duration_minutes,
                'max_score'        => $totalMaxScore,
                'pass_score'       => (float) ($exam->pass_score ?? ($totalMaxScore * 0.5)),
            ],
            'summary' => [
                'total_questions' => $totalQuestions,
                'correct_count'   => $correctCount,
                'incorrect_count' => $incorrectCount,
                'skipped_count'   => $skippedCount,
                'earned_score'    => round($totalEarnedScore, 2),
                'max_score'       => round($totalMaxScore, 2),
                'percentage'      => $percentage,
                'is_passed'       => $isPassed,
                'submitted_at'    => now()->toIso8601String(),
            ],
            'graded_questions' => $gradedQuestions,
        ];
    }
}
