<?php

namespace App\Http\Controllers;

use App\Http\Requests\Student\ImportCsvRequest;
use App\Services\Teacher\TeacherExportImportServiceInterface;
use App\Services\Teacher\TeacherServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TeacherController extends Controller
{
    public function __construct(
        protected TeacherServiceInterface $teacherService,
        protected TeacherExportImportServiceInterface $teacherExportImportService
    ) {
    }

    public function index(Request $request): InertiaResponse
    {
        $search   = $request->input('search');
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $page     = $request->integer('page', 1);

        $teachers = $this->teacherService->getPaginatedTeachers(
            is_string($search) ? $search : null,
            $centerId,
            15,
            $page
        );

        return Inertia::render('Admin/Teachers/Index', [
            'teachers' => $teachers,
            'filters'  => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $fileName = 'danh_sach_giao_vien_' . date('Y-m-d_H-i-s') . '.csv';

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

            foreach ($this->teacherExportImportService->exportTeachersCsv($centerId) as $row) {
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
        $result   = $this->teacherExportImportService->importTeachersCsv($file->getPathname(), $centerId);

        $msg = "Import thành công: {$result['imported']} giáo viên mới, cập nhật: {$result['updated']} giáo viên.";

        if (! empty($result['errors'])) {
            $msg .= ' Lỗi ở các dòng: ' . implode('; ', array_slice($result['errors'], 0, 5));
        }

        return back()->with('success', $msg);
    }

    public function downloadSample(): StreamedResponse
    {
        $fileName = 'mau_import_giao_vien.csv';
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

            foreach ($this->teacherExportImportService->getSampleCsvRows() as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
