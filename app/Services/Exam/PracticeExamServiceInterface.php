<?php

namespace App\Services\Exam;

use App\Models\Admin;
use App\Models\Exam;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Pagination\LengthAwarePaginator;

interface PracticeExamServiceInterface
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
    ): LengthAwarePaginator;

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
    ): array;

    /**
     * Chấm điểm tự động bài thi thử
     *
     * @param  int                  $examId
     * @param  array<string, mixed> $userAnswers
     * @return array<string, mixed>
     */
    public function gradePracticeExam(int $examId, array $userAnswers): array;
}
