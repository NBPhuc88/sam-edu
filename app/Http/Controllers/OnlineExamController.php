<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\OnlineExam\OnlineExamServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class OnlineExamController extends Controller
{
    public function __construct(
        protected OnlineExamServiceInterface $onlineExamService
    ) {
    }

    protected function getAuthUser(): array
    {
        /** @var Student|null $student */
        $student = Auth::guard('student')->user();
        /** @var Teacher|null $teacher */
        $teacher = Auth::guard('teacher')->user();
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return [$student, $teacher, $admin];
    }

    /**
     * Trang nhập mã phòng thi.
     */
    public function enterCode(): InertiaResponse
    {
        return Inertia::render('ExamRoom/EnterCode');
    }

    /**
     * Tham gia phòng thi bằng mã.
     * @param Request $request
     */
    public function joinRoom(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'max:50'],
        ], [
            'code.required' => 'Vui lòng nhập mã phòng thi hoặc mã bài thi.',
        ]);

        [$student, $teacher, $admin] = $this->getAuthUser();

        $classExam = $this->onlineExamService->getExamRoomByCode($request->input('code'), $student, $teacher, $admin);

        return redirect()->route('online-exam.lobby', ['id' => $classExam->id]);
    }

    /**
     * Trang phòng chờ / Thông tin bài thi.
     * @param int $id
     */
    public function showLobby(int $id): InertiaResponse
    {
        [$student, $teacher, $admin] = $this->getAuthUser();

        $data = $this->onlineExamService->getExamForTaking($id, $student, $teacher, $admin);

        return Inertia::render('ExamRoom/Lobby', [
            'classExam'     => $data['classExam'],
            'submission'    => $data['submission'],
            'isBeforeStart' => $data['isBeforeStart'],
            'isAfterEnd'    => $data['isAfterEnd'],
            'isValidTime'   => $data['isValidTime'],
            'serverTime'    => $data['serverTime'],
            'isStudent'     => (bool) $student,
            'isTeacher'     => (bool) $teacher,
            'isAdmin'       => (bool) $admin,
        ]);
    }

    /**
     * Bắt đầu làm bài thi (Chỉ học sinh).
     * @param int $id
     */
    public function startExam(int $id): RedirectResponse
    {
        /** @var Student|null $student */
        $student = Auth::guard('student')->user();

        if (! $student) {
            return redirect()->back()->with('error', 'Chỉ học sinh mới có thể bắt đầu làm bài thi.');
        }

        $submission = $this->onlineExamService->startExamAttempt($id, $student);

        return redirect()->route('online-exam.take', [
            'id'           => $id,
            'submissionId' => $submission->id,
        ]);
    }

    /**
     * Giao diện làm bài thi trực tuyến.
     * @param int $id
     * @param int $submissionId
     */
    public function takeExam(int $id, int $submissionId): InertiaResponse|RedirectResponse
    {
        /** @var Student|null $student */
        $student = Auth::guard('student')->user();

        if (! $student) {
            return redirect()->route('online-exam.lobby', ['id' => $id]);
        }

        $data = $this->onlineExamService->getExamForTaking($id, $student);

        /** @var \App\Models\ClassExamSubmission|null $submission */
        $submission = $data['submission'];

        if (! $submission || $submission->id !== $submissionId) {
            return redirect()->route('online-exam.lobby', ['id' => $id]);
        }

        // Nếu đã nộp bài rồi -> Chuyển sang trang kết quả
        if (in_array($submission->status, ['submitted', 'timeout_submitted', 'missed'], true)) {
            return redirect()->route('online-exam.result', [
                'id'           => $id,
                'submissionId' => $submission->id,
            ]);
        }

        return Inertia::render('ExamRoom/TakeExam', [
            'classExam'  => $data['classExam'],
            'submission' => $submission,
            'serverTime' => $data['serverTime'],
            'student'    => $student,
        ]);
    }

    /**
     * Nộp bài thi.
     * @param int     $id
     * @param int     $submissionId
     * @param Request $request
     */
    public function submitExam(int $id, int $submissionId, Request $request): RedirectResponse
    {
        /** @var Student|null $student */
        $student = Auth::guard('student')->user();

        if (! $student) {
            return redirect()->route('online-exam.lobby', ['id' => $id]);
        }

        $answers   = $request->input('answers', []);
        $isTimeout = (bool) $request->boolean('is_timeout', false);

        $submission = $this->onlineExamService->submitExamAttempt($submissionId, $answers, $student, $isTimeout);

        return redirect()->route('online-exam.result', [
            'id'           => $id,
            'submissionId' => $submission->id,
        ]);
    }

    /**
     * Trang xem kết quả bài thi chi tiết và đáp án.
     * @param int $id
     * @param int $submissionId
     */
    public function showResult(int $id, int $submissionId): InertiaResponse
    {
        [$student, $teacher, $admin] = $this->getAuthUser();

        $data = $this->onlineExamService->getSubmissionReview($submissionId, $student, $teacher, $admin);

        return Inertia::render('ExamRoom/ExamResult', [
            'submission' => $data['submission'],
            'classExam'  => $data['classExam'],
            'isStudent'  => (bool) $student,
        ]);
    }

    /**
     * Upload file ghi âm speaking (AJAX).
     * @param int     $id
     * @param Request $request
     */
    public function uploadAudio(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'question_id' => ['required', 'integer', 'exists:exam_questions,id'],
            'audio'       => ['required', 'file', 'mimes:webm,ogg,mp3,wav,mp4', 'max:51200'], // max 50MB
        ]);

        /** @var Student|null $student */
        $student = Auth::guard('student')->user();

        if (! $student) {
            return response()->json(['error' => 'Chỉ học sinh mới có thể ghi âm bài thi.'], 403);
        }

        $path = $this->onlineExamService->uploadSpeakingAudio(
            $id,
            (int) $request->input('question_id'),
            $request->file('audio'),
            $student
        );

        return response()->json([
            'success' => true,
            'path'    => $path,
        ]);
    }

    /**
     * Stream phát lại audio speaking từ private storage.
     * @param Request $request
     */
    public function streamAudio(Request $request): BinaryFileResponse
    {
        $path = $request->query('path');

        if (! is_string($path) || empty($path)) {
            abort(404, 'Đường dẫn file không hợp lệ.');
        }

        return $this->onlineExamService->streamSpeakingAudio($path);
    }
}
