<?php

namespace App\Http\Controllers;

use App\Http\Requests\Student\AssignStudentClassesRequest;
use App\Http\Requests\Student\BulkAssignClassStudentsRequest;
use App\Http\Requests\Student\FilterStudentRequest;
use App\Http\Requests\Student\ImportCsvRequest;
use App\Http\Requests\Student\StoreStudentRequest;
use App\Http\Requests\Student\UpdateStudentRequest;
use App\Models\Admin;
use App\Models\Teacher;
use App\Services\Student\StudentExportImportServiceInterface;
use App\Services\Student\StudentServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class StudentController extends Controller
{
    public function __construct(
        protected StudentServiceInterface $studentService,
        protected StudentExportImportServiceInterface $studentExportImportService
    ) {
    }

    protected function getAuthUser(): array
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();
        /** @var Teacher|null $teacher */
        $teacher = Auth::guard('teacher')->user();

        return [$admin, $teacher];
    }

    public function index(FilterStudentRequest $request): InertiaResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $search            = $request->input('search');
        $centerId          = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId           = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $status            = $request->input('status');
        $page              = $request->integer('page', 1);
        $perPage           = $request->integer('per_page', config('app.pagination_per_page', 20));

        $students = $this->studentService->getPaginatedStudents(
            is_string($search) ? $search : null,
            $centerId,
            $classId,
            $status !== null && $status !== '' ? (string) $status : null,
            $perPage,
            $page,
            $admin,
            $teacher
        );

        $formData = $this->studentService->getFormData($admin, $teacher);

        return Inertia::render('Admin/Students/Index', [
            'students' => $students,
            'centers'  => $formData['centers'],
            'classes'  => $formData['classes'] ?? [],
            'filters'  => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
                'class_id'  => $classId,
                'status'    => $status !== null && $status !== '' ? (string) $status : '',
                'per_page'  => $perPage,
            ],
            'isTeacher' => (bool) $teacher,
        ]);
    }

    public function create(): InertiaResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        if ($teacher) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $formData = $this->studentService->getFormData($admin);

        return Inertia::render('Admin/Students/Create', [
            'centers' => $formData['centers'],
            'classes' => $formData['classes'] ?? [],
        ]);
    }

    public function store(StoreStudentRequest $request): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        if ($teacher) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $student = $this->studentService->createStudent($request->validated(), $admin);

        return redirect()->route('students.index')
            ->with('success', "Thêm học sinh '{$student->full_name}' thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        if ($teacher) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $student  = $this->studentService->findStudent($id, $admin);
        $formData = $this->studentService->getFormData($admin);

        return Inertia::render('Admin/Students/Edit', [
            'student' => $student,
            'centers' => $formData['centers'],
            'classes' => $formData['classes'] ?? [],
        ]);
    }

    public function update(UpdateStudentRequest $request, int $id): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        if ($teacher) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $student = $this->studentService->updateStudent($id, $request->validated(), $admin);

        return redirect()->route('students.index')
            ->with('success', "Cập nhật thông tin học sinh '{$student->full_name}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        if ($teacher) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $this->studentService->deleteStudent($id, $admin);

        return redirect()->route('students.index')
            ->with('success', 'Xóa học sinh thành công!');
    }

    public function assignClasses(AssignStudentClassesRequest $request, int $id): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        if ($teacher) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $classIds = $request->input('class_ids', []);
        $this->studentService->assignClassesToStudent($id, is_array($classIds) ? $classIds : [], $admin);

        return back()->with('success', 'Cập nhật danh sách lớp học của học sinh thành công!');
    }

    public function bulkAssign(BulkAssignClassStudentsRequest $request): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        if ($teacher) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $classId    = (int) $request->input('class_id');
        $studentIds = (array) $request->input('student_ids', []);

        $result = $this->studentService->bulkAssignStudentsToClass($classId, $studentIds, $admin);

        return back()->with('success', $result['message']);
    }

    public function removeClass(int $id, int $classId): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        if ($teacher) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $this->studentService->removeStudentFromClass($id, $classId, $admin);

        return back()->with('success', 'Đã xóa học sinh khỏi lớp học.');
    }

    public function export(Request $request): StreamedResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $isSuperAdmin      = $admin && $admin->isSuperAdmin();

        if ($admin && ! $isSuperAdmin) {
            $centerId = (int) $admin->centers()->value('centers.id');
        } elseif ($teacher) {
            $centerId = (int) $teacher->center_id;
        } else {
            $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        }

        $classId  = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $fileName = 'danh_sach_hoc_sinh_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($centerId, $classId, $isSuperAdmin) {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");

            foreach ($this->studentExportImportService->exportStudentsCsv($centerId, $classId, $isSuperAdmin) as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $headers);
    }

    public function import(ImportCsvRequest $request): RedirectResponse
    {
        $file = $request->file('file');

        if (! $file) {
            return back()->with('error', 'Vui lòng chọn tệp CSV.');
        }

        [$admin, $teacher] = $this->getAuthUser();
        $isSuperAdmin      = $admin && $admin->isSuperAdmin();
        $centerId          = null;

        if ($admin) {
            if ($isSuperAdmin) {
                $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
            } else {
                $centerId = (int) $admin->centers()->value('centers.id');
            }
        } elseif ($teacher) {
            $centerId = (int) $teacher->center_id;
        }

        $result = $this->studentExportImportService->importStudentsCsv(
            $file->getPathname(),
            $centerId,
            $isSuperAdmin
        );

        $msg = "Import thành công: {$result['imported']} học sinh mới, cập nhật: {$result['updated']} học sinh.";

        if (! empty($result['errors'])) {
            $msg .= ' Lỗi ở các dòng: ' . implode('; ', array_slice($result['errors'], 0, 5));
        }

        return back()->with('success', $msg);
    }

    public function downloadSample(): StreamedResponse
    {
        [$admin]      = $this->getAuthUser();
        $isSuperAdmin = $admin && $admin->isSuperAdmin();

        $fileName = 'mau_import_hoc_sinh.csv';
        $headers  = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($isSuperAdmin) {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");

            foreach ($this->studentExportImportService->getSampleCsvRows($isSuperAdmin) as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Thời khóa biểu cho học sinh đang đăng nhập
     * @param Request $request
     */
    public function mySchedule(Request $request): InertiaResponse
    {
        /** @var \App\Models\Student|null $student */
        $student = Auth::guard('student')->user();

        if (! $student) {
            abort(403, 'Chỉ học sinh mới có quyền truy cập trang lịch học cá nhân.');
        }

        $weekDate      = $request->query('date');
        $timetableData = $this->studentService->getStudentTimetableData(
            $student->id,
            is_string($weekDate) ? $weekDate : null,
            $student
        );

        return Inertia::render('Student/Schedule', $timetableData);
    }

    /**
     * Thời khóa biểu học sinh (Admin / Teacher / Student)
     * @param Request $request
     * @param int     $id
     */
    public function schedule(Request $request, int $id): InertiaResponse
    {
        /** @var \App\Models\Student|null $currentStudent */
        $currentStudent = Auth::guard('student')->user();

        if ($currentStudent) {
            if ($currentStudent->id !== $id) {
                abort(403, 'Học sinh chỉ được xem lịch học của chính mình.');
            }

            return $this->mySchedule($request);
        }

        [$admin, $teacher] = $this->getAuthUser();
        $weekDate          = $request->query('date');
        $timetableData     = $this->studentService->getStudentTimetableData(
            $id,
            is_string($weekDate) ? $weekDate : null,
            null,
            $admin
        );

        return Inertia::render('Student/Schedule', $timetableData);
    }

    public function show(Request $request, int $id): InertiaResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $filterType        = $request->query('type', 'month');
        $filterMonth       = $request->query('month') ? (int) $request->query('month') : null;
        $filterYear        = $request->query('year') ? (int) $request->query('year') : null;
        $page              = $request->integer('page', 1);
        $perPage           = $request->integer('per_page', config('app.pagination_per_page', 20));

        $detailData = $this->studentService->getStudentDetailData(
            $id,
            is_string($filterType) ? $filterType : 'month',
            $filterMonth,
            $filterYear,
            $admin,
            $teacher,
            $perPage,
            $page
        );

        return Inertia::render('Admin/Students/Show', $detailData);
    }

    public function exportAttendances(Request $request, int $id): StreamedResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        if ($teacher) {
            throw new NotFoundHttpException('Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $filterType  = $request->query('type', 'month');
        $filterMonth = $request->query('month') ? (int) $request->query('month') : null;
        $filterYear  = $request->query('year') ? (int) $request->query('year') : null;

        $fileName = 'diem_danh_hoc_sinh_' . $id . '_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($id, $filterType, $filterMonth, $filterYear, $admin) {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");

            foreach ($this->studentService->exportStudentAttendanceCsv(
                $id,
                is_string($filterType) ? $filterType : 'month',
                $filterMonth,
                $filterYear,
                $admin
            ) as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
