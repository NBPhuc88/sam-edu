<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tuition\FilterStudentTuitionRequest;
use App\Http\Requests\Tuition\StoreStudentTuitionRequest;
use App\Http\Requests\Tuition\StoreTuitionPaymentRequest;
use App\Http\Requests\Tuition\UpdateStudentTuitionRequest;
use App\Http\Requests\Tuition\UpdateTuitionPaymentRequest;
use App\Models\Admin;
use App\Services\Tuition\StudentTuitionServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class StudentTuitionController extends Controller
{
    public function __construct(
        protected StudentTuitionServiceInterface $studentTuitionService
    ) {
    }

    protected function getAuthAdmin(): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        if (! $admin) {
            abort(403, 'Chỉ Quản trị viên (Admin) mới có quyền truy cập trang quản lý học phí.');
        }

        return $admin;
    }

    public function myTuitions(Request $request): InertiaResponse
    {
        /** @var \App\Models\Student|null $student */
        $student = Auth::guard('student')->user();

        if (! $student) {
            abort(403, 'Chỉ học sinh mới có quyền truy cập lịch sử học phí cá nhân.');
        }

        $search  = $request->input('search');
        $status  = $request->input('status');
        $page    = $request->integer('page', 1);
        $perPage = $request->integer('per_page', config('app.pagination_per_page', 20));

        $tuitions = $this->studentTuitionService->getPaginatedTuitions(
            is_string($search) ? $search : null,
            null,
            null,
            $student->id,
            is_string($status) && $status !== '' ? $status : null,
            $perPage,
            $page,
            null
        );

        $stats = $this->studentTuitionService->getStudentTuitionSummary($student->id);

        return Inertia::render('Student/Tuitions/Index', [
            'student'  => $student,
            'tuitions' => $tuitions,
            'stats'    => $stats,
            'filters'  => [
                'search'   => $search ?? '',
                'status'   => $status ?? '',
                'per_page' => $perPage,
            ],
        ]);
    }

    public function index(FilterStudentTuitionRequest $request): InertiaResponse
    {
        /** @var \App\Models\Student|null $student */
        $student = Auth::guard('student')->user();

        if ($student) {
            return $this->myTuitions($request);
        }

        $admin    = $this->getAuthAdmin();
        $search   = $request->input('search');
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId  = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $status   = $request->input('status');
        $month    = $request->input('month');
        $page     = $request->integer('page', 1);
        $perPage  = $request->integer('per_page', config('app.pagination_per_page', 20));

        $tuitions = $this->studentTuitionService->getPaginatedTuitions(
            is_string($search) ? $search : null,
            $centerId,
            $classId,
            null,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $admin,
            is_string($month) && $month !== '' ? $month : null
        );

        $stats = $this->studentTuitionService->getSummaryStats(
            $admin,
            $centerId,
            $classId,
            is_string($month) && $month !== '' ? $month : null
        );
        $chartStats = $this->studentTuitionService->getDetailedChartStats(
            $admin,
            $centerId,
            $classId,
            is_string($month) && $month !== '' ? $month : null
        );
        $formData = $this->studentTuitionService->getFormData($admin, $centerId);

        return Inertia::render('Admin/Tuitions/Index', [
            'tuitions'   => $tuitions,
            'stats'      => $stats,
            'chartStats' => $chartStats,
            'centers'    => $formData['centers'],
            'classes'    => $formData['classes'],
            'filters'    => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
                'class_id'  => $classId,
                'status'    => $status ?? '',
                'month'     => $month ?? '',
                'per_page'  => $perPage,
            ],
        ]);
    }

    public function export(FilterStudentTuitionRequest $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $admin    = $this->getAuthAdmin();
        $search   = $request->input('search');
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId  = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $status   = $request->input('status');
        $month    = $request->input('month');

        $fileName = 'danh_sach_hoc_phi_' . date('Y-m-d_H-i-s') . '.xls';

        $headers = [
            'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($search, $centerId, $classId, $status, $month, $admin) {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            foreach ($this->studentTuitionService->exportTuitionsHtml(
                is_string($search) ? $search : null,
                $centerId,
                $classId,
                is_string($status) && $status !== '' ? $status : null,
                is_string($month) && $month !== '' ? $month : null,
                $admin
            ) as $chunk) {
                fwrite($handle, $chunk);
            }

            fclose($handle);
        }, 200, $headers);
    }

    public function create(Request $request): InertiaResponse
    {
        $admin            = $this->getAuthAdmin();
        $selectedCenterId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $formData         = $this->studentTuitionService->getFormData($admin, $selectedCenterId);

        return Inertia::render('Admin/Tuitions/Create', [
            'centers'          => $formData['centers'],
            'classes'          => $formData['classes'],
            'students'         => $formData['students'],
            'selectedCenterId' => $formData['selected_center_id'],
        ]);
    }

    public function store(StoreStudentTuitionRequest $request): RedirectResponse
    {
        $admin   = $this->getAuthAdmin();
        $tuition = $this->studentTuitionService->createTuition($request->validated(), $admin);

        return redirect()->route('tuitions.show', $tuition->id)
            ->with('success', "Khởi tạo hồ sơ học phí cho học sinh '{$tuition->student?->full_name}' thành công!");
    }

    public function show(int $id): InertiaResponse
    {
        $admin   = $this->getAuthAdmin();
        $tuition = $this->studentTuitionService->findTuition($id, $admin);

        return Inertia::render('Admin/Tuitions/Show', [
            'tuition' => $tuition,
        ]);
    }

    public function edit(int $id): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $tuition  = $this->studentTuitionService->findTuition($id, $admin);
        $formData = $this->studentTuitionService->getFormData($admin, $tuition->center_id);

        return Inertia::render('Admin/Tuitions/Edit', [
            'tuition'  => $tuition,
            'centers'  => $formData['centers'],
            'classes'  => $formData['classes'],
            'students' => $formData['students'],
        ]);
    }

    public function update(UpdateStudentTuitionRequest $request, int $id): RedirectResponse
    {
        $admin   = $this->getAuthAdmin();
        $tuition = $this->studentTuitionService->updateTuition($id, $request->validated(), $admin);

        return redirect()->route('tuitions.show', $tuition->id)
            ->with('success', 'Cập nhật thông tin học phí thành công!');
    }

    public function destroy(int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->studentTuitionService->deleteTuition($id, $admin);

        return redirect()->route('tuitions.index')
            ->with('success', 'Xóa hồ sơ học phí thành công!');
    }

    public function storePayment(StoreTuitionPaymentRequest $request, int $tuitionId): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->studentTuitionService->recordPayment($tuitionId, $request->validated(), $admin);

        return redirect()->back()
            ->with('success', 'Ghi nhận đợt đóng học phí mới thành công!');
    }

    public function updatePayment(UpdateTuitionPaymentRequest $request, int $paymentId): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->studentTuitionService->updatePayment($paymentId, $request->validated(), $admin);

        return redirect()->back()
            ->with('success', 'Cập nhật thông tin đợt đóng học phí thành công!');
    }

    public function destroyPayment(int $paymentId): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->studentTuitionService->deletePayment($paymentId, $admin);

        return redirect()->back()
            ->with('success', 'Xóa đợt thu học phí thành công!');
    }
}
