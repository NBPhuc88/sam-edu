<?php

namespace App\Http\Controllers;

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
            is_string($status) ? $status : null,
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
                'status'    => $status ?? 'all',
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

    public function export(Request $request): StreamedResponse
    {
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId  = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $fileName = 'danh_sach_hoc_sinh_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($centerId, $classId) {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");

            foreach ($this->studentExportImportService->exportStudentsCsv($centerId, $classId) as $row) {
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

        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $result   = $this->studentExportImportService->importStudentsCsv($file->getPathname(), $centerId);

        $msg = "Import thành công: {$result['imported']} học sinh mới, cập nhật: {$result['updated']} học sinh.";

        if (! empty($result['errors'])) {
            $msg .= ' Lỗi ở các dòng: ' . implode('; ', array_slice($result['errors'], 0, 5));
        }

        return back()->with('success', $msg);
    }

    public function downloadSample(): StreamedResponse
    {
        $fileName = 'mau_import_hoc_sinh.csv';
        $headers  = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");

            foreach ($this->studentExportImportService->getSampleCsvRows() as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
