<?php

namespace App\Http\Controllers;

use App\Http\Requests\Student\ImportCsvRequest;
use App\Models\Student;
use App\Services\Student\StudentExportImportServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentController extends Controller
{
    public function __construct(
        protected StudentExportImportServiceInterface $studentExportImportService
    ) {
    }

    public function index(Request $request): InertiaResponse
    {
        $search   = $request->input('search');
        $centerId = $request->input('center_id');
        $perPage  = 15;
        $page     = $request->integer('page', 1);
        $offset   = max(0, ($page - 1) * $perPage);

        $query = Student::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('student_code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($centerId) {
            $query->where('center_id', $centerId);
        }

        // Deferred Join Subquery Pattern for pagination optimization
        if ($offset > 0) {
            $idQuery   = (clone $query)->select('id')->latest('id')->offset($offset)->limit($perPage);
            $targetIds = $idQuery->pluck('id')->toArray();

            if (! empty($targetIds)) {
                $students = Student::with('center')
                    ->whereIn('id', $targetIds)
                    ->latest('id')
                    ->paginate($perPage)
                    ->withQueryString();

                return Inertia::render('Admin/Students/Index', [
                    'students' => $students,
                    'filters'  => [
                        'search'    => $search,
                        'center_id' => $centerId,
                    ],
                ]);
            }
        }

        $students = $query->with('center')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Students/Index', [
            'students' => $students,
            'filters'  => [
                'search'    => $search,
                'center_id' => $centerId,
            ],
        ]);
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

            // UTF-8 BOM cho Excel
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
