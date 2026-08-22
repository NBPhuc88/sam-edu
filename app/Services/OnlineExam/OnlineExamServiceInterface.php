<?php

namespace App\Services\OnlineExam;

use App\Models\Admin;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

interface OnlineExamServiceInterface
{
    /**
     * Tìm phòng thi theo mã kỳ thi (code) hoặc mã truy cập (access_code) kèm kiểm tra quyền.
     * @param string   $code
     * @param ?Student $student
     * @param ?Teacher $teacher
     * @param ?Admin   $admin
     */
    public function getExamRoomByCode(string $code, ?Student $student = null, ?Teacher $teacher = null, ?Admin $admin = null): ClassExam;

    /**
     * Lấy thông tin chi tiết kỳ thi để làm bài (kèm sections, questions).
     * @param int      $classExamId
     * @param ?Student $student
     * @param ?Teacher $teacher
     * @param ?Admin   $admin
     */
    public function getExamForTaking(int $classExamId, ?Student $student = null, ?Teacher $teacher = null, ?Admin $admin = null): array;

    /**
     * Học sinh bắt đầu làm bài (bấm Start Exam).
     * @param int     $classExamId
     * @param Student $student
     */
    public function startExamAttempt(int $classExamId, Student $student): ClassExamSubmission;

    /**
     * Nộp bài thi (tự động hoặc chủ động) và tự động chấm điểm.
     *
     * @param array<string, mixed> $answers
     * @param int                  $submissionId
     * @param Student              $student
     * @param bool                 $isTimeout
     */
    public function submitExamAttempt(int $submissionId, array $answers, Student $student, bool $isTimeout = false): ClassExamSubmission;

    /**
     * Upload file ghi âm speaking và lưu vào private storage.
     * @param int          $classExamId
     * @param int          $questionId
     * @param UploadedFile $file
     * @param Student      $student
     */
    public function uploadSpeakingAudio(int $classExamId, int $questionId, UploadedFile $file, Student $student): string;

    /**
     * Stream phát lại file audio từ private storage.
     * @param string $path
     */
    public function streamSpeakingAudio(string $path): BinaryFileResponse;

    /**
     * Tự động lưu tiến độ đáp án tạm thời khi học sinh đang làm bài thi.
     *
     * @param int                  $submissionId
     * @param array<string, mixed> $answers
     * @param Student              $student
     */
    public function autoSaveProgress(int $submissionId, array $answers, Student $student): bool;

    /**
     * Xem kết quả bài thi chi tiết và đáp án.
     * @param int      $submissionId
     * @param ?Student $student
     * @param ?Teacher $teacher
     * @param ?Admin   $admin
     */
    public function getSubmissionReview(int $submissionId, ?Student $student = null, ?Teacher $teacher = null, ?Admin $admin = null): array;
}
