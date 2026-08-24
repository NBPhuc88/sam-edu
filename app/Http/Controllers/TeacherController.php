<?php

namespace App\Http\Controllers;

use App\Http\Requests\Student\ImportCsvRequest;
use App\Http\Requests\Teacher\FilterTeacherRequest;
use App\Http\Requests\Teacher\StoreTeacherRequest;
use App\Http\Requests\Teacher\UpdateTeacherRequest;
use App\Models\Admin;
use App\Services\Teacher\TeacherExportImportServiceInterface;
use App\Services\Teacher\TeacherServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

    protected function getAuthAdmin(): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }

    public function index(FilterTeacherRequest $request): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $search   = $request->input('search');
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $status   = $request->input('status');
        $page     = $request->integer('page', 1);
        $perPage  = $request->integer('per_page', config('app.pagination_per_page', 20));

        $teachers = $this->teacherService->getPaginatedTeachers(
            is_string($search) ? $search : null,
            $centerId,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $admin
        );

        $formData = $this->teacherService->getFormData($admin);

        return Inertia::render('Admin/Teachers/Index', [
            'teachers' => $teachers,
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
        $formData = $this->teacherService->getFormData($admin);

        return Inertia::render('Admin/Teachers/Create', [
            'centers' => $formData['centers'],
        ]);
    }

    public function store(StoreTeacherRequest $request): RedirectResponse
    {
        $admin   = $this->getAuthAdmin();
        $teacher = $this->teacherService->createTeacher($request->validated(), $admin);

        return redirect()->route('teachers.index')
            ->with('success', "Thêm giáo viên '{$teacher->full_name}' thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $teacher  = $this->teacherService->findTeacher($id, $admin);
        $formData = $this->teacherService->getFormData($admin);

        return Inertia::render('Admin/Teachers/Edit', [
            'teacher' => $teacher,
            'centers' => $formData['centers'],
        ]);
    }

    public function update(UpdateTeacherRequest $request, int $id): RedirectResponse
    {
        $admin   = $this->getAuthAdmin();
        $teacher = $this->teacherService->updateTeacher($id, $request->validated(), $admin);

        return redirect()->route('teachers.index')
            ->with('success', "Cập nhật thông tin giáo viên '{$teacher->full_name}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->teacherService->deleteTeacher($id, $admin);

        return redirect()->route('teachers.index')
            ->with('success', 'Xóa giáo viên thành công!');
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

        $admin    = $this->getAuthAdmin();
        $centerId = null;

        if ($admin) {
            if ($admin->isSuperAdmin()) {
                $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
            } else {
                $centerId = (int) $admin->centers()->value('centers.id');
            }
        }

        $result = $this->teacherExportImportService->importTeachersCsv($file->getPathname(), $centerId);

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

    public function schedule(Request $request, int $id): InertiaResponse
    {
        $admin         = $this->getAuthAdmin();
        $weekDate      = $request->query('date');
        $timetableData = $this->teacherService->getTeacherTimetableData(
            $id,
            is_string($weekDate) ? $weekDate : null,
            $admin
        );

        return Inertia::render('Admin/Teachers/Schedule', $timetableData);
    }
}
