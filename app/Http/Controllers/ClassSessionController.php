<?php

namespace App\Http\Controllers;

use App\Http\Requests\Session\FilterClassSessionRequest;
use App\Http\Requests\Session\UpdateClassSessionRequest;
use App\Models\Admin;
use App\Models\Teacher;
use App\Services\Session\ClassSessionServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ClassSessionController extends Controller
{
    public function __construct(
        protected ClassSessionServiceInterface $sessionService
    ) {
    }

    /**
     * @return Admin|Teacher|null
     */
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

    public function index(FilterClassSessionRequest $request): InertiaResponse
    {
        $user        = $this->getAuthUser();
        $search      = $request->input('search');
        $centerId    = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId     = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $subjectId   = $request->input('subject_id') ? (int) $request->input('subject_id') : null;
        $teacherId   = $request->input('teacher_id') ? (int) $request->input('teacher_id') : null;
        $roomId      = $request->input('room_id') ? (int) $request->input('room_id') : null;
        $sessionDate = $request->input('session_date');
        $dateFrom    = $request->input('date_from');
        $dateTo      = $request->input('date_to');
        $dateScope   = $request->input('date_scope', 'from_today');
        $status      = $request->input('status');
        $page        = $request->integer('page', 1);
        $perPage     = $request->integer('per_page', config('app.pagination_per_page', 20));

        $sessions = $this->sessionService->getPaginatedSessions(
            is_string($search) ? $search : null,
            $centerId,
            $classId,
            $subjectId ? (int) $subjectId : null,
            $teacherId,
            $roomId,
            is_string($sessionDate) ? $sessionDate : null,
            is_string($dateFrom) ? $dateFrom : null,
            is_string($dateTo) ? $dateTo : null,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $user,
            $dateScope
        );

        $formData = $this->sessionService->getFilterFormData($user);

        return Inertia::render('Admin/Sessions/Index', [
            'sessions'  => $sessions,
            'centers'   => $formData['centers'],
            'classes'   => $formData['classes'],
            'subjects'  => $formData['subjects'],
            'teachers'  => $formData['teachers'],
            'rooms'     => $formData['rooms'],
            'isTeacher' => ($user instanceof Teacher),
            'filters'   => array_filter([
                'search'       => $search,
                'center_id'    => $centerId,
                'class_id'     => $classId,
                'subject_id'   => $subjectId,
                'teacher_id'   => $teacherId,
                'room_id'      => $roomId,
                'session_date' => $sessionDate,
                'date_from'    => $dateFrom,
                'date_to'      => $dateTo,
                'date_scope'   => $dateScope,
                'status'       => ($status && $status !== '') ? $status : null,
                'per_page'     => $perPage !== 20 ? $perPage : null,
            ], fn ($val) => $val !== null && $val !== ''),
        ]);
    }

    public function show(int $id): InertiaResponse
    {
        $user     = $this->getAuthUser();
        $session  = $this->sessionService->findSessionDetails($id, $user);
        $formData = $this->sessionService->getFilterFormData($user);

        return Inertia::render('Admin/Sessions/Show', [
            'session'  => $session,
            'teachers' => $formData['teachers'],
            'rooms'    => $formData['rooms'],
        ]);
    }

    public function update(UpdateClassSessionRequest $request, int $id): RedirectResponse
    {
        $user    = $this->getAuthUser();
        $session = $this->sessionService->updateOrRescheduleSession($id, $request->validated(), $user);

        $dateFormatted = $session->session_date ? \Carbon\Carbon::parse($session->session_date)->format('d-m-Y') : '';

        return redirect()->route('sessions.show', ['id' => $id])
            ->with('success', "Cập nhật / Đổi lịch buổi học ngày {$dateFormatted} thành công!");
    }
}
