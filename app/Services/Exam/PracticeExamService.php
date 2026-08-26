<?php

namespace App\Services\Exam;

use App\Models\Admin;
use App\Models\Exam;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\Exam\ExamRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PracticeExamService implements PracticeExamServiceInterface
{
    public function __construct(
        protected ExamRepositoryInterface $examRepository
    ) {
    }

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
        $centerIds = null;

        // Phân quyền theo Trung tâm
        if ($admin && ! $admin->isSuperAdmin()) {
            $centerIds = array_unique($admin->centers()->pluck('centers.id')->toArray());
        } elseif ($teacher && ! empty($teacher->center_id)) {
            $centerIds = (int) $teacher->center_id;
        } elseif ($student && ! empty($student->center_id)) {
            $centerIds = (int) $student->center_id;
        }

        $page = isset($filters['page']) && is_numeric($filters['page']) ? (int) $filters['page'] : 1;

        return $this->examRepository->getPracticeExams($filters, $centerIds, $perPage, $page)->withQueryString();
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
                    'title'         => $question->title,
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
                        $cleanUser    = is_scalar($userAns) ? trim(strtoupper((string) $userAns)) : '';
                        $cleanCorrect = is_scalar($correctAns) ? trim(strtoupper((string) $correctAns)) : '';

                        if ($cleanUser !== '' && $cleanUser === $cleanCorrect) {
                            $isCorrect   = true;
                            $earnedScore = $qScore;
                        }

                        break;

                    case 'multiple_choice':
                        $userArr = [];

                        if (is_array($userAns)) {
                            foreach ($userAns as $uItem) {
                                if (is_scalar($uItem)) {
                                    $userArr[] = (string) $uItem;
                                }
                            }
                        } elseif (is_scalar($userAns)) {
                            $userArr = [(string) $userAns];
                        }

                        $correctArr = [];

                        if (is_array($correctAns)) {
                            foreach ($correctAns as $cItem) {
                                if (is_scalar($cItem)) {
                                    $correctArr[] = (string) $cItem;
                                }
                            }
                        } elseif (is_scalar($correctAns)) {
                            $correctArr = [(string) $correctAns];
                        }

                        sort($userArr);
                        sort($correctArr);

                        if (! empty($userArr) && $userArr === $correctArr) {
                            $isCorrect   = true;
                            $earnedScore = $qScore;
                        }

                        break;

                    case 'fill_in_blank':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $totalBlanks   = count($correctAns);
                            $correctBlanks = 0;

                            foreach ($correctAns as $blankKey => $correctVal) {
                                $rawUser = $userAns[$blankKey] ?? null;
                                $uVal    = is_scalar($rawUser) ? trim((string) $rawUser) : '';

                                if (is_array($correctVal)) {
                                    $accepted   = $correctVal['accepted_answers'] ?? [];
                                    $isCaseSens = $correctVal['case_sensitive'] ?? false;
                                } else {
                                    $accepted   = is_scalar($correctVal) ? [(string) $correctVal] : [];
                                    $isCaseSens = false;
                                }

                                $matched = false;

                                foreach ($accepted as $acc) {
                                    $accStr = is_scalar($acc) ? trim((string) $acc) : '';

                                    if ($accStr === '') {
                                        continue;
                                    }

                                    if ($isCaseSens ? ($uVal === $accStr) : (mb_strtolower($uVal) === mb_strtolower($accStr))) {
                                        $matched = true;

                                        break;
                                    }
                                }

                                if ($matched && $uVal !== '') {
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
                    case 'drag_drop_cloze':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $totalPairs   = count($correctAns);
                            $correctPairs = 0;

                            foreach ($correctAns as $k => $v) {
                                $uVal = $userAns[$k] ?? null;

                                if ($uVal !== null && is_scalar($uVal) && is_scalar($v) && (string) $uVal === (string) $v) {
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
                        $userOrder = [];

                        if (is_array($userAns)) {
                            foreach ($userAns as $item) {
                                if (is_scalar($item)) {
                                    $userOrder[] = (string) $item;
                                }
                            }
                        }
                        $correctOrder = [];

                        if (is_array($correctAns)) {
                            foreach ($correctAns as $item) {
                                if (is_scalar($item)) {
                                    $correctOrder[] = (string) $item;
                                }
                            }
                        }

                        if (! empty($userOrder) && $userOrder === $correctOrder) {
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
                'title'          => $question->title,
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
