<?php

namespace App\Http\Controllers;

use App\Http\Requests\Student\FilterStudentRequest;
use App\Http\Requests\Student\ImportCsvRequest;
use App\Http\Requests\Student\StoreStudentRequest;
use App\Http\Requests\Student\UpdateStudentRequest;
use App\Models\Admin;
use App\Services\Student\StudentExportImportServiceInterface;
use App\Services\Student\StudentServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentController extends Controller
{
    public function __construct(
        protected StudentServiceInterface $studentService,
        protected StudentExportImportServiceInterface $studentExportImportService
    ) {
    }

    protected function getAuthAdmin(): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }

    public function index(FilterStudentRequest $request): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $search   = $request->input('search');
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $status   = $request->input('status');
        $page     = $request->integer('page', 1);
        $perPage  = $request->integer('per_page', config('app.pagination_per_page', 20));

        $students = $this->studentService->getPaginatedStudents(
            is_string($search) ? $search : null,
            $centerId,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $admin
        );

        $formData = $this->studentService->getFormData($admin);

        return Inertia::render('Admin/Students/Index', [
            'students' => $students,
            'centers'  => $formData['centers'],
            'filters'  => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
                'status'    => $status ?? 'all',
                'per_page'  => $perPage,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $formData = $this->studentService->getFormData($admin);

        return Inertia::render('Admin/Students/Create', [
            'centers' => $formData['centers'],
        ]);
    }

    public function store(StoreStudentRequest $request): RedirectResponse
    {
        $admin   = $this->getAuthAdmin();
        $student = $this->studentService->createStudent($request->validated(), $admin);

        return redirect()->route('students.index')
            ->with('success', "Thêm học sinh '{$student->full_name}' thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $student  = $this->studentService->findStudent($id, $admin);
        $formData = $this->studentService->getFormData($admin);

        return Inertia::render('Admin/Students/Edit', [
            'student' => $student,
            'centers' => $formData['centers'],
        ]);
    }

    public function update(UpdateStudentRequest $request, int $id): RedirectResponse
    {
        $admin   = $this->getAuthAdmin();
        $student = $this->studentService->updateStudent($id, $request->validated(), $admin);

        return redirect()->route('students.index')
            ->with('success', "Cập nhật thông tin học sinh '{$student->full_name}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->studentService->deleteStudent($id, $admin);

        return redirect()->route('students.index')
            ->with('success', 'Xóa học sinh thành công!');
    }

    public function export(Request $request): StreamedResponse
    {
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $fileName = 'danh_sach_hoc_sinh_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($centerId) {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");

            foreach ($this->studentExportImportService->exportStudentsCsv($centerId) as $row) {
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
