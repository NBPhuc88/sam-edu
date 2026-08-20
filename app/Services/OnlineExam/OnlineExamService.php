<?php

namespace App\Services\OnlineExam;

use App\Models\Admin;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\ClassExam\ClassExamRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class OnlineExamService implements OnlineExamServiceInterface
{
    public function __construct(
        protected ClassExamRepositoryInterface $classExamRepository
    ) {
    }

    public function getExamRoomByCode(string $code, ?Student $student = null, ?Teacher $teacher = null, ?Admin $admin = null): ClassExam
    {
        $classExam = $this->classExamRepository->findByCodeOrAccessCode($code);

        if (! $classExam) {
            throw ValidationException::withMessages([
                'code' => 'Mã phòng thi hoặc mã truy cập không tồn tại.',
            ]);
        }

        $this->authorizeAccess($classExam, $student, $teacher, $admin);

        return $classExam;
    }

    public function getExamForTaking(int $classExamId, ?Student $student = null, ?Teacher $teacher = null, ?Admin $admin = null): array
    {
        $classExam = $this->classExamRepository->findWithFullExam($classExamId);

        if (! $classExam) {
            throw new ModelNotFoundException("Không tìm thấy kỳ thi với ID #{$classExamId}");
        }

        $this->authorizeAccess($classExam, $student, $teacher, $admin);

        $submission = null;

        if ($student) {
            $submission = $this->classExamRepository->getStudentSubmission($classExamId, $student->id);
        }

        // Kiểm tra hiệu lực thời gian bài thi
        $now       = Carbon::now();
        $validFrom = $classExam->valid_from ? Carbon::parse($classExam->valid_from) : null;
        $validTo   = $classExam->valid_to ? Carbon::parse($classExam->valid_to) : null;

        $isBeforeStart = $validFrom && $now->lt($validFrom);
        $isAfterEnd    = $validTo && $now->gt($validTo);
        $isValidTime   = ! $isBeforeStart && ! $isAfterEnd;

        // Nếu quá hạn mà chưa có submission -> Tạo submission với trạng thái missed (0 điểm)
        if ($isAfterEnd && $student && ! $submission) {
            $submission = $this->classExamRepository->createSubmission([
                'class_exam_id'         => $classExam->id,
                'student_id'            => $student->id,
                'attempt_number'        => 1,
                'started_at'            => $validTo,
                'submitted_at'          => $validTo,
                'duration_seconds_used' => 0,
                'score'                 => 0,
                'total_correct'         => 0,
                'total_questions'       => $this->countTotalQuestions($classExam),
                'status'                => 'missed',
                'answers'               => [],
                'grading_details'       => [],
            ]);
        }

        return [
            'classExam'     => $classExam,
            'submission'    => $submission,
            'isBeforeStart' => $isBeforeStart,
            'isAfterEnd'    => $isAfterEnd,
            'isValidTime'   => $isValidTime,
            'serverTime'    => $now->toIso8601String(),
        ];
    }

    public function startExamAttempt(int $classExamId, Student $student): ClassExamSubmission
    {
        $classExam = $this->classExamRepository->findWithFullExam($classExamId);

        if (! $classExam) {
            throw new ModelNotFoundException("Không tìm thấy kỳ thi với ID #{$classExamId}");
        }

        $this->authorizeAccess($classExam, $student);

        // Kiểm tra thời gian hiệu lực
        $now     = Carbon::now();
        $validTo = $classExam->valid_to ? Carbon::parse($classExam->valid_to) : null;

        if ($validTo && $now->gt($validTo)) {
            throw ValidationException::withMessages([
                'time' => 'Bài thi đã hết thời hạn làm bài.',
            ]);
        }

        // Kiểm tra nếu đã có bài thi đang làm
        $existing = $this->classExamRepository->getStudentSubmission($classExamId, $student->id);

        if ($existing && $existing->status === 'in_progress') {
            return $existing;
        }

        if ($existing && in_array($existing->status, ['submitted', 'timeout_submitted', 'missed'], true)) {
            return $existing;
        }

        $totalQuestions = $this->countTotalQuestions($classExam);

        return $this->classExamRepository->createSubmission([
            'class_exam_id'         => $classExamId,
            'student_id'            => $student->id,
            'attempt_number'        => 1,
            'started_at'            => $now,
            'submitted_at'          => null,
            'duration_seconds_used' => 0,
            'score'                 => 0,
            'total_correct'         => 0,
            'total_questions'       => $totalQuestions,
            'status'                => 'in_progress',
            'answers'               => [],
            'grading_details'       => [],
        ]);
    }

    public function submitExamAttempt(int $submissionId, array $answers, Student $student, bool $isTimeout = false): ClassExamSubmission
    {
        $submission = $this->classExamRepository->findSubmissionForGrading($submissionId);

        if (! $submission) {
            throw new ModelNotFoundException("Không tìm thấy bài làm thi #{$submissionId}");
        }

        if ($submission->student_id !== $student->id) {
            throw ValidationException::withMessages(['unauthorized' => 'Bạn không có quyền nộp bài thi này.']);
        }

        if (in_array($submission->status, ['submitted', 'timeout_submitted', 'missed'], true)) {
            return $submission;
        }

        return DB::transaction(function () use ($submission, $answers, $isTimeout) {
            $now          = Carbon::now();
            $startedAt    = $submission->started_at ?? $now;
            $durationSecs = max(0, $now->diffInSeconds($startedAt));

            // Tự động chấm điểm các câu hỏi
            $gradingResult = $this->gradeExam($submission->classExam, $answers);

            return $this->classExamRepository->updateSubmission($submission, [
                'submitted_at'          => $now,
                'duration_seconds_used' => $durationSecs,
                'score'                 => $gradingResult['total_score'],
                'total_correct'         => $gradingResult['total_correct'],
                'total_questions'       => $gradingResult['total_questions'],
                'status'                => $isTimeout ? 'timeout_submitted' : 'submitted',
                'answers'               => $answers,
                'grading_details'       => $gradingResult['details'],
            ]);
        });
    }

    public function uploadSpeakingAudio(int $classExamId, int $questionId, UploadedFile $file, Student $student): string
    {
        $classExam = $this->classExamRepository->findClassExamById($classExamId);

        if (! $classExam) {
            throw new ModelNotFoundException("Không tìm thấy kỳ thi với ID #{$classExamId}");
        }

        $this->authorizeAccess($classExam, $student);

        $question = $this->classExamRepository->findQuestionById($questionId);

        if (! $question) {
            throw new ModelNotFoundException("Không tìm thấy câu hỏi với ID #{$questionId}");
        }

        $examCode     = $classExam->code ?: "CE{$classExam->id}";
        $studentCode  = $student->student_code ?: ($student->username ?: "STD{$student->id}");
        $questionCode = $question->code ?: "Q{$question->id}";

        $extension = $file->getClientOriginalExtension() ?: 'webm';
        $fileName  = "{$examCode}_{$studentCode}_{$questionCode}.{$extension}";

        // Lưu vào private storage: storage/app/private/exam/
        $directory = 'exam';
        $path      = $file->storeAs($directory, $fileName, 'private');

        return $path;
    }

    public function streamSpeakingAudio(string $path): BinaryFileResponse
    {
        $disk = Storage::disk('private');

        if (! $disk->exists($path)) {
            throw new ModelNotFoundException('Không tìm thấy file ghi âm bài thi.');
        }

        $fullPath = $disk->path($path);
        $mimeType = File::mimeType($fullPath) ?: 'audio/webm';

        return Response::file($fullPath, [
            'Content-Type'   => $mimeType,
            'Content-Length' => filesize($fullPath),
            'Accept-Ranges'  => 'bytes',
        ]);
    }

    public function getSubmissionReview(int $submissionId, ?Student $student = null, ?Teacher $teacher = null, ?Admin $admin = null): array
    {
        $submission = $this->classExamRepository->findSubmissionWithDetails($submissionId);

        if (! $submission) {
            throw new ModelNotFoundException("Không tìm thấy bài làm thi #{$submissionId}");
        }

        if ($student && $submission->student_id !== $student->id) {
            throw ValidationException::withMessages(['unauthorized' => 'Bạn không được xem bài thi của thí sinh khác.']);
        }

        if ($teacher || $admin) {
            $this->authorizeAccess($submission->classExam, null, $teacher, $admin);
        }

        return [
            'submission' => $submission,
            'classExam'  => $submission->classExam,
        ];
    }

    /**
     * Thuật toán chấm điểm tự động.
     *
     * @param  array<string, mixed>                                                                                   $userAnswers
     * @param  ClassExam                                                                                              $classExam
     * @return array{total_score: float, total_correct: int, total_questions: int, details: array<int|string, mixed>}
     */
    protected function gradeExam(ClassExam $classExam, array $userAnswers): array
    {
        $totalScore     = 0.0;
        $totalCorrect   = 0;
        $totalQuestions = 0;
        $details        = [];

        $exam = $classExam->exam;

        if (! $exam) {
            return ['total_score' => 0, 'total_correct' => 0, 'total_questions' => 0, 'details' => []];
        }

        foreach ($exam->sections as $section) {
            foreach ($section->questions as $question) {
                $totalQuestions++;
                $qId         = $question->id;
                $userAns     = $userAnswers[$qId] ?? null;
                $correctAns  = $question->correct_answer;
                $qScore      = (float) ($question->score ?: 1.0);
                $isCorrect   = false;
                $scoreEarned = 0.0;

                switch ($question->question_type) {
                    case 'single_choice':
                    case 'true_false_not_given':
                    case 'find_mistake':
                        if ($userAns !== null && trim((string) $userAns) === trim((string) $correctAns)) {
                            $isCorrect   = true;
                            $scoreEarned = $qScore;
                        }

                        break;

                    case 'multiple_choice':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $uSorted = $userAns;
                            $cSorted = $correctAns;
                            sort($uSorted);
                            sort($cSorted);

                            if ($uSorted === $cSorted) {
                                $isCorrect   = true;
                                $scoreEarned = $qScore;
                            }
                        }

                        break;

                    case 'fill_in_blank':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $allBlanksCorrect = true;

                            foreach ($correctAns as $bKey => $bData) {
                                $uVal       = trim((string) ($userAns[$bKey] ?? ''));
                                $accepted   = $bData['accepted_answers'] ?? [];
                                $isCaseSens = $bData['case_sensitive'] ?? false;

                                $matched = false;

                                foreach ($accepted as $acc) {
                                    if ($isCaseSens ? ($uVal === trim((string) $acc)) : (mb_strtolower($uVal) === mb_strtolower(trim((string) $acc)))) {
                                        $matched = true;

                                        break;
                                    }
                                }

                                if (! $matched) {
                                    $allBlanksCorrect = false;
                                }
                            }

                            if ($allBlanksCorrect && count($correctAns) > 0) {
                                $isCorrect   = true;
                                $scoreEarned = $qScore;
                            }
                        }

                        break;

                    case 'matching':
                    case 'matching_image':
                    case 'matching_sentences':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $allPairsCorrect = true;

                            foreach ($correctAns as $lKey => $rVal) {
                                if (($userAns[$lKey] ?? null) !== $rVal) {
                                    $allPairsCorrect = false;
                                }
                            }

                            if ($allPairsCorrect && count($correctAns) > 0) {
                                $isCorrect   = true;
                                $scoreEarned = $qScore;
                            }
                        }

                        break;

                    case 'ordering':
                        if (is_array($userAns) && is_array($correctAns)) {
                            if ($userAns === $correctAns) {
                                $isCorrect   = true;
                                $scoreEarned = $qScore;
                            }
                        }

                        break;

                    case 'diagram_labelling':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $allLocsCorrect = true;

                            foreach ($correctAns as $lKey => $pinVal) {
                                if (($userAns[$lKey] ?? null) !== $pinVal) {
                                    $allLocsCorrect = false;
                                }
                            }

                            if ($allLocsCorrect && count($correctAns) > 0) {
                                $isCorrect   = true;
                                $scoreEarned = $qScore;
                            }
                        }

                        break;

                    case 'essay':
                    case 'audio_record':
                        // Tự luận và Ghi âm nói tạm thời lưu lại bài làm, giáo viên chấm điểm sau
                        $isCorrect   = false;
                        $scoreEarned = 0.0;

                        break;
                }

                if ($isCorrect) {
                    $totalCorrect++;
                    $totalScore += $scoreEarned;
                }

                $details[$qId] = [
                    'question_id'    => $qId,
                    'question_type'  => $question->question_type,
                    'user_answer'    => $userAns,
                    'correct_answer' => $correctAns,
                    'is_correct'     => $isCorrect,
                    'score_earned'   => $scoreEarned,
                    'max_score'      => $qScore,
                    'explanation'    => $question->explanation,
                ];
            }
        }

        return [
            'total_score'     => round($totalScore, 2),
            'total_correct'   => $totalCorrect,
            'total_questions' => $totalQuestions,
            'details'         => $details,
        ];
    }

    protected function countTotalQuestions(ClassExam $classExam): int
    {
        $exam = $classExam->exam;

        if (! $exam) {
            return 0;
        }

        $count = 0;

        foreach ($exam->sections as $sec) {
            $count += count($sec->questions ?? []);
        }

        return $count;
    }

    protected function authorizeAccess(ClassExam $classExam, ?Student $student = null, ?Teacher $teacher = null, ?Admin $admin = null): void
    {
        if ($admin) {
            if ($admin->isSuperAdmin()) {
                return;
            }
            $cls = $classExam->schoolClass;

            if ($cls && $admin->centers()->where('centers.id', $cls->center_id)->exists()) {
                return;
            }

            throw ValidationException::withMessages(['unauthorized' => 'Bạn không quản lý trung tâm của bài thi này.']);
        }

        if ($teacher) {
            $cls = $classExam->schoolClass;
            // Giáo viên chủ nhiệm hoặc dạy môn trong lớp
            $isAssigned = $cls && ($cls->teacher_id === $teacher->id || $cls->classSubjects()->where('teacher_id', $teacher->id)->exists() || $classExam->created_by_teacher_id === $teacher->id);

            if ($isAssigned) {
                return;
            }

            throw ValidationException::withMessages(['unauthorized' => 'Bạn không được phân công giảng dạy trong lớp học này.']);
        }

        if ($student) {
            $cls        = $classExam->schoolClass;
            $isEnrolled = $cls && $cls->classStudents()->where('student_id', $student->id)->where('status', 'active')->exists();

            if ($isEnrolled) {
                return;
            }

            throw ValidationException::withMessages(['unauthorized' => 'Bạn không phải là học sinh của lớp học này.']);
        }

        throw ValidationException::withMessages(['unauthorized' => 'Vui lòng đăng nhập để truy cập bài thi.']);
    }
}
