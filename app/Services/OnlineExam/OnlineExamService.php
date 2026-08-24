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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

            // Phục hồi draft answers từ Redis Cache nếu đang làm bài
            if ($submission && $submission->status === 'in_progress') {
                $cacheKey      = "exam_draft:submission:{$submission->id}";
                $cachedAnswers = Cache::get($cacheKey);

                if ($cachedAnswers !== null && is_array($cachedAnswers)) {
                    $submission->answers = $cachedAnswers;
                }
            }
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
            // Nạp draft từ Redis Cache nếu có
            $cacheKey      = "exam_draft:submission:{$existing->id}";
            $cachedAnswers = Cache::get($cacheKey);

            if ($cachedAnswers !== null && is_array($cachedAnswers)) {
                $existing->answers = $cachedAnswers;
            }

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

    public function autoSaveProgress(int $submissionId, array $answers, Student $student): bool
    {
        $submission = $this->classExamRepository->findSubmissionForGrading($submissionId);

        if (! $submission) {
            throw new ModelNotFoundException("Không tìm thấy bài làm thi #{$submissionId}");
        }

        if ($submission->student_id !== $student->id) {
            throw ValidationException::withMessages(['unauthorized' => 'Bạn không có quyền lưu bài làm này.']);
        }

        // Chỉ cho phép autosave khi bài thi đang làm
        if ($submission->status !== 'in_progress') {
            return false;
        }

        // Tính thời gian TTL lưu Redis = thời gian làm bài + 20 phút
        $durationMinutes = $submission->classExam?->duration_minutes ?? $submission->classExam?->exam?->duration_minutes ?? 45;
        $ttlMinutes      = (int) $durationMinutes + 20;
        $cacheKey        = "exam_draft:submission:{$submission->id}";

        // Chỉ lưu vào Redis Cache với TTL để tăng tốc phản hồi tối đa và giảm tải DB
        Cache::put($cacheKey, $answers, now()->addMinutes($ttlMinutes));

        return true;
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

        $cacheKey = "exam_draft:submission:{$submission->id}";

        // Nếu answers rỗng (ví dụ timeout submit), ưu tiên lấy từ Redis Cache
        if (empty($answers)) {
            $cachedAnswers = Cache::get($cacheKey);

            if (! empty($cachedAnswers) && is_array($cachedAnswers)) {
                $answers = $cachedAnswers;
            }
        }

        // Xóa draft khỏi Redis Cache sau khi nộp bài
        Cache::forget($cacheKey);

        return DB::transaction(function () use ($submission, $answers, $isTimeout) {
            $now          = Carbon::now();
            $startedAt    = $submission->started_at ?? $now;
            $durationSecs = max(0, $now->diffInSeconds($startedAt));

            // Tự động chấm điểm các câu hỏi
            $gradingResult = $this->gradeExam($submission->classExam, $answers);

            $requiresManual = $gradingResult['requires_manual_grading'];
            $isGraded       = ! $requiresManual; // Nếu không có câu tự luận/nói thì coi như đã chấm xong

            return $this->classExamRepository->updateSubmission($submission, [
                'submitted_at'            => $now,
                'duration_seconds_used'   => $durationSecs,
                'score'                   => $gradingResult['total_score'],
                'total_correct'           => $gradingResult['total_correct'],
                'total_questions'         => $gradingResult['total_questions'],
                'status'                  => $isTimeout ? 'timeout_submitted' : 'submitted',
                'is_graded'               => $isGraded,
                'requires_manual_grading' => $requiresManual,
                'graded_at'               => $isGraded ? $now : null,
                'answers'                 => $answers,
                'grading_details'         => $gradingResult['details'],
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

        $cleanExamCode    = Str::slug($examCode, '_');
        $cleanStudentCode = Str::slug($studentCode, '_');
        $cleanQCode       = Str::slug($questionCode, '_');
        $timestamp        = time();
        $randomHex        = Str::random(6);

        $extension = $file->getClientOriginalExtension() ?: 'webm';
        $fileName  = "{$cleanExamCode}_{$cleanStudentCode}_{$cleanQCode}_{$timestamp}_{$randomHex}.{$extension}";

        // Lưu vào storage disk 'sam' tại /home/phuc/sam/exams/speaking/
        $directory = 'exams/speaking';
        $path      = $file->storeAs($directory, $fileName, 'sam');

        return $path;
    }

    public function streamSpeakingAudio(string $path): BinaryFileResponse
    {
        $cleanPath = trim(str_replace('\\', '/', $path), '/');

        if (str_contains($cleanPath, '..') || (! str_starts_with($cleanPath, 'exams/') && ! str_starts_with($cleanPath, 'exam/'))) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException('Đường dẫn file không hợp lệ.');
        }

        $samDisk   = Storage::disk('sam');
        $localDisk = Storage::disk('local');

        $fullPath = null;

        if ($samDisk->exists($cleanPath)) {
            $fullPath = $samDisk->path($cleanPath);
        } elseif ($localDisk->exists($cleanPath)) {
            $fullPath = $localDisk->path($cleanPath);
        } else {
            throw new ModelNotFoundException('Không tìm thấy file ghi âm bài thi.');
        }

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
     * @param  array<string, mixed>                                                                                                                  $userAnswers
     * @param  ClassExam                                                                                                                             $classExam
     * @return array{total_score: float, total_correct: int, total_questions: int, requires_manual_grading: bool, details: array<int|string, mixed>}
     */
    protected function gradeExam(ClassExam $classExam, array $userAnswers): array
    {
        $totalScore            = 0.0;
        $totalCorrect          = 0;
        $totalQuestions        = 0;
        $requiresManualGrading = false;
        $details               = [];

        $exam = $classExam->exam;

        if (! $exam) {
            return ['total_score' => 0, 'total_correct' => 0, 'total_questions' => 0, 'requires_manual_grading' => false, 'details' => []];
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
                        $cleanU = is_scalar($userAns) ? trim((string) $userAns) : '';
                        $cleanC = is_scalar($correctAns) ? trim((string) $correctAns) : '';

                        if ($cleanU !== '' && $cleanU === $cleanC) {
                            $isCorrect   = true;
                            $scoreEarned = $qScore;
                        }

                        break;

                    case 'multiple_choice':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $uSorted = array_values(array_map('strval', array_filter($userAns, 'is_scalar')));
                            $cSorted = array_values(array_map('strval', array_filter($correctAns, 'is_scalar')));
                            sort($uSorted);
                            sort($cSorted);

                            if (! empty($uSorted) && $uSorted === $cSorted) {
                                $isCorrect   = true;
                                $scoreEarned = $qScore;
                            }
                        }

                        break;

                    case 'fill_in_blank':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $allBlanksCorrect = true;

                            foreach ($correctAns as $bKey => $bData) {
                                $rawU = $userAns[$bKey] ?? null;
                                $uVal = is_scalar($rawU) ? trim((string) $rawU) : '';

                                if (is_array($bData)) {
                                    $accepted   = $bData['accepted_answers'] ?? [];
                                    $isCaseSens = $bData['case_sensitive'] ?? false;
                                } else {
                                    $accepted   = is_scalar($bData) ? [(string) $bData] : [];
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
                    case 'drag_drop_cloze':
                        if (is_array($userAns) && is_array($correctAns)) {
                            $allPairsCorrect = true;

                            foreach ($correctAns as $lKey => $rVal) {
                                $uVal = $userAns[$lKey] ?? null;

                                if ($uVal === null || ! is_scalar($uVal) || ! is_scalar($rVal) || (string) $uVal !== (string) $rVal) {
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
                            $uOrder = array_values(array_map('strval', array_filter($userAns, 'is_scalar')));
                            $cOrder = array_values(array_map('strval', array_filter($correctAns, 'is_scalar')));

                            if (! empty($uOrder) && $uOrder === $cOrder) {
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
                        $requiresManualGrading = true;
                        $isCorrect             = false;
                        $scoreEarned           = 0.0;

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
            'total_score'             => round($totalScore, 2),
            'total_correct'           => $totalCorrect,
            'total_questions'         => $totalQuestions,
            'requires_manual_grading' => $requiresManualGrading,
            'details'                 => $details,
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
            // Giáo viên dạy môn trong lớp hoặc là người tạo bài thi
            $isAssigned = $cls && ($cls->classSubjects()->where('teacher_id', $teacher->id)->exists() || $classExam->created_by_teacher_id === $teacher->id);

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
