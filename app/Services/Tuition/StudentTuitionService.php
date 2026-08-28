<?php

namespace App\Services\Tuition;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\StudentTuition;
use App\Models\TuitionPayment;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Student\StudentRepositoryInterface;
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
        protected TuitionPaymentRepositoryInterface $tuitionPaymentRepository,
        protected CenterRepositoryInterface $centerRepository,
        protected SchoolClassRepositoryInterface $schoolClassRepository,
        protected StudentRepositoryInterface $studentRepository
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
     * @param  ?string              $month
     * @return LengthAwarePaginator
     */
    public function getPaginatedTuitions(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $studentId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        ?Admin $admin = null,
        ?string $month = null
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
            $page,
            $month
        );
    }

    /**
     * @param  ?Admin               $admin
     * @param  ?int                 $selectedCenterId
     * @param  ?int                 $classId
     * @param  ?string              $month
     * @return array<string, mixed>
     */
    public function getSummaryStats(
        ?Admin $admin = null,
        ?int $selectedCenterId = null,
        ?int $classId = null,
        ?string $month = null
    ): array {
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

        $stats = $this->studentTuitionRepository->getSummaryStats($centerIds, null, $classId, $month);

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
     * @param  int                  $studentId
     * @return array<string, mixed>
     */
    public function getStudentTuitionSummary(int $studentId): array
    {
        return $this->studentTuitionRepository->getStudentTuitionSummary($studentId);
    }

    /**
     * @param  ?Admin               $admin
     * @param  ?int                 $selectedCenterId
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null, ?int $selectedCenterId = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $centers          = $allowedCenterIds !== null ? $this->centerRepository->getByIds($allowedCenterIds, ['id', 'name', 'code']) : $this->centerRepository->getActiveCenters();

        $centerId        = $selectedCenterId ?? ($centers->first()?->id ?? null);
        $targetCenterIds = $centerId ? [$centerId] : $allowedCenterIds;

        $classes = $this->schoolClassRepository->getClassesByCenterIds($targetCenterIds);
        $classes->load(['students:id,full_name,student_code,phone,center_id']);
        $students = $this->studentRepository->getActiveStudents($targetCenterIds, ['id', 'full_name', 'student_code', 'phone', 'center_id']);

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

        $totalAmount          = (float) $data['total_amount'];
        $initialPaymentAmount = ! empty($data['initial_payment_amount']) ? (float) $data['initial_payment_amount'] : 0;

        if ($initialPaymentAmount > $totalAmount) {
            throw ValidationException::withMessages([
                'initial_payment_amount' => 'Số tiền đóng đợt 1 (' . number_format($initialPaymentAmount, 0, ',', '.') . 'đ) không được vượt quá tổng số tiền học phí cần đóng (' . number_format($totalAmount, 0, ',', '.') . 'đ).',
            ]);
        }

        $title = $data['title'] ?? null;

        if (empty($title)) {
            $class = $this->schoolClassRepository->find((int) $data['class_id']);
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
        if ($initialPaymentAmount > 0) {
            $this->recordPayment($tuition->id, [
                'amount'           => $initialPaymentAmount,
                'payment_date'     => $data['initial_payment_date'] ?? now()->format('Y-m-d'),
                'payment_method'   => (int) ($data['initial_payment_method'] ?? Constant::PAYMENT_METHOD_BANK_TRANSFER),
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

        if (isset($data['total_amount'])) {
            $newTotalAmount    = (float) $data['total_amount'];
            $currentPaidAmount = (float) $tuition->paid_amount;

            if ($newTotalAmount < $currentPaidAmount) {
                throw ValidationException::withMessages([
                    'total_amount' => 'Tổng học phí (' . number_format($newTotalAmount, 0, ',', '.') . 'đ) không được nhỏ hơn tổng số tiền học sinh đã đóng (' . number_format($currentPaidAmount, 0, ',', '.') . 'đ).',
                ]);
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

        $remainingAmount = (float) $tuition->remaining_amount;

        if ($amount > $remainingAmount) {
            throw ValidationException::withMessages([
                'amount' => 'Số tiền đóng (' . number_format($amount, 0, ',', '.') . 'đ) không được vượt quá số tiền cần đóng còn lại (' . number_format($remainingAmount, 0, ',', '.') . 'đ).',
            ]);
        }

        $payment = $this->tuitionPaymentRepository->create([
            'student_tuition_id' => $tuition->id,
            'amount'             => $amount,
            'payment_date'       => $data['payment_date'] ?? now()->format('Y-m-d'),
            'payment_method'     => (int) ($data['payment_method'] ?? Constant::PAYMENT_METHOD_BANK_TRANSFER),
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
        $tuition = $this->findTuition($payment->student_tuition_id, $admin);

        if (isset($data['amount'])) {
            $amount = (float) $data['amount'];

            if ($amount <= 0) {
                throw ValidationException::withMessages(['amount' => 'Số tiền đóng phải lớn hơn 0đ.']);
            }

            // Maximum allowed amount for this payment = total_amount - sum(other payments)
            $otherPaymentsSum = (float) $tuition->payments()->where('id', '!=', $paymentId)->sum('amount');
            $maxAllowedAmount = max(0, (float) $tuition->total_amount - $otherPaymentsSum);

            if ($amount > $maxAllowedAmount) {
                throw ValidationException::withMessages([
                    'amount' => 'Số tiền đóng (' . number_format($amount, 0, ',', '.') . 'đ) không được vượt quá số tiền tối đa có thể đóng (' . number_format($maxAllowedAmount, 0, ',', '.') . 'đ).',
                ]);
            }
        }

        $updatedPayment = $this->tuitionPaymentRepository->update($paymentId, [
            'amount'           => isset($data['amount']) ? (float) $data['amount'] : $payment->amount,
            'payment_date'     => $data['payment_date'] ?? $payment->payment_date,
            'payment_method'   => isset($data['payment_method']) ? (int) $data['payment_method'] : (int) $payment->payment_method,
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
        $tuition = $this->studentTuitionRepository->find($tuitionId);

        if (! $tuition) {
            return;
        }

        $paidAmount      = (float) $tuition->payments()->sum('amount');
        $totalAmount     = (float) $tuition->total_amount;
        $remainingAmount = max(0, $totalAmount - $paidAmount);

        $isOverdue = $tuition->due_date && Carbon::parse($tuition->due_date)->isPast() && $remainingAmount > 0;

        if ($remainingAmount <= 0 && $totalAmount > 0) {
            $status = Constant::TUITION_STATUS_COMPLETED;
        } elseif ($paidAmount > 0) {
            $status = $isOverdue ? Constant::TUITION_STATUS_OVERDUE : Constant::TUITION_STATUS_PARTIAL;
        } else {
            $status = $isOverdue ? Constant::TUITION_STATUS_OVERDUE : Constant::TUITION_STATUS_PENDING;
        }

        $this->studentTuitionRepository->update($tuitionId, [
            'paid_amount'      => $paidAmount,
            'remaining_amount' => $remainingAmount,
            'status'           => $status,
        ]);
    }

    /**
     * @param  ?Admin               $admin
     * @param  ?int                 $selectedCenterId
     * @param  ?int                 $classId
     * @param  ?string              $month
     * @return array<string, mixed>
     */
    public function getDetailedChartStats(
        ?Admin $admin = null,
        ?int $selectedCenterId = null,
        ?int $classId = null,
        ?string $month = null
    ): array {
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

        return $this->studentTuitionRepository->getDetailedChartStats($centerIds, $classId, $month);
    }

    /**
     * @param  ?string    $search
     * @param  ?int       $centerId
     * @param  ?int       $classId
     * @param  ?string    $status
     * @param  ?string    $month
     * @param  ?Admin     $admin
     * @return \Generator
    /**
     * @param  ?string    $search
     * @param  ?int       $centerId
     * @param  ?int       $classId
     * @param  ?string    $status
     * @param  ?string    $month
     * @param  ?Admin     $admin
     * @return \Generator
     */
    public function exportTuitionsHtml(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?string $status = null,
        ?string $month = null,
        ?Admin $admin = null
    ): \Generator {
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

        yield '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" />' . "\n";
        yield '<style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 13px; }
            th { background-color: #4F81BD; color: #FFFFFF; font-weight: bold; border: 1px solid #385D8A; padding: 8px; text-align: center; vertical-align: middle; }
            td { border: 1px solid #D9D9D9; padding: 6px 10px; vertical-align: middle; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-format { mso-number-format:"\@"; }
            .number-format { mso-number-format:"\#\,\#\#0"; }
            .status-completed { color: #047857; font-weight: bold; }
            .status-partial { color: #b45309; font-weight: bold; }
            .status-pending { color: #4b5563; }
            .status-overdue { color: #b91c1c; font-weight: bold; }
        </style></head><body>' . "\n";

        yield '<table><thead><tr>' . "\n";
        yield '<th>STT</th>'
            . '<th>Mã Học Sinh</th>'
            . '<th>Họ Tên Học Sinh</th>'
            . '<th>Số Điện Thoại</th>'
            . '<th>Lớp Học</th>'
            . '<th>Trung Tâm</th>'
            . '<th>Tiêu Đề Khoản Thu</th>'
            . '<th>Tổng Học Phí (VND)</th>'
            . '<th>Đã Đóng (VND)</th>'
            . '<th>Còn Nợ (VND)</th>'
            . '<th>Trạng Thái</th>'
            . '<th>Hạn Đóng</th>'
            . '<th>Đợt Thu</th>'
            . '<th>Số Tiền Đợt (VND)</th>'
            . '<th>Ngày Thu</th>'
            . '<th>Phương Thức</th>'
            . '<th>Mã Giao Dịch</th>'
            . '<th>Admin Thu Tiền</th>'
            . '<th>Admin Tạo Khoản Thu</th>' . "\n";
        yield '</tr></thead><tbody>' . "\n";

        $tuitions = $this->studentTuitionRepository->getTuitionsForExport(
            $search,
            $centerIds,
            $classId,
            $status,
            $month
        );

        $stt = 1;

        foreach ($tuitions as $item) {
            $st          = is_object($item->status) ? $item->status->value : $item->status;
            $statusLabel = match ($st) {
                Constant::TUITION_STATUS_PAID, 'completed', 'paid' => 'Đã hoàn thành',
                Constant::TUITION_STATUS_PARTIAL, 'partial'        => 'Còn nợ (Đóng dở)',
                Constant::TUITION_STATUS_OVERDUE, 'overdue'        => 'Quá hạn',
                default                                            => 'Chưa đóng',
            };

            $statusClass = match ($st) {
                Constant::TUITION_STATUS_PAID, 'completed', 'paid' => 'status-completed',
                Constant::TUITION_STATUS_PARTIAL, 'partial'        => 'status-partial',
                Constant::TUITION_STATUS_OVERDUE, 'overdue'        => 'status-overdue',
                default                                            => 'status-pending',
            };

            // Lấy danh sách lớp học của học sinh (nối bằng dấu phẩy)
            $classNames = '';

            if ($item->student && $item->student->classes->isNotEmpty()) {
                $classNames = $item->student->classes->pluck('name')->implode(', ');
            } elseif ($item->schoolClass) {
                $classNames = $item->schoolClass->name;
            }

            $creatorName              = htmlspecialchars($item->creator?->full_name ?? ($item->creator?->username ?? '—'), ENT_QUOTES, 'UTF-8');
            $studentCode              = htmlspecialchars($item->student?->student_code ?? '', ENT_QUOTES, 'UTF-8');
            $studentName              = htmlspecialchars($item->student?->full_name ?? '', ENT_QUOTES, 'UTF-8');
            $studentPhone             = htmlspecialchars($item->student?->phone ?? '', ENT_QUOTES, 'UTF-8');
            $classNameEsc             = htmlspecialchars($classNames, ENT_QUOTES, 'UTF-8');
            $centerName               = htmlspecialchars($item->center?->name ?? '', ENT_QUOTES, 'UTF-8');
            $titleEsc                 = htmlspecialchars($item->title ?? '', ENT_QUOTES, 'UTF-8');
            $dueDateFormatted         = $item->due_date ? Carbon::parse($item->due_date)->format('d/m/Y') : '—';
            $totalAmountFormatted     = number_format((float) $item->total_amount, 0, ',', '.');
            $paidAmountFormatted      = number_format((float) $item->paid_amount, 0, ',', '.');
            $remainingAmountFormatted = number_format((float) $item->remaining_amount, 0, ',', '.');

            $payments = $item->payments;

            if ($payments->isNotEmpty()) {
                foreach ($payments as $idx => $payment) {
                    $installmentLabel       = 'Đợt ' . ($idx + 1);
                    $paymentAmountFormatted = number_format((float) $payment->amount, 0, ',', '.');
                    $paymentDateFormatted   = $payment->payment_date ? Carbon::parse($payment->payment_date)->format('d/m/Y') : '—';
                    $paymentMethodLabel     = Constant::PAYMENT_METHOD_LABELS[(int) $payment->payment_method] ?? 'Khác';
                    $transactionCode = htmlspecialchars($payment->transaction_code ?? '—', ENT_QUOTES, 'UTF-8');
                    $receiverName    = htmlspecialchars($payment->receiver?->full_name ?? ($payment->receiver?->username ?? '—'), ENT_QUOTES, 'UTF-8');

                    yield '<tr>'
                        . "<td class=\"text-center\">{$stt}</td>"
                        . "<td class=\"text-center text-format\">{$studentCode}</td>"
                        . "<td>{$studentName}</td>"
                        . "<td class=\"text-center text-format\">{$studentPhone}</td>"
                        . "<td>{$classNameEsc}</td>"
                        . "<td>{$centerName}</td>"
                        . "<td>{$titleEsc}</td>"
                        . "<td class=\"text-right number-format\">{$totalAmountFormatted}</td>"
                        . "<td class=\"text-right number-format\">{$paidAmountFormatted}</td>"
                        . "<td class=\"text-right number-format\">{$remainingAmountFormatted}</td>"
                        . "<td class=\"text-center {$statusClass}\">{$statusLabel}</td>"
                        . "<td class=\"text-center\">{$dueDateFormatted}</td>"
                        . "<td class=\"text-center font-bold\">{$installmentLabel}</td>"
                        . "<td class=\"text-right number-format font-bold\">{$paymentAmountFormatted}</td>"
                        . "<td class=\"text-center\">{$paymentDateFormatted}</td>"
                        . "<td class=\"text-center\">{$paymentMethodLabel}</td>"
                        . "<td class=\"text-center text-format\">{$transactionCode}</td>"
                        . "<td>{$receiverName}</td>"
                        . "<td>{$creatorName}</td>"
                        . "</tr>\n";

                    $stt++;
                }
            } else {
                yield '<tr>'
                    . "<td class=\"text-center\">{$stt}</td>"
                    . "<td class=\"text-center text-format\">{$studentCode}</td>"
                    . "<td>{$studentName}</td>"
                    . "<td class=\"text-center text-format\">{$studentPhone}</td>"
                    . "<td>{$classNameEsc}</td>"
                    . "<td>{$centerName}</td>"
                    . "<td>{$titleEsc}</td>"
                    . "<td class=\"text-right number-format\">{$totalAmountFormatted}</td>"
                    . "<td class=\"text-right number-format\">{$paidAmountFormatted}</td>"
                    . "<td class=\"text-right number-format\">{$remainingAmountFormatted}</td>"
                    . "<td class=\"text-center {$statusClass}\">{$statusLabel}</td>"
                    . "<td class=\"text-center\">{$dueDateFormatted}</td>"
                    . '<td class="text-center">Chưa đóng</td>'
                    . '<td class="text-right number-format">0</td>'
                    . '<td class="text-center">—</td>'
                    . '<td class="text-center">—</td>'
                    . '<td class="text-center">—</td>'
                    . '<td class="text-center">—</td>'
                    . "<td>{$creatorName}</td>"
                    . "</tr>\n";

                $stt++;
            }
        }

        yield "</tbody></table></body></html>\n";
    }

    /**
     * @param  ?string    $search
     * @param  ?int       $centerId
     * @param  ?int       $classId
     * @param  ?string    $status
     * @param  ?string    $month
     * @param  ?Admin     $admin
     * @return \Generator
     */
    public function exportTuitionsCsv(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?string $status = null,
        ?string $month = null,
        ?Admin $admin = null
    ): \Generator {
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

        yield [
            'STT',
            'Mã Học Sinh',
            'Họ Và Tên Học Sinh',
            'Số Điện Thoại',
            'Lớp Học',
            'Trung Tâm',
            'Tiêu Đề Hồ Sơ',
            'Tổng Học Phí (VND)',
            'Đã Đóng (VND)',
            'Còn Nợ (VND)',
            'Trạng Thái',
            'Hạn Đóng',
            'Đợt Thu',
            'Số Tiền Đợt (VND)',
            'Ngày Thu',
            'Phương Thức Thanh Toán',
            'Mã Giao Dịch',
            'Admin Thu Tiền',
            'Admin Tạo Khoản Thu',
        ];

        $tuitions = $this->studentTuitionRepository->getTuitionsForExport(
            $search,
            $centerIds,
            $classId,
            $status,
            $month
        );

        $stt = 1;

        foreach ($tuitions as $item) {
            $st          = is_object($item->status) ? $item->status->value : $item->status;
            $statusLabel = match ($st) {
                Constant::TUITION_STATUS_PAID, 'completed', 'paid' => 'Đã hoàn thành',
                Constant::TUITION_STATUS_PARTIAL, 'partial'        => 'Còn nợ (Đóng dở)',
                Constant::TUITION_STATUS_OVERDUE, 'overdue'        => 'Quá hạn',
                default                                            => 'Chưa đóng',
            };

            $classNames = '';

            if ($item->student && $item->student->classes->isNotEmpty()) {
                $classNames = $item->student->classes->pluck('name')->implode(', ');
            } elseif ($item->schoolClass) {
                $classNames = $item->schoolClass->name;
            }

            $creatorName = $item->creator?->full_name ?? ($item->creator?->username ?? '—');
            $payments    = $item->payments;

            if ($payments->isNotEmpty()) {
                foreach ($payments as $idx => $payment) {
                    $installmentLabel   = 'Đợt ' . ($idx + 1);
                    $paymentMethodLabel = Constant::PAYMENT_METHOD_LABELS[(int) $payment->payment_method] ?? 'Khác';
                    $receiverName = $payment->receiver?->full_name ?? ($payment->receiver?->username ?? '—');

                    yield [
                        $stt++,
                        $item->student?->student_code ?? '',
                        $item->student?->full_name ?? '',
                        $item->student?->phone ?? '',
                        $classNames,
                        $item->center?->name ?? '',
                        $item->title ?? '',
                        (float) $item->total_amount,
                        (float) $item->paid_amount,
                        (float) $item->remaining_amount,
                        $statusLabel,
                        $item->due_date ? Carbon::parse($item->due_date)->format('Y-m-d') : '',
                        $installmentLabel,
                        (float) $payment->amount,
                        $payment->payment_date ? Carbon::parse($payment->payment_date)->format('Y-m-d') : '',
                        $paymentMethodLabel,
                        $payment->transaction_code ?? '—',
                        $receiverName,
                        $creatorName,
                    ];
                }
            } else {
                yield [
                    $stt++,
                    $item->student?->student_code ?? '',
                    $item->student?->full_name ?? '',
                    $item->student?->phone ?? '',
                    $classNames,
                    $item->center?->name ?? '',
                    $item->title ?? '',
                    (float) $item->total_amount,
                    (float) $item->paid_amount,
                    (float) $item->remaining_amount,
                    $statusLabel,
                    $item->due_date ? Carbon::parse($item->due_date)->format('Y-m-d') : '',
                    'Chưa đóng',
                    0,
                    '—',
                    '—',
                    '—',
                    '—',
                    $creatorName,
                ];
            }
        }
    }
}
