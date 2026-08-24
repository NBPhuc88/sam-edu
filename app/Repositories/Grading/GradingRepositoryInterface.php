<?php

namespace App\Repositories\Grading;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\ClassExamSubmission;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface GradingRepositoryInterface
{
    /**
     * Lấy danh sách lớp học mà giáo viên/admin có quyền chấm bài.
     *
     * @param  Teacher|null $teacher
     * @param  Admin|null   $admin
     * @return Collection
     */
    public function getClassesForGrading(?Teacher $teacher = null, ?Admin $admin = null): Collection;

    /**
     * Lấy danh sách bài thi gán theo lớp hoặc theo quyền hạn.
     *
     * @param  int|null     $classId
     * @param  Teacher|null $teacher
     * @param  Admin|null   $admin
     * @return Collection
     */
    public function getClassExamsForGrading(?int $classId = null, ?Teacher $teacher = null, ?Admin $admin = null): Collection;

    /**
     * Lấy danh sách bài nộp phân trang kèm bộ lọc.
     *
     * @param  int|null             $classId
     * @param  int|null             $classExamId
     * @param  string|null          $gradedStatus
     * @param  string|null          $search
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  Teacher|null         $teacher
     * @param  Admin|null           $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedSubmissions(
        ?int $classId,
        ?int $classExamId,
        ?string $gradedStatus,
        ?string $search,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        ?Teacher $teacher = null,
        ?Admin $admin = null
    ): LengthAwarePaginator;

    /**
     * Lấy thống kê số lượng bài nộp, đã chấm, chờ chấm.
     *
     * @param  int|null                                                                                   $classId
     * @param  int|null                                                                                   $classExamId
     * @param  Teacher|null                                                                               $teacher
     * @param  Admin|null                                                                                 $admin
     * @return array{total_submissions: int, graded_count: int, pending_count: int, average_score: float}
     */
    public function getGradingStats(
        ?int $classId,
        ?int $classExamId,
        ?Teacher $teacher = null,
        ?Admin $admin = null
    ): array;

    /**
     * Tìm bài làm thi theo ID kèm đầy đủ thông tin chi tiết câu hỏi và thí sinh.
     *
     * @param  int                      $id
     * @return ClassExamSubmission|null
     */
    public function findSubmissionWithDetails(int $id): ?ClassExamSubmission;

    /**
     * Cập nhật điểm và kết quả chấm bài của bài nộp.
     *
     * @param  ClassExamSubmission  $submission
     * @param  array<string, mixed> $data
     * @return ClassExamSubmission
     */
    public function updateSubmissionGrading(ClassExamSubmission $submission, array $data): ClassExamSubmission;
}
