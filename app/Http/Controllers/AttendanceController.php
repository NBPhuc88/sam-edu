<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Teacher;
use App\Services\Attendance\AttendanceServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AttendanceController extends Controller
{
    public function __construct(
        protected AttendanceServiceInterface $attendanceService
    ) {
    }

    protected function getAuthUser(): Admin|Teacher|null
    {
        if (Auth::guard('admin')->check()) {
            /** @var Admin $admin */
            $admin = Auth::guard('admin')->user();

            return $admin;
        }

        if (Auth::guard('teacher')->check()) {
            /** @var Teacher $teacher */
            $teacher = Auth::guard('teacher')->user();

            return $teacher;
        }

        return null;
    }

    public function index(Request $request): InertiaResponse|RedirectResponse
    {
        $sessionId = $request->query('session_id');

        if ($sessionId && is_numeric($sessionId)) {
            return redirect()->route('attendance.session', ['sessionId' => (int) $sessionId]);
        }

        // Render attendance dashboard or default view
        $user = $this->getAuthUser();

        // If user is teacher, redirect to their schedule or find nearest upcoming/today session
        if ($user instanceof Teacher) {
            $todaySession = \App\Models\ClassSession::where('teacher_id', $user->id)
                ->whereDate('session_date', today())
                ->first();

            if ($todaySession) {
                return redirect()->route('attendance.session', ['sessionId' => $todaySession->id]);
            }

            return redirect()->route('teachers.schedule', ['id' => $user->id]);
        }

        return redirect()->route('sessions.index');
    }

    public function show(int $sessionId): InertiaResponse
    {
        $user = $this->getAuthUser();
        $data = $this->attendanceService->getSessionAttendanceData($sessionId, $user);

        return Inertia::render('Admin/Attendance/Show', $data);
    }

    public function save(Request $request, int $sessionId): RedirectResponse
    {
        $request->validate([
            'attendances'              => ['required', 'array'],
            'attendances.*.student_id' => ['required', 'integer'],
            'attendances.*.status'     => ['required', 'string', 'in:present,absent,late,excused,leave'],
            'attendances.*.note'       => ['nullable', 'string', 'max:500'],
        ]);

        $user        = $this->getAuthUser();
        $attendances = $request->input('attendances', []);

        $this->attendanceService->saveAttendance($sessionId, $attendances, $user);

        return back()->with('success', 'Lưu dữ liệu điểm danh thành công!');
    }

    public function reset(int $sessionId): RedirectResponse
    {
        $user = $this->getAuthUser();
        $this->attendanceService->resetAttendance($sessionId, $user);

        return back()->with('success', 'Đã đặt lại điểm danh ca học và chuyển trạng thái về chưa dạy thành công!');
    }
}
