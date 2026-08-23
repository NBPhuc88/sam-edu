<?php

namespace App\Http\Controllers;

use App\Http\Requests\Class\AddStudentsToClassRequest;
use App\Http\Requests\Class\FilterClassStudentRequest;
use App\Http\Requests\Student\ImportCsvRequest;
use App\Services\Class\SchoolClassServiceInterface;
use App\Services\Class\StudentExportImportServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Models\Admin;
use Illuminate\Support\Facades\Auth;

class SchoolClassStudentController extends Controller
{
    public function __construct(
        protected SchoolClassServiceInterface $schoolClassService,
        protected StudentExportImportServiceInterface $studentExportImportService
    ) {
    }

    protected function getAuthUser(): array
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();
        /** @var \App\Models\Teacher|null $teacher */
        $teacher = Auth::guard('teacher')->user();

        return [$admin, $teacher];
    }

    public function index(FilterClassStudentRequest $request, int $classId): InertiaResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $schoolClass       = $this->schoolClassService->getClassWithCenter($classId, $admin, $teacher);

        $search  = $request->input('search');
        $page    = $request->integer('page', 1);
        $perPage = $request->integer('per_page', config('app.pagination_per_page', 20));

        $students = $this->schoolClassService->getPaginatedClassStudents(
            $classId,
            is_string($search) ? $search : null,
            $perPage,
            $page,
            $admin,
            $teacher
        );

        return Inertia::render('Admin/Classes/Students', [
            'schoolClass' => $schoolClass,
            'students'    => $students,
            'filters'     => [
                'search'   => $search ?? '',
                'per_page' => $perPage,
            ],
            'isTeacher' => (bool) $teacher,
        ]);
    }

    public function export(int $classId): StreamedResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $schoolClass       = $this->schoolClassService->getClassWithCenter($classId, $admin, $teacher);
        $fileName          = 'danh_sach_hoc_sinh_lop_' . Str::slug($schoolClass->code) . '_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($classId) {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");

            foreach ($this->studentExportImportService->exportClassStudentsCsv($classId) as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $headers);
    }

    public function import(ImportCsvRequest $request, int $classId): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $this->schoolClassService->findClass($classId, $admin, $teacher);

        $file = $request->file('file');

        if (! $file) {
            return back()->with('error', 'Vui lòng chọn tệp CSV.');
        }

        $result = $this->studentExportImportService->importClassStudentsCsv($classId, $file->getPathname());

        $msg = "Ghi danh thành công {$result['imported']} học sinh vào lớp.";

        if (! empty($result['errors'])) {
            $msg .= ' Lỗi ở các dòng: ' . implode('; ', array_slice($result['errors'], 0, 5));
        }

        return back()->with('success', $msg);
    }

    public function downloadSample(): StreamedResponse
    {
        $fileName = 'mau_import_hoc_sinh_lop_hoc.csv';
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

    public function availableStudents(Request $request, int $classId): \Illuminate\Http\JsonResponse
    {
        [$admin, $teacher] = $this->getAuthUser();
        $search            = $request->input('search');

        $students = $this->schoolClassService->getAvailableStudents(
            $classId,
            is_string($search) ? $search : null,
            $admin
        );

        return response()->json($students);
    }

    public function addStudents(AddStudentsToClassRequest $request, int $classId): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        $studentIds = (array) $request->input('student_ids', []);
        $count      = $this->schoolClassService->addStudentsToClass($classId, $studentIds, $admin);

        return back()->with('success', "Đã thêm thành công {$count} học sinh vào lớp học.");
    }

    public function removeStudent(int $classId, int $studentId): RedirectResponse
    {
        [$admin, $teacher] = $this->getAuthUser();

        $this->schoolClassService->removeStudentFromClass($classId, $studentId, $admin);

        return back()->with('success', 'Đã xóa học sinh khỏi lớp học.');
    }
}
