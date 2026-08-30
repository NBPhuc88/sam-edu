<?php

namespace App\Repositories\ClassExam;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\ExamQuestion;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ClassExamRepositoryInterface
{
    /**
     * @return LengthAwarePaginator<ClassExam>
     * @param  ?string                         $search
     * @param  ?int                            $centerId
     * @param  ?int                            $classId
     * @param  ?int                            $examId
     * @param  ?string                         $status
     * @param  int                             $perPage
     * @param  int                             $page
     * @param  ?Admin                          $admin
     * @param  ?Teacher                        $teacher
     */
    public function getPaginatedClassExams(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $examId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        ?Admin $admin = null,
        ?Teacher $teacher = null
    ): LengthAwarePaginator;

    public function findById(int $id, ?Admin $admin = null, ?Teacher $teacher = null): ?ClassExam;

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): ClassExam;

    /**
     * @param array<string, mixed> $data
     * @param ClassExam            $classExam
     */
    public function update(ClassExam $classExam, array $data): ClassExam;

    public function delete(ClassExam $classExam): bool;

    /**
     * @return array{total: int, scheduled: int, ongoing: int, completed: int}
     * @param  ?Admin                                                          $admin
     * @param  ?Teacher                                                        $teacher
     */
    public function getStats(?Admin $admin = null, ?Teacher $teacher = null): array;

    public function findByCodeOrAccessCode(string $code): ?ClassExam;

    public function findWithFullExam(int $classExamId): ?ClassExam;

    public function findClassExamById(int $classExamId): ?ClassExam;

    public function getNextClassExamCode(): string;

    public function codeExists(string $code, ?int $excludeId = null): bool;

    public function getStudentSubmission(int $classExamId, int $studentId): ?ClassExamSubmission;

    /**
     * @param array<string, mixed> $data
     */
    public function createSubmission(array $data): ClassExamSubmission;

    /**
     * @param ClassExamSubmission  $submission
     * @param array<string, mixed> $data
     */
    public function updateSubmission(ClassExamSubmission $submission, array $data): ClassExamSubmission;

    public function findSubmissionWithDetails(int $submissionId): ?ClassExamSubmission;

    public function findSubmissionForGrading(int $submissionId): ?ClassExamSubmission;

    public function findQuestionById(int $questionId): ?ExamQuestion;
}
