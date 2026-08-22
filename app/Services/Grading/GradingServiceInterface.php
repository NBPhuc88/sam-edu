<?php

namespace App\Services\Grading;

use App\Models\Admin;
use App\Models\ClassExamSubmission;
use App\Models\Teacher;

interface GradingServiceInterface
{
    /**
     * Lấy dữ liệu cho trang danh sách bài thi và bài nộp cần chấm.
     *
     * @param  array<string, mixed> $filters
     * @param  Teacher|null         $teacher
     * @param  Admin|null           $admin
     * @return array<string, mixed>
     */
    public function getGradingIndexData(array $filters, ?Teacher $teacher = null, ?Admin $admin = null): array;

    /**
     * Lấy chi tiết bài nộp của học sinh để giáo viên chấm điểm.
     *
     * @param  int                                                                      $submissionId
     * @param  Teacher|null                                                             $teacher
     * @param  Admin|null                                                               $admin
     * @return array{submission: ClassExamSubmission, classExam: \App\Models\ClassExam}
     */
    public function getSubmissionForGrading(int $submissionId, ?Teacher $teacher = null, ?Admin $admin = null): array;

    /**
     * Thực hiện chấm điểm và lưu nhận xét cho bài nộp.
     *
     * @param  int                  $submissionId
     * @param  array<string, mixed> $data
     * @param  Teacher|null         $teacher
     * @param  Admin|null           $admin
     * @return ClassExamSubmission
     */
    public function gradeSubmission(int $submissionId, array $data, ?Teacher $teacher = null, ?Admin $admin = null): ClassExamSubmission;
}
