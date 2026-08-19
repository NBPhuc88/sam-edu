<?php

namespace App\Services\Tuition;

use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentTuition;
use App\Models\TuitionPayment;
use App\Repositories\Tuition\StudentTuitionRepositoryInterface;
use App\Repositories\Tuition\TuitionPaymentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class StudentTuitionService implements StudentTuitionServiceInterface
{
    public function __construct(
        protected StudentTuitionRepositoryInterface $studentTuitionRepository,
        protected TuitionPaymentRepositoryInterface $tuitionPaymentRepository
    ) {
    }

    /**
     * @param  ?Admin          $admin
     * @return array<int>|null Null nghĩa là có quyền xem tất cả (Super Admin)
     */
    protected function getAllowedCenterIds(?Admin $admin): ?array
    {
        if (! $admin) {
            return [];
        }

        if ($admin->isSuperAdmin()) {
            return null; // All centers
        }

        return $admin->centers()->pluck('centers.id')->toArray();
    }

    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?int                 $studentId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedTuitions(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $studentId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null
    ): LengthAwarePaginator {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null) {
            if ($centerId !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                $centerIds = []; // No access
            } elseif ($centerId !== null) {
                $centerIds = [$centerId];
            } else {
                $centerIds = $allowedCenterIds;
            }
        } else {
            $centerIds = $centerId;
        }

        return $this->studentTuitionRepository->paginate(
            $search,
            $centerIds,
            $classId,
            $studentId,
            $status,
            $perPage,
            $page
        );
    }

    /**
     * @param  ?Admin               $admin
     * @param  ?int                 $selectedCenterId
     * @return array<string, mixed>
     */
    public function getSummaryStats(?Admin $admin = null, ?int $selectedCenterId = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null) {
            if ($selectedCenterId !== null && in_array($selectedCenterId, $allowedCenterIds, true)) {
                $centerIds = [$selectedCenterId];
            } else {
                $centerIds = $allowedCenterIds;
            }
        } else {
            $centerIds = $selectedCenterId ? [$selectedCenterId] : null;
        }

        $stats = $this->studentTuitionRepository->getSummaryStats($centerIds);

        $lastMonthStart = now()->startOfMonth()->subMonth()->toDateString();
        $lastMonthEnd   = now()->startOfMonth()->subMonth()->endOfMonth()->toDateString();
        $thisMonthStart = now()->startOfMonth()->toDateString();
        $today          = now()->toDateString();

        $stats['last_month_paid_amount'] = $this->tuitionPaymentRepository->getSumBetweenDates($centerIds, $lastMonthStart, $lastMonthEnd);
        $stats['this_month_paid_amount'] = $this->tuitionPaymentRepository->getSumBetweenDates($centerIds, $thisMonthStart, $today);
        $stats['last_month_name']        = 'Tháng ' . now()->startOfMonth()->subMonth()->format('m/Y');
        $stats['this_month_name']        = 'Tháng ' . now()->format('m/Y') . ' (Đến nay)';

        return $stats;
    }

    /**
     * @param  ?Admin               $admin
     * @param  ?int                 $selectedCenterId
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null, ?int $selectedCenterId = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        $centersQuery = Center::query()->where('status', 'active');

        if ($allowedCenterIds !== null) {
            $centersQuery->whereIn('id', $allowedCenterIds);
        }
        $centers = $centersQuery->orderBy('name')->get(['id', 'name', 'code']);

        $centerId = $selectedCenterId ?? ($centers->first()?->id ?? null);

        $classesQuery = SchoolClass::query()->where('status', 'active');

        if ($centerId) {
            $classesQuery->where('center_id', $centerId);
        } elseif ($allowedCenterIds !== null) {
            $classesQuery->whereIn('center_id', $allowedCenterIds);
        }
        $classes = $classesQuery->orderBy('name')->get(['id', 'name', 'code', 'center_id']);

        $studentsQuery = Student::query()->where('status', 'active');

        if ($centerId) {
            $studentsQuery->where('center_id', $centerId);
        } elseif ($allowedCenterIds !== null) {
            $studentsQuery->whereIn('center_id', $allowedCenterIds);
        }
        $students = $studentsQuery->orderBy('full_name')->get(['id', 'full_name', 'student_code', 'phone', 'center_id']);

        return [
            'centers'            => $centers,
            'classes'            => $classes,
            'students'           => $students,
            'selected_center_id' => $centerId,
        ];
    }

    /**
     * @param  int                 $id
     * @param  ?Admin              $admin
     * @return StudentTuition|null
     */
    public function findTuition(int $id, ?Admin $admin = null): ?StudentTuition
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $tuition          = $this->studentTuitionRepository->find($id, $allowedCenterIds);

        if (! $tuition) {
            throw new NotFoundHttpException('Không tìm thấy thông tin hồ sơ học phí hoặc bạn không có quyền truy cập.');
        }

        return $tuition;
    }

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return StudentTuition
     */
    public function createTuition(array $data, ?Admin $admin = null): StudentTuition
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $centerId         = (int) $data['center_id'];

        if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền quản lý học phí của Trung tâm này.');
        }

        $totalAmount = (float) $data['total_amount'];
        $title       = $data['title'] ?? null;

        if (empty($title)) {
            $class = SchoolClass::find($data['class_id']);
            $title = 'Học phí ' . ($class ? $class->name : 'lớp học');
        }

        $tuition = $this->studentTuitionRepository->create([
            'center_id'        => $centerId,
            'student_id'       => (int) $data['student_id'],
            'class_id'         => (int) $data['class_id'],
            'title'            => $title,
            'total_amount'     => $totalAmount,
            'paid_amount'      => 0,
            'remaining_amount' => $totalAmount,
            'status'           => 'pending',
            'due_date'         => $data['due_date'] ?? null,
            'note'             => $data['note'] ?? null,
            'created_by'       => $admin?->id,
        ]);

        // Nếu người dùng nhập luôn đợt thanh toán ban đầu (First installment)
        if (! empty($data['initial_payment_amount']) && (float) $data['initial_payment_amount'] > 0) {
            $this->recordPayment($tuition->id, [
                'amount'           => (float) $data['initial_payment_amount'],
                'payment_date'     => $data['initial_payment_date'] ?? now()->format('Y-m-d'),
                'payment_method'   => $data['initial_payment_method'] ?? 'bank_transfer',
                'transaction_code' => $data['initial_transaction_code'] ?? null,
                'note'             => $data['initial_payment_note'] ?? 'Đóng đợt 1 khi khởi tạo hồ sơ',
            ], $admin);
        }

        return $tuition->fresh(['student', 'schoolClass', 'center', 'payments']);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return StudentTuition
     */
    public function updateTuition(int $id, array $data, ?Admin $admin = null): StudentTuition
    {
        $tuition = $this->findTuition($id, $admin);

        if (isset($data['center_id'])) {
            $centerId         = (int) $data['center_id'];
            $allowedCenterIds = $this->getAllowedCenterIds($admin);

            if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                throw new AccessDeniedHttpException('Bạn không có quyền chuyển hồ sơ sang Trung tâm này.');
            }
        }

        $this->studentTuitionRepository->update($id, [
            'center_id'    => $data['center_id'] ?? $tuition->center_id,
            'student_id'   => $data['student_id'] ?? $tuition->student_id,
            'class_id'     => $data['class_id'] ?? $tuition->class_id,
            'title'        => $data['title'] ?? $tuition->title,
            'total_amount' => (float) ($data['total_amount'] ?? $tuition->total_amount),
            'due_date'     => array_key_exists('due_date', $data) ? $data['due_date'] : $tuition->due_date,
            'note'         => array_key_exists('note', $data) ? $data['note'] : $tuition->note,
        ]);

        $this->recalculateSummary($id);

        return $this->findTuition($id, $admin);
    }

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteTuition(int $id, ?Admin $admin = null): bool
    {
        $tuition = $this->findTuition($id, $admin);

        return $this->studentTuitionRepository->delete($tuition->id);
    }

    /**
     * @param  int                  $tuitionId
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return TuitionPayment
     */
    public function recordPayment(int $tuitionId, array $data, ?Admin $admin = null): TuitionPayment
    {
        $tuition = $this->findTuition($tuitionId, $admin);
        $amount  = (float) $data['amount'];

        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Số tiền đóng phải lớn hơn 0đ.']);
        }

        $payment = $this->tuitionPaymentRepository->create([
            'student_tuition_id' => $tuition->id,
            'amount'             => $amount,
            'payment_date'       => $data['payment_date'] ?? now()->format('Y-m-d'),
            'payment_method'     => $data['payment_method'] ?? 'bank_transfer',
            'transaction_code'   => $data['transaction_code'] ?? null,
            'note'               => $data['note'] ?? null,
            'received_by'        => $admin?->id,
        ]);

        $this->recalculateSummary($tuition->id);

        return $payment;
    }

    /**
     * @param  int                  $paymentId
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return TuitionPayment
     */
    public function updatePayment(int $paymentId, array $data, ?Admin $admin = null): TuitionPayment
    {
        $payment = $this->tuitionPaymentRepository->find($paymentId);

        if (! $payment) {
            throw new NotFoundHttpException('Không tìm thấy đợt thanh toán.');
        }

        // Check permission via tuition
        $this->findTuition($payment->student_tuition_id, $admin);

        if (isset($data['amount']) && (float) $data['amount'] <= 0) {
            throw ValidationException::withMessages(['amount' => 'Số tiền đóng phải lớn hơn 0đ.']);
        }

        $updatedPayment = $this->tuitionPaymentRepository->update($paymentId, [
            'amount'           => isset($data['amount']) ? (float) $data['amount'] : $payment->amount,
            'payment_date'     => $data['payment_date'] ?? $payment->payment_date,
            'payment_method'   => $data['payment_method'] ?? $payment->payment_method,
            'transaction_code' => array_key_exists('transaction_code', $data) ? $data['transaction_code'] : $payment->transaction_code,
            'note'             => array_key_exists('note', $data) ? $data['note'] : $payment->note,
        ]);

        $this->recalculateSummary($payment->student_tuition_id);

        return $updatedPayment;
    }

    /**
     * @param  int    $paymentId
     * @param  ?Admin $admin
     * @return bool
     */
    public function deletePayment(int $paymentId, ?Admin $admin = null): bool
    {
        $payment = $this->tuitionPaymentRepository->find($paymentId);

        if (! $payment) {
            throw new NotFoundHttpException('Không tìm thấy đợt thanh toán.');
        }

        $tuitionId = $payment->student_tuition_id;
        $this->findTuition($tuitionId, $admin);

        $deleted = $this->tuitionPaymentRepository->delete($paymentId);
        $this->recalculateSummary($tuitionId);

        return $deleted;
    }

    /**
     * Tự động tính toán lại paid_amount, remaining_amount, và status của hồ sơ học phí
     *
     * @param  int  $tuitionId
     * @return void
     */
    public function recalculateSummary(int $tuitionId): void
    {
        $tuition = StudentTuition::with('payments')->find($tuitionId);

        if (! $tuition) {
            return;
        }

        $paidAmount      = (float) $tuition->payments()->sum('amount');
        $totalAmount     = (float) $tuition->total_amount;
        $remainingAmount = max(0, $totalAmount - $paidAmount);

        $isOverdue = $tuition->due_date && Carbon::parse($tuition->due_date)->isPast() && $remainingAmount > 0;

        if ($remainingAmount <= 0 && $totalAmount > 0) {
            $status = 'completed';
        } elseif ($paidAmount > 0) {
            $status = $isOverdue ? 'overdue' : 'partial';
        } else {
            $status = $isOverdue ? 'overdue' : 'pending';
        }

        $tuition->update([
            'paid_amount'      => $paidAmount,
            'remaining_amount' => $remainingAmount,
            'status'           => $status,
        ]);
    }
}
