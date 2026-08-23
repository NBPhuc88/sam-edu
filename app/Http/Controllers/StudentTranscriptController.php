<?php

namespace App\Http\Controllers;

use App\Services\Transcript\StudentTranscriptServiceInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class StudentTranscriptController extends Controller
{
    public function __construct(
        protected StudentTranscriptServiceInterface $studentTranscriptService
    ) {
    }

    /**
     * Hiển thị trang In / Xuất PDF Bảng Điểm (Chuẩn A4).
     *
     * @param  Request         $request
     * @return InertiaResponse
     */
    public function print(Request $request): InertiaResponse
    {
        $studentId = $request->input('student_id') ? (int) $request->input('student_id') : null;
        $student   = $this->studentTranscriptService->resolveStudent($studentId);

        if (! $student) {
            abort(404, 'Không tìm thấy thông tin học sinh.');
        }

        $classId = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $data    = $this->studentTranscriptService->getTranscriptPrintData($student, $classId);

        return Inertia::render('Student/TranscriptPrint', $data);
    }
}
