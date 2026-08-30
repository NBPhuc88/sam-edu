<?php

namespace App\Http\Controllers;

use App\Http\Requests\Class\FilterSchoolClassRequest;
use App\Http\Requests\Class\StoreSchoolClassRequest;
use App\Http\Requests\Class\UpdateSchoolClassRequest;
use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\Class\SchoolClassServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SchoolClassController extends Controller
{
    public function __construct(
        protected SchoolClassServiceInterface $schoolClassService
    ) {
    }

    protected function getAuthUser(): array
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();
        /** @var Teacher|null $teacher */
        $teacher = Auth::guard('teacher')->user();
        /** @var Student|null $student */
        $student = Auth::guard('student')->user();

        return [$admin, $teacher, $student];
    }

    public function index(FilterSchoolClassRequest $request): InertiaResponse
    {
        [$admin, $teacher, $student] = $this->getAuthUser();
        $search                      = $request->input('search');
        $centerId                    = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $status                      = $request->input('status');
        $page                        = $request->integer('page', 1);
        $perPage                     = $request->integer('per_page', config('app.pagination_per_page', 20));

        $classes = $this->schoolClassService->getPaginatedClasses(
            is_string($search) ? $search : null,
            $centerId,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $admin,
            $teacher,
            $student
        );

        $formData = $this->schoolClassService->getFormData($admin, $teacher, $student);

        return Inertia::render('Admin/Classes/Index', [
            'classes' => $classes,
            'centers' => $formData['centers'],
            'filters' => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
                'status'    => $status ?? '',
                'per_page'  => $perPage,
            ],
            'isTeacher' => (bool) $teacher,
            'isStudent' => (bool) $student,
        ]);
    }

    public function create(): InertiaResponse
    {
        [$admin, $teacher, $student] = $this->getAuthUser();

        if ($teacher || $student) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $formData = $this->schoolClassService->getFormData($admin);

        return Inertia::render('Admin/Classes/Create', [
            'centers'  => $formData['centers'],
            'subjects' => $formData['subjects'],
            'teachers' => $formData['teachers'],
        ]);
    }

    public function store(StoreSchoolClassRequest $request): RedirectResponse
    {
        [$admin, $teacher, $student] = $this->getAuthUser();

        if ($teacher || $student) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $schoolClass = $this->schoolClassService->createClass($request->validated(), $admin);

        return redirect()->route('classes.index')
            ->with('success', "Tạo lớp học '{$schoolClass->name}' thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        [$admin, $teacher, $student] = $this->getAuthUser();

        if ($teacher || $student) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $schoolClass = $this->schoolClassService->findClass($id, $admin);
        $formData    = $this->schoolClassService->getFormData($admin);

        return Inertia::render('Admin/Classes/Edit', [
            'schoolClass' => $schoolClass,
            'centers'     => $formData['centers'],
            'subjects'    => $formData['subjects'],
            'teachers'    => $formData['teachers'],
        ]);
    }

    public function update(UpdateSchoolClassRequest $request, int $id): RedirectResponse
    {
        [$admin, $teacher, $student] = $this->getAuthUser();

        if ($teacher || $student) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $schoolClass = $this->schoolClassService->updateClass($id, $request->validated(), $admin);

        return redirect()->route('classes.index')
            ->with('success', "Cập nhật thông tin lớp học '{$schoolClass->name}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        [$admin, $teacher, $student] = $this->getAuthUser();

        if ($teacher || $student) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $this->schoolClassService->deleteClass($id, $admin);

        return redirect()->route('classes.index')
            ->with('success', 'Xóa lớp học thành công!');
    }

    public function schedule(\Illuminate\Http\Request $request, int $id): InertiaResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $weekDate          = $request->query('date');
        $timetableData     = $this->schoolClassService->getClassTimetableData(
            $id,
            is_string($weekDate) ? $weekDate : null,
            $admin,
            $teacher
        );

        return Inertia::render('Admin/Classes/Schedule', array_merge($timetableData, [
            'isTeacher' => (bool) $teacher,
        ]));
    }
}
