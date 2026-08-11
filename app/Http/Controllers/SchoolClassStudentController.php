<?php

namespace App\Http\Controllers;

use App\Http\Requests\Student\ImportCsvRequest;
use App\Models\SchoolClass;
use App\Services\Class\ClassStudentExportImportServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SchoolClassStudentController extends Controller
{
    public function __construct(
        protected ClassStudentExportImportServiceInterface $classStudentExportImportService
    ) {
    }

    public function index(Request $request, int $classId): InertiaResponse
    {
        $schoolClass = SchoolClass::with('center')->findOrFail($classId);

        $search  = $request->input('search');
        $perPage = 15;
        $page    = $request->integer('page', 1);
        $offset  = max(0, ($page - 1) * $perPage);

        $query = $schoolClass->students();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('student_code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Deferred Join Subquery Pattern for pagination optimization
        if ($offset > 0) {
            $idQuery   = (clone $query)->select('students.id')->latest('students.id')->offset($offset)->limit($perPage);
            $targetIds = $idQuery->pluck('students.id')->toArray();

            if (! empty($targetIds)) {
                $students = $schoolClass->students()
                    ->withPivot('enrolled_at', 'status', 'note')
                    ->whereIn('students.id', $targetIds)
                    ->latest('students.id')
                    ->paginate($perPage)
                    ->withQueryString();

                return Inertia::render('Admin/Classes/Students', [
                    'schoolClass' => $schoolClass,
                    'students'    => $students,
                    'filters'     => [
                        'search' => $search,
                    ],
                ]);
            }
        }

        $students = $query->withPivot('enrolled_at', 'status', 'note')
            ->latest('students.id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Classes/Students', [
            'schoolClass' => $schoolClass,
            'students'    => $students,
            'filters'     => [
                'search' => $search,
            ],
        ]);
    }

    public function export(int $classId): StreamedResponse
    {
        $schoolClass = SchoolClass::findOrFail($classId);
        $fileName    = 'danh_sach_hoc_sinh_lop_' . Str::slug($schoolClass->code) . '_' . date('Y-m-d_H-i-s') . '.csv';

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

            foreach ($this->classStudentExportImportService->exportClassStudentsCsv($classId) as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $headers);
    }

    public function import(ImportCsvRequest $request, int $classId): RedirectResponse
    {
        $file = $request->file('file');

        if (! $file) {
            return back()->with('error', 'Vui lòng chọn tệp CSV.');
        }

        $result = $this->classStudentExportImportService->importClassStudentsCsv($classId, $file->getPathname());

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

            foreach ($this->classStudentExportImportService->getSampleCsvRows() as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
