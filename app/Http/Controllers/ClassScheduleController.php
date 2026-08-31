<?php

namespace App\Http\Controllers;

use App\Enums\Constant;
use App\Http\Requests\Schedule\FilterClassScheduleRequest;
use App\Http\Requests\Schedule\StoreClassScheduleRequest;
use App\Http\Requests\Schedule\UpdateClassScheduleRequest;
use App\Models\Admin;
use App\Services\Schedule\ClassScheduleServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ClassScheduleController extends Controller
{
    public function __construct(
        protected ClassScheduleServiceInterface $scheduleService
    ) {
    }

    protected function getAuthAdmin(): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }

    public function index(FilterClassScheduleRequest $request): InertiaResponse|RedirectResponse
    {
        if (Auth::guard('student')->check()) {
            return redirect()->route('student.schedule');
        }

        $admin     = $this->getAuthAdmin();
        $search    = $request->input('search');
        $centerId  = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId   = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $subjectId = $request->input('subject_id') ? (int) $request->input('subject_id') : null;
        $teacherId = $request->input('teacher_id') ? (int) $request->input('teacher_id') : null;
        $status    = $request->input('status');
        $page      = $request->integer('page', 1);
        $perPage   = $request->integer('per_page', config('app.pagination_per_page', 20));

        $schedules = $this->scheduleService->getPaginatedSchedules(
            is_string($search) ? $search : null,
            $centerId,
            $classId,
            $subjectId,
            $teacherId,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $admin
        );

        $formData = $this->scheduleService->getFormData($admin);

        return Inertia::render('Admin/Schedules/Index', [
            'schedules' => $schedules,
            'centers'   => $formData['centers'],
            'classes'   => $formData['classes'],
            'subjects'  => $formData['subjects'],
            'teachers'  => $formData['teachers'],
            'filters'   => [
                'search'     => $search ?? '',
                'center_id'  => $centerId,
                'class_id'   => $classId,
                'subject_id' => $subjectId,
                'teacher_id' => $teacherId,
                'status'     => $status ?? '',
                'per_page'   => $perPage,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $formData = $this->scheduleService->getFormData($admin);

        return Inertia::render('Admin/Schedules/Create', [
            'centers'  => $formData['centers'],
            'classes'  => $formData['classes'],
            'subjects' => $formData['subjects'],
            'teachers' => $formData['teachers'],
            'rooms'    => $formData['rooms'],
        ]);
    }

    public function store(StoreClassScheduleRequest $request): RedirectResponse
    {
        $admin    = $this->getAuthAdmin();
        $schedule = $this->scheduleService->createSchedule($request->validated(), $admin);

        $className   = $schedule->classSubject?->schoolClass?->name ?? 'Lớp học';
        $subjectName = $schedule->classSubject?->subject?->name ?? 'Môn học';

        return redirect()->route('schedules.index')
            ->with('success', "Tạo lịch học môn '{$subjectName}' cho '{$className}' và tự động sinh các ca học thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $schedule = $this->scheduleService->findSchedule($id, $admin);
        $formData = $this->scheduleService->getFormData($admin);

        return Inertia::render('Admin/Schedules/Edit', [
            'schedule' => $schedule,
            'centers'  => $formData['centers'],
            'classes'  => $formData['classes'],
            'subjects' => $formData['subjects'],
            'teachers' => $formData['teachers'],
            'rooms'    => $formData['rooms'],
        ]);
    }

    public function update(UpdateClassScheduleRequest $request, int $id): RedirectResponse
    {
        $admin    = $this->getAuthAdmin();
        $schedule = $this->scheduleService->updateSchedule($id, $request->validated(), $admin);

        $className   = $schedule->classSubject?->schoolClass?->name ?? 'Lớp học';
        $subjectName = $schedule->classSubject?->subject?->name ?? 'Môn học';

        return redirect()->route('schedules.index')
            ->with('success', "Cập nhật lịch học môn '{$subjectName}' của '{$className}' và đồng bộ lại ca học thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->scheduleService->deleteSchedule($id, $admin);

        return redirect()->route('schedules.index')
            ->with('success', 'Xóa lịch học thành công!');
    }

    public function sessions(int $id): JsonResponse
    {
        $admin    = $this->getAuthAdmin();
        $schedule = $this->scheduleService->findSchedule($id, $admin);

        $sessions = $schedule->classSubject
            ? $schedule->classSubject->classSessions()->where('status', '!=', Constant::SESSION_STATUS_CANCELLED)->orderBy('session_date', 'asc')->orderBy('start_time', 'asc')->get()
            : $schedule->classSessions()->where('status', '!=', Constant::SESSION_STATUS_CANCELLED)->orderBy('session_date', 'asc')->orderBy('start_time', 'asc')->get();

        return response()->json([
            'schedule' => $schedule,
            'sessions' => $sessions,
        ]);
    }
}
